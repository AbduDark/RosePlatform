<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessLessonVideo;
use App\Models\Lesson;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use App\Http\Resources\LessonResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Storage;
use getID3;


class LessonVideoController extends Controller
{
    use ApiResponseTrait;

    // public function __construct()
    // {
    //     $this->middleware('auth:sanctum');
    // }

    /**
     * رفع الفيديو وبدء معالجته
     */
public function upload(Request $request, $lessonId)
    {
        try {
            // التحقق من صلاحيات المدير
            if (!$request->user()->isAdmin()) {
                return $this->errorResponse('غير مصرح لك برفع الفيديوهات', 403);
            }

            // Validate video file
            $request->validate([
                'video' => 'required|file|mimes:mp4,mov,avi,wmv,webm|max:10485760', // 10 GB
                'is_protected' => 'boolean'
            ]);

            // التحقق من أن الملف ليس فارغ
            if ($request->file('video')->getSize() == 0) {
                return $this->errorResponse('ملف الفيديو فارغ', 400);
            }

            $lesson = Lesson::find($lessonId);
            if (!$lesson) {
                return $this->errorResponse('الدرس غير موجود', 404);
            }

            // حذف الفيديو السابق إذا وجد
            if ($lesson->video_path) {
                $this->deleteOldVideo($lesson);
            }

            // إنشاء مجلد الدرس المحمي
            $lessonDir = 'private_videos/lesson_' . $lesson->id;
            if (!Storage::makeDirectory($lessonDir)) {
                Log::error("فشل في إنشاء المجلد: {$lessonDir}");
                return $this->errorResponse('فشل في إنشاء مجلد التخزين', 500);
            }

            // رفع الفيديو مباشرة للمجلد المحمي
            $extension = $request->video->getClientOriginalExtension();
            $fileName = 'source.' . $extension;
            $videoPath = $request->file('video')->storeAs($lessonDir, $fileName, 'local');

            // التحقق من وجود الملف بعد الرفع
            $fullPath = storage_path('app/' . $videoPath);
            if (!file_exists($fullPath)) {
                Log::error("الملف غير موجود بعد الرفع: {$fullPath}");
                return $this->errorResponse('فشل في رفع الملف إلى التخزين', 500);
            }

            // التحقق من permissions
            if (!is_readable($fullPath)) {
                $permissions = substr(sprintf('%o', fileperms($fullPath)), -4);
                Log::error("الملف غير قابل للقراءة: {$fullPath}, الصلاحيات: {$permissions}");
                return $this->errorResponse('الملف غير قابل للقراءة بسبب صلاحيات التخزين', 500);
            }

            // الحصول على metadata
            $videoSize = filesize($fullPath);
            if ($videoSize === false) {
                Log::error("فشل في الحصول على حجم الملف: {$fullPath}");
                return $this->errorResponse('فشل في الحصول على حجم الملف', 500);
            }

            $videoDuration = $this->getVideoDuration($fullPath);

            // تحديث الدرس كـ processing وإرسال المهمة للـ Queue
            $lesson->update([
                'video_path' => $videoPath,
                'video_status' => 'processing',
                'is_video_protected' => $request->get('is_protected', true),
                'video_duration' => $videoDuration,
                'video_size' => $videoSize,
                'video_metadata' => [
                    'original_name' => $request->video->getClientOriginalName(),
                    'uploaded_at' => now()->toISOString(),
                    'uploaded_by' => $request->user()->id,
                    'file_size' => $videoSize,
                    'mime_type' => $request->file('video')->getMimeType(),
                ]
            ]);

            // Dispatch background compression job
            ProcessLessonVideo::dispatch($lesson);

            return $this->successResponse([
                'lesson_id' => $lesson->id,
                'status' => 'processing',
                'upload_progress' => 100,
                'message' => 'تم رفع الفيديو وجاري المعالجة والضغط في الخلفية',
                'video_stream_url' => $lesson->getSignedStreamUrl(240, $request->bearerToken()),
                'status_url' => route('lesson.video.status', ['lesson' => $lesson->id])
            ], 'تم رفع الفيديو وجاري الضغط والمعالجة');

        } catch (\Exception $e) {
            Log::error('Video upload error: ' . $e->getMessage(), [
                'lesson_id' => $lessonId,
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            return $this->errorResponse('خطأ في رفع الفيديو: ' . $e->getMessage(), 500);
        }
    }

    /**
     * دالة مساعدة للحصول على مدة الفيديو (مع ffprobe و getID3)
     */
    /**
     * دالة مساعدة للحصول على مدة الفيديو (مع ffprobe و getID3)
     */
    private function getVideoDuration(string $videoPath): ?int
    {
        try {
            // حاول ffprobe الأول
            if (function_exists('exec')) {
                $command = "ffprobe -v quiet -show_entries format=duration -of csv=\"p=0\" " . escapeshellarg($videoPath);
                $output = null;
                $returnVar = null;
                exec($command, $output, $returnVar);
                if ($returnVar === 0 && !empty($output[0])) {
                    Log::info("تم الحصول على مدة الفيديو باستخدام ffprobe: {$output[0]} ثانية");
                    return (int) round(floatval($output[0]));
                }
            }

            // لو ffprobe فشل، استخدم getID3
            $getID3 = new getID3();
            $fileInfo = $getID3->analyze($videoPath);
            if (isset($fileInfo['playtime_seconds'])) {
                Log::info("تم الحصول على مدة الفيديو باستخدام getID3: {$fileInfo['playtime_seconds']} ثانية");
                return (int) round($fileInfo['playtime_seconds']);
            }

            Log::warning("لم يتم الحصول على مدة الفيديو: لا ffprobe ولا getID3 نجحا");
            return null;
        } catch (\Exception $e) {
            Log::error("خطأ في الحصول على مدة الفيديو: " . $e->getMessage());
            return null;
        }
    }

    /**
     * بث الفيديو المحمي (Protected Video Stream)
     * 
     * Authentication strategy:
     *   1. The URL itself is a signed, time-limited URL (generated by getSignedStreamUrl)
     *   2. For FREE lessons: a valid URL signature is sufficient — no auth required
     *   3. For PREMIUM lessons: user must be authenticated AND have an active subscription
     */
    public function streamVideo(Request $request, Lesson $lesson)
    {
        try {
            Log::info('STREAM_VIDEO_REQUEST', [
                'lesson_id' => $lesson->id,
                'is_free' => $lesson->is_free,
                'has_video' => $lesson->hasVideo(),
                'video_path' => $lesson->video_path,
                'video_status' => $lesson->video_status,
                'full_url' => $request->fullUrl(),
                'has_valid_signature' => $request->hasValidSignature(),
                'has_token_param' => $request->has('_t'),
            ]);

            // ─── Step 1: Validate signed URL (mandatory for everyone) ────────────
            if (!$request->hasValidSignature()) {
                Log::warning('STREAM_VIDEO_INVALID_SIGNATURE', [
                    'lesson_id' => $lesson->id,
                    'full_url' => $request->fullUrl(),
                    'app_url' => config('app.url'),
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'رابط البث غير صالح أو انتهت صلاحيته. يرجى إعادة تحميل الصفحة.',
                    'error'   => 'Invalid or expired signed URL',
                ], 403);
            }

            // ─── Step 2: Access control by lesson type ──────────────────────────
            if ($lesson->is_free) {
                // Free lesson: signature alone is enough — guests are welcome
                Log::info('Free lesson stream accessed via valid signature', [
                    'lesson_id' => $lesson->id,
                    'ip'        => $request->ip(),
                ]);
            } else {
                // Premium lesson: require authenticated user with subscription or admin
                //
                // IMPORTANT: HTML <video> elements CANNOT send Authorization headers
                // in their HTTP requests (including Range requests). The user's Sanctum
                // token is therefore embedded in the signed URL as the `_t` query param.
                // We must extract it and resolve the user manually.
                /** @var User|null $user */
                $user = auth('sanctum')->user();

                // Fallback: resolve user from the `_t` query parameter
                if (!$user && $request->has('_t')) {
                    $plainToken = $request->query('_t');
                    $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($plainToken);
                    if ($accessToken) {
                        $user = $accessToken->tokenable;
                        Log::info('Premium stream: user resolved from _t token', [
                            'lesson_id' => $lesson->id,
                            'user_id'   => $user->id,
                        ]);
                    }
                }

                if (!$user) {
                    Log::warning('Premium stream: no user resolved', [
                        'lesson_id' => $lesson->id,
                        'has_t'     => $request->has('_t'),
                        'ip'        => $request->ip(),
                    ]);
                    return response()->json([
                        'success' => false,
                        'message' => 'يجب تسجيل الدخول للوصول إلى هذا الدرس',
                        'error'   => 'Unauthorized',
                    ], 401);
                }

                if (!$this->canAccessLesson($user, $lesson)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'ليس لديك صلاحية لمشاهدة هذا الدرس. يرجى الاشتراك في الكورس.',
                        'error'   => 'Forbidden',
                    ], 403);
                }

                Log::info('Premium lesson stream accessed', [
                    'lesson_id' => $lesson->id,
                    'user_id'   => $user->id,
                    'ip'        => $request->ip(),
                ]);
            }

            // ─── Step 3: Verify video status and file exist ─────────────────────────
            if ($lesson->video_status === 'processing') {
                return response()->json([
                    'success' => false,
                    'message' => 'الفيديو قيد المعالجة حالياً. يرجى الانتظار لحين انتهاء المعالجة.',
                    'status'  => 'processing'
                ], 425);
            }

            if ($lesson->video_status === 'failed') {
                return response()->json([
                    'success' => false,
                    'message' => 'فشلت معالجة هذا الفيديو. يرجى التواصل مع المحاضر أو إعادة الرفع.',
                    'status'  => 'failed'
                ], 400);
            }

            if (!$lesson->hasVideo()) {
                return $this->errorResponse('الفيديو غير متوفر حالياً', 404);
            }

            $videoPath = storage_path('app/' . $lesson->video_path);
            if (!file_exists($videoPath)) {
                $videoPath = storage_path('app/public/' . $lesson->video_path);
            }

            if (!file_exists($videoPath)) {
                Log::error('Video file not found on disk', [
                    'lesson_id'  => $lesson->id,
                    'video_path' => $lesson->video_path,
                ]);
                return $this->errorResponse('ملف الفيديو غير موجود', 404);
            }

            if (!is_readable($videoPath)) {
                Log::error('Video file not readable', [
                    'lesson_id'   => $lesson->id,
                    'permissions' => substr(sprintf('%o', fileperms($videoPath)), -4),
                ]);
                return $this->errorResponse('لا يمكن قراءة ملف الفيديو', 500);
            }

            // ─── Step 4: Range streaming ────────────────────────────────────────
            $fileSize = filesize($videoPath);
            $start    = 0;
            $end      = $fileSize - 1;
            $partial  = false;

            if ($request->hasHeader('Range')) {
                $range   = $request->header('Range');
                $matches = [];
                if (preg_match('/bytes=(\d+)-(\d*)/', $range, $matches)) {
                    $start   = intval($matches[1]);
                    if (!empty($matches[2])) {
                        $end = min(intval($matches[2]), $fileSize - 1);
                    }
                    $partial = true;
                }
            }

            $length   = $end - $start + 1;
            $mimeType = mime_content_type($videoPath) ?: 'video/mp4';

            // ─── Step 5: Anti-download & Cross-Origin streaming headers ──────────────────
            $origin = $request->header('Origin') ?: 'https://rose-academy.com';
            $headers = [
                'Content-Type'                => $mimeType,
                'Content-Length'              => $length,
                'Accept-Ranges'               => 'bytes',
                'Content-Disposition'         => 'inline',
                'Access-Control-Allow-Origin' => $origin,
                'Access-Control-Allow-Methods'=> 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers'=> 'Range, Authorization, Content-Type, Origin, Accept',
                'Access-Control-Expose-Headers' => 'Content-Range, Content-Length, Accept-Ranges, Content-Type',
                'Access-Control-Allow-Credentials' => 'true',
                'Cache-Control'               => 'no-cache, no-store, must-revalidate, private, max-age=0',
                'Pragma'                      => 'no-cache',
                'Expires'                     => '0',
                'X-Content-Type-Options'      => 'nosniff',
                'X-Robots-Tag'               => 'noindex, nofollow, nosnippet, noarchive',
                'Referrer-Policy'             => 'strict-origin-when-cross-origin',
                'X-Download-Options'          => 'noopen',
            ];

            if ($partial) {
                $headers['Content-Range'] = "bytes {$start}-{$end}/{$fileSize}";
            }

            $statusCode = $partial ? 206 : 200;

            return response()->stream(function () use ($videoPath, $start, $end) {
                if (function_exists('set_time_limit')) {
                    @set_time_limit(0);
                }
                if (function_exists('ignore_user_abort')) {
                    @ignore_user_abort(true);
                }

                $stream = fopen($videoPath, 'rb');
                if (!$stream) {
                    return;
                }

                fseek($stream, $start);
                $bytesRemaining = $end - $start + 1;
                $chunkSize = 65536; // 64KB chunks for optimal streaming and buffering

                while ($bytesRemaining > 0 && !feof($stream)) {
                    $bytesToRead = min($chunkSize, $bytesRemaining);
                    $chunk = fread($stream, $bytesToRead);
                    
                    if ($chunk === false) {
                        break;
                    }

                    echo $chunk;
                    $bytesRemaining -= strlen($chunk);
                    
                    if (ob_get_level()) {
                        ob_flush();
                    }
                    flush();
                }
                
                fclose($stream);
            }, $statusCode, $headers);

        } catch (\Exception $e) {
            Log::error('Stream video error: ' . $e->getMessage(), [
                'lesson_id' => $lesson->id,
                'user_id' => $user->id ?? null,
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->errorResponse('خطأ في بث الفيديو', 500);
        }
    }

    /**
     * Alternative method name for compatibility
     */
    public function stream(Request $request, Lesson $lesson)
    {
        return $this->streamVideo($request, $lesson);
    }
    /**
     * حالة معالجة الفيديو
     */
    public function getProcessingStatus(Request $request, Lesson $lesson)
    {
        try {
            $status = $lesson->video_status ?? 'pending';
            $progress = $this->calculateProcessingProgress($lesson, $status);

            $response = [
                'lesson_id' => $lesson->id,
                'status' => $status,
                'progress' => $progress,
                'message' => $lesson->getVideoStatusMessage(),
                'has_video' => $lesson->hasVideo(),
                'is_protected' => $lesson->is_video_protected,
            ];

            if ($status === 'processing') {
                $response['estimated_time_remaining'] = $this->getEstimatedTimeRemaining($lesson, $status);
                $response['processing_steps'] = $this->getProcessingSteps($lesson, $status);
            }

            if ($status === 'ready') {
                $response['video_info'] = $this->getVideoInfo($lesson);
                
                // إضافة رابط البث للمستخدمين المخولين
                $user = $request->user();
                if ($user && $this->canAccessLesson($user, $lesson)) {
                    $response['stream_url'] = $lesson->getSignedStreamUrl(240, $request->bearerToken());
                }
            }

            if ($status === 'failed') {
                $response['error_info'] = [
                    'message' => 'فشل في معالجة الفيديو',
                    'suggestion' => 'يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني'
                ];
            }

            return $this->successResponse($response, 'تم جلب حالة المعالجة بنجاح');

        } catch (\Exception $e) {
            Log::error('Status check error: ' . $e->getMessage(), [
                'lesson_id' => $lesson->id,
                'trace' => $e->getTraceAsString()
            ]);

            return $this->errorResponse('خطأ في التحقق من حالة المعالجة', 500);
        }
    }

    /**
     * حذف الفيديو (admin only)
     */
    public function deleteVideo(Request $request, Lesson $lesson)
    {
        try {
            if (!$request->user()->isAdmin()) {
                return $this->errorResponse('غير مصرح لك بحذف الفيديوهات', 403);
            }

            $this->deleteOldVideo($lesson);

            $lesson->update([
                'video_path' => null,
                'video_status' => null,
                'video_duration' => null,
                'video_size' => null,
                'video_token' => null,
                'video_token_expires_at' => null,
                'video_metadata' => null,
            ]);

            return $this->successResponse([], 'تم حذف الفيديو بنجاح');

        } catch (\Exception $e) {
            Log::error('Video deletion error: ' . $e->getMessage(), [
                'lesson_id' => $lesson->id,
                'user_id' => $request->user()->id,
                'trace' => $e->getTraceAsString()
            ]);

            return $this->errorResponse('خطأ في حذف الفيديو', 500);
        }
    }

    /**
     * إعادة تجديد رمز الوصول للفيديو
     */
    public function refreshVideoToken(Request $request, Lesson $lesson)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->errorResponse('يجب تسجيل الدخول أولاً', 401);
            }

            if (!$this->canAccessLesson($user, $lesson)) {
                return $this->errorResponse('ليس لديك صلاحية للوصول لهذا الدرس', 403);
            }

            if (!$lesson->hasVideo()) {
                return $this->errorResponse('الفيديو غير متوفر', 404);
            }

            if (!$lesson->is_video_protected) {
                return $this->errorResponse('هذا الفيديو غير محمي', 400);
            }

            $token = $lesson->generateVideoToken(120); // صالح لمدة ساعتين

            return $this->successResponse([
                'token' => $token,
                'expires_at' => $lesson->video_token_expires_at,
                'stream_url' => $lesson->getSignedStreamUrl(240, $request->bearerToken()),
            ], 'تم تجديد رمز الوصول بنجاح');

        } catch (\Exception $e) {
            Log::error('Token refresh error: ' . $e->getMessage());
            return $this->errorResponse('خطأ في تجديد رمز الوصول', 500);
        }
    }

    /**
     * التحقق من صلاحية الوصول للدرس
     */
    // private function canAccessLesson($user, Lesson $lesson): bool
    // {
    //     if (!$user) {
    //         return false;
    //     }

    //     // المديرين يمكنهم الوصول لكل شيء
    //     if ($user->isAdmin()) {
    //         return true;
    //     }

    //     // التحقق من توافق الجنس
    //     if ($lesson->target_gender !== 'both' && $lesson->target_gender !== $user->gender) {
    //         return false;
    //     }

    //     // التحقق من حالة الكورس
    //     if (!$lesson->course->is_active) {
    //         return false;
    //     }

    //     // الدروس المجانية متاحة للجميع
    //     if ($lesson->is_free) {
    //         return true;
    //     }

    //     // التحقق من الاشتراك
    //     return $user->isSubscribedTo($lesson->course_id);
    // }

    /**
     * عرض جميع الدروس
     */
    public function index()
    {
        $lessons = Lesson::all();
        return LessonResource::collection($lessons);
    }

    /**
     * عرض درس محدد
     */
    public function show($id)
    {
        $lesson = Lesson::findOrFail($id);
        return new LessonResource($lesson);
    }

    /**
     * الحصول على فيديوهات الدرس
     */
    public function getLessonVideos($lessonId)
    {
        $lesson = Lesson::findOrFail($lessonId);
        $videos = $lesson->videos;
        return response()->json($videos);
    }

    /**
     * Get video information helper method
     */
    private function getVideoInfo(Lesson $lesson): array
    {
        return [
            'duration' => $lesson->getFormattedDuration(),
            'size' => $lesson->getFormattedSize(),
            'duration_seconds' => $lesson->video_duration,
            'size_bytes' => $lesson->video_size,
        ];
    }

    /**
     * Calculate processing progress helper method
     */
    private function calculateProcessingProgress(Lesson $lesson, string $status): int
    {
        return match($status) {
            'pending' => 0,
            'processing' => 50,
            'ready' => 100,
            'failed' => 0,
            default => 0
        };
    }

    /**
     * Get estimated time remaining helper method
     */
    private function getEstimatedTimeRemaining(Lesson $lesson, string $status): string
    {
        if ($status === 'processing') {
            return 'حوالي 2-3 دقائق';
        }
        return '';
    }

    /**
     * Get processing steps helper method
     */
    private function getProcessingSteps(Lesson $lesson, string $status): array
    {
        return [
            [
                'step' => 'تحميل الفيديو',
                'status' => 'completed'
            ],
            [
                'step' => 'فحص الملف',
                'status' => $status === 'processing' ? 'in_progress' : 'completed'
            ],
            [
                'step' => 'تطبيق الحماية',
                'status' => $status === 'ready' ? 'completed' : 'pending'
            ]
        ];
    }

    /**
     * تشغيل الفيديو (طريقة بديلة)
     */
    public function playVideo($lessonId, $videoId)
    {
        $lesson = Lesson::findOrFail($lessonId);
        
        // Check if the user has access to the lesson
        $user = Auth::user();
        if (!$this->canAccessLesson($user, $lesson)) {
            return response()->json(['message' => 'Unauthorized access'], 403);
        }

        if (!$lesson->hasVideo()) {
            return response()->json(['message' => 'Video not found'], 404);
        }

        $videoPath = storage_path('app/' . $lesson->video_path);

        if (!file_exists($videoPath)) {
            return response()->json(['message' => 'Video file not found'], 404);
        }

        // Return a response that can be streamed
        return Response::stream(function () use ($videoPath) {
            $stream = fopen($videoPath, 'rb');
            fpassthru($stream);
            fclose($stream);
        }, 200, [
            'Content-Type' => mime_content_type($videoPath),
            'Content-Disposition' => 'inline; filename="' . basename($videoPath) . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate, private',
            'Pragma' => 'no-cache',
        ]);
    }

    /**
     * التحقق من صلاحية الوصول للدرس
     */
    private function canAccessLesson(User $user, Lesson $lesson): bool
    {
        // Admin can access everything
        if ($user->isAdminAny()) {
            return true;
        }

        // Gender check (only if user gender is set and target_gender is not 'both')
        if ($user->gender && $lesson->target_gender && $lesson->target_gender !== 'both' && $lesson->target_gender !== $user->gender) {
            return false;
        }

        // Free lessons accessible to all
        if ($lesson->is_free) {
            return true;
        }

        // Course subscription check
        return $user->canAccessCourse($lesson->course_id);
    }

    /**
     * حذف الفيديو القديم
     */
    private function deleteOldVideo(Lesson $lesson): void
    {
        if ($lesson->video_path) {
            // حذف الملف من storage
            if (Storage::exists($lesson->video_path)) {
                Storage::delete($lesson->video_path);
            }

            // حذف مجلد الفيديو المحمي
            $videoDir = storage_path("app/private_videos/lesson_{$lesson->id}");
            if (is_dir($videoDir)) {
                $this->deleteDirectory($videoDir);
            }
        }
    }

    /**
     * حذف مجلد بالكامل
     */
    private function deleteDirectory(string $dir): bool
    {
        if (!is_dir($dir)) {
            return false;
        }

        $files = array_diff(scandir($dir), ['.', '..']);

        foreach ($files as $file) {
            $filePath = $dir . DIRECTORY_SEPARATOR . $file;

            if (is_dir($filePath)) {
                $this->deleteDirectory($filePath);
            } else {
                unlink($filePath);
            }
        }

        return rmdir($dir);
    }

    /**
     * حساب تقدم المعالجة
     */
    // private function calculateProcessingProgress(Lesson $lesson, string $status): int
    // {
    //     switch ($status) {
    //         case 'pending':
    //             return 0;
    //         case 'processing':
    //             $processingStarted = Cache::get("video_processing_started_{$lesson->id}");
    //             if ($processingStarted) {
    //                 $elapsedMinutes = (time() - $processingStarted) / 60;
    //                 return min(95, 10 + ($elapsedMinutes * 15)); // تقدير تقدم المعالجة
    //             }
    //             return 50;
    //         case 'ready':
    //             return 100;
    //         case 'failed':
    //             return 0;
    //         default:
    //             return 0;
    //     }
    // }

    /**
     * تقدير الوقت المتبقي للمعالجة
     */
    // private function getEstimatedTimeRemaining(Lesson $lesson, string $status): ?string
    // {
    //     if ($status !== 'processing') return null;

    //     $processingStarted = Cache::get("video_processing_started_{$lesson->id}");
    //     if (!$processingStarted) return null;

    //     $elapsedMinutes = (time() - $processingStarted) / 60;

    //     if ($elapsedMinutes < 1) {
    //         return 'أقل من دقيقة';
    //     } elseif ($elapsedMinutes < 3) {
    //         return 'حوالي 2-3 دقائق';
    //     } elseif ($elapsedMinutes < 5) {
    //         return 'حوالي 3-5 دقائق';
    //     } else {
    //         return 'قريباً...';
    //     }
    // }

    /**
     * خطوات المعالجة
     */
    // private function getProcessingSteps(Lesson $lesson, string $status): array
    // {
    //     return [
    //         [
    //             'step' => 'تحميل الفيديو',
    //             'status' => 'completed',
    //             'description' => 'تم تحميل الفيديو بنجاح'
    //         ],
    //         [
    //             'step' => 'التحقق من الملف',
    //             'status' => 'completed',
    //             'description' => 'تم التحقق من صحة ملف الفيديو'
    //         ],
    //         [
    //             'step' => 'معالجة الفيديو',
    //             'status' => $status === 'processing' ? 'active' : 'pending',
    //             'description' => 'جاري نقل الفيديو إلى المجلد المحمي'
    //         ],
    //         [
    //             'step' => 'إنهاء المعالجة',
    //             'status' => $status === 'ready' ? 'completed' : 'pending',
    //             'description' => 'تجهيز الفيديو للمشاهدة'
    //         ]
    //     ];
    // }

    /**
     * معلومات الفيديو
     */
    // private function getVideoInfo(Lesson $lesson): array
    // {
    //     return [
    //         'duration' => $lesson->getFormattedDuration(),
    //         'size' => $lesson->getFormattedSize(),
    //         'is_protected' => $lesson->is_video_protected,
    //         'uploaded_at' => $lesson->updated_at?->diffForHumans(),
    //         'metadata' => $lesson->video_metadata,
    //     ];
    // }
}
