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
            if (!file_exists($sourcePath)) {
                $sourcePath = storage_path('app/public/' . $lesson->video_path);
            }

            $outputDir = storage_path("app/hls/lesson_{$lesson->id}");

            Log::info("📍 المسار الكامل للفيديو: {$sourcePath}");
            Log::info("📂 مجلد الإخراج (HLS): {$outputDir}");

            $this->validateVideoFile($sourcePath);
            $this->createDirectories($outputDir);

            $lesson->update(['video_status' => 'processing']);
            Cache::put("video_processing_started_{$lesson->id}", time(), 7200);

            $finalVideoPath = $this->processVideoToHls($lesson, $sourcePath, $outputDir);
            $videoInfo = $this->getVideoInfo($sourcePath);
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
                'hls_generated' => str_ends_with($relativePath, '.m3u8'),
            ]);

            Log::info("✅ تمت معالجة وتقطيع الفيديو إلى HLS بنجاح للدرس: {$lesson->id}");

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

    private function processVideoToHls(Lesson $lesson, string $sourcePath, string $outputDir): string
    {
        $fileExtension = pathinfo($sourcePath, PATHINFO_EXTENSION);
        $playlistPath = $outputDir . '/playlist.m3u8';
        $segmentPattern = $outputDir . '/segment_%03d.ts';

        // Attempt FFmpeg HLS Conversion if available
        if (function_exists('exec')) {
            Log::info("⚙️ بدء تقطيع وتحويل الفيديو لـ HLS باستخدام FFmpeg للدرس: {$lesson->id}");
            $command = "ffmpeg -y -threads 2 -i " . escapeshellarg($sourcePath) . " -codec:v libx264 -crf 23 -preset faster -codec:a aac -b:a 128k -hls_time 6 -hls_playlist_type vod -hls_segment_filename " . escapeshellarg($segmentPattern) . " " . escapeshellarg($playlistPath) . " 2>&1";
            
            $output = [];
            $returnVar = -1;
            exec($command, $output, $returnVar);

            if ($returnVar === 0 && file_exists($playlistPath) && filesize($playlistPath) > 0) {
                Log::info("✅ تم تحويل الفيديو بنجاح إلى HLS: {$playlistPath}");
                if ($sourcePath !== $playlistPath && file_exists($sourcePath)) {
                    @unlink($sourcePath);
                }
                return $playlistPath;
            } else {
                Log::warning("⚠️ تعذر تحويل الفيديو لـ HLS عبر FFmpeg: " . implode("\n", array_slice($output, -5)));
            }
        }

        // Fallback: Copy raw file if HLS conversion failed
        $fallbackVideoPath = $outputDir . '/video.' . $fileExtension;
        if ($sourcePath !== $fallbackVideoPath) {
            if (!copy($sourcePath, $fallbackVideoPath)) {
                throw new \Exception("فشل في نقل الفيديو إلى مجلد المعالجة");
            }
            @unlink($sourcePath);
        }

        return $fallbackVideoPath;
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
