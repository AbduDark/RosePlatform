<?php

namespace App\Jobs;

use App\Models\Lesson;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class ProcessLessonVideo implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $lesson;

    /**
     * The number of times the job may be attempted.
     */
    public $tries = 3;

    /**
     * The maximum number of seconds the job should run (2 hours for 10GB).
     */
    public $timeout = 7200;

    /**
     * Create a new job instance.
     */
    public function __construct(Lesson $lesson)
    {
        $this->lesson = $lesson;
        $this->onQueue('video-processing');
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $lesson = null;

        try {
            Log::info("🎬 بدء معالجة الفيديو للدرس: {$this->lesson->id}");

            $lesson = Lesson::where('id', $this->lesson->id)->first();

            if (!$lesson) {
                Log::error("❌ الدرس غير موجود: {$this->lesson->id}");
                throw new \Exception("الدرس غير موجود: {$this->lesson->id}");
            }

            Log::info("✅ تم العثور على الدرس: {$lesson->id} - العنوان: {$lesson->title}");

            if (empty($lesson->video_path)) {
                Log::error("❌ مسار الفيديو فارغ للدرس: {$lesson->id}");
                throw new \Exception("مسار الفيديو فارغ للدرس: {$lesson->id}");
            }

            Log::info("📁 مسار الفيديو: {$lesson->video_path}");

            if ($lesson->video_status === 'ready') {
                Log::info("⚠️ الفيديو جاهز بالفعل للدرس: {$lesson->id}");
                return;
            }

            $sourcePath = storage_path('app/' . $lesson->video_path);
            $outputDir = storage_path("app/private_videos/lesson_{$lesson->id}");

            Log::info("📍 المسار الكامل للفيديو: {$sourcePath}");
            Log::info("📂 مجلد الإخراج: {$outputDir}");

            $this->validateVideoFile($sourcePath);
            $this->createDirectories($outputDir);

            $lesson->update(['video_status' => 'processing']);
            Cache::put("video_processing_started_{$lesson->id}", time(), 7200);

            $finalVideoPath = $this->processVideo($lesson, $sourcePath, $outputDir);
            $videoInfo = $this->getVideoInfo($finalVideoPath);
            $relativePath = $this->getRelativePath($finalVideoPath);
            
            $lesson->update([
                'video_status' => 'ready',
                'video_duration' => $videoInfo['duration'] ?? null,
                'video_size' => $videoInfo['size'] ?? null,
                'video_path' => $relativePath
            ]);

            $lesson->updateVideoMetadata([
                'processing_completed_at' => now()->toISOString(),
                'final_file_path' => $relativePath,
                'processing_time_seconds' => time() - Cache::get("video_processing_started_{$lesson->id}", time()),
                'file_validated' => true,
                'protection_applied' => $lesson->is_video_protected,
            ]);

            Log::info("✅ تمت معالجة وتقليص الفيديو بنجاح للدرس: {$lesson->id}");

        } catch (\Exception $e) {
            Log::error("❌ خطأ في معالجة الفيديو للدرس: {$this->lesson->id}", [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'attempt' => $this->attempts(),
                'max_tries' => $this->tries
            ]);

            if ($lesson) {
                if ($this->attempts() >= $this->tries) {
                    $lesson->update(['video_status' => 'failed']);
                    Log::error("💥 فشل نهائي في معالجة الفيديو للدرس: {$this->lesson->id} بعد {$this->tries} محاولات");
                }
            }

            if ($this->attempts() >= $this->tries) {
                $this->cleanup();
            }

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("💥 فشل نهائي في معالجة الفيديو للدرس: {$this->lesson->id}", [
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString(),
            'attempts' => $this->attempts()
        ]);

        try {
            $lesson = Lesson::where('id', $this->lesson->id)->first();
            if ($lesson) {
                $lesson->update(['video_status' => 'failed']);
            }
        } catch (\Exception $e) {
            Log::error("❌ لا يمكن تحديث حالة الدرس {$this->lesson->id}: " . $e->getMessage());
        }

        $this->cleanup();
    }

    public function retryAfter(): int
    {
        return 60;
    }

    private function processVideo(Lesson $lesson, string $sourcePath, string $outputDir): string
    {
        $fileExtension = pathinfo($sourcePath, PATHINFO_EXTENSION);
        $compressedPath = $outputDir . '/compressed_video.mp4';

        // Attempt FFmpeg Compression if available
        if (function_exists('exec')) {
            Log::info("⚙️ بدء ضغط الفيديو باستخدام FFmpeg للدرس: {$lesson->id}");
            $command = "ffmpeg -y -i " . escapeshellarg($sourcePath) . " -vcodec libx264 -crf 26 -preset faster -acodec aac -b:a 128k " . escapeshellarg($compressedPath) . " 2>&1";
            
            $output = [];
            $returnVar = -1;
            exec($command, $output, $returnVar);

            if ($returnVar === 0 && file_exists($compressedPath) && filesize($compressedPath) > 0) {
                Log::info("✅ تم ضغط الفيديو بنجاح باستخدام FFmpeg: {$compressedPath}");
                if ($sourcePath !== $compressedPath && file_exists($sourcePath)) {
                    @unlink($sourcePath);
                }
                return $compressedPath;
            } else {
                Log::warning("⚠️ تعذر ضغط الفيديو بـ FFmpeg، سيتم الاحتفاظ بالملف الأصلي: " . implode("\n", array_slice($output, -5)));
            }
        }

        // Fallback: Copy to protected directory
        $finalVideoPath = $outputDir . '/video.' . $fileExtension;
        if ($sourcePath !== $finalVideoPath) {
            if (!copy($sourcePath, $finalVideoPath)) {
                throw new \Exception("فشل في نقل الفيديو إلى المجلد المحمي");
            }
            @unlink($sourcePath);
        }

        return $finalVideoPath;
    }

    private function getRelativePath(string $fullPath): string
    {
        $appPath = storage_path('app/');
        return str_replace($appPath, '', $fullPath);
    }

    private function validateVideoFile(string $videoPath): void
    {
        if (!file_exists($videoPath)) {
            throw new \Exception("ملف الفيديو غير موجود: {$videoPath}");
        }

        $fileSize = filesize($videoPath);
        if ($fileSize === false || $fileSize == 0) {
            throw new \Exception("ملف الفيديو فارغ: {$videoPath}");
        }

        if (!is_readable($videoPath)) {
            throw new \Exception("ملف الفيديو غير قابل للقراءة: {$videoPath}");
        }
    }

    private function getVideoInfo(string $videoPath): array
    {
        $fileSize = filesize($videoPath) ?: null;
        $duration = $this->getVideoDuration($videoPath);
        
        return [
            'duration' => $duration,
            'size' => $fileSize
        ];
    }

    private function getVideoDuration(string $videoPath): ?int
    {
        try {
            if (function_exists('exec')) {
                $command = "ffprobe -v quiet -show_entries format=duration -of csv=\"p=0\" " . escapeshellarg($videoPath);
                $output = null;
                $returnVar = null;
                exec($command, $output, $returnVar);
                if ($returnVar === 0 && !empty($output[0])) {
                    return (int) round(floatval($output[0]));
                }
            }
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    private function createDirectories(string $outputDir): void
    {
        if (!is_dir($outputDir)) {
            if (!mkdir($outputDir, 0755, true)) {
                throw new \Exception("فشل في إنشاء مجلد الإخراج: {$outputDir}");
            }
        }
    }

    private function cleanup(): void
    {
        try {
            $outputDir = storage_path("app/private_videos/lesson_{$this->lesson->id}");
            if (is_dir($outputDir) && count(scandir($outputDir)) <= 2) {
                @rmdir($outputDir);
            }
        } catch (\Exception $e) {
            Log::error("خطأ في تنظيف الملفات المؤقتة: " . $e->getMessage());
        }
    }
}
