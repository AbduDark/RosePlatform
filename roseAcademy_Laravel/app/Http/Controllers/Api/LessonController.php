<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lesson;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Models\Course;
use App\Models\Subscription;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Models\User;
use App\Http\Resources\LessonResource;

class LessonController extends Controller
{
    use ApiResponseTrait;

    // public function __construct()
    // {
    //     $this->middleware('auth:sanctum');
    // }

    /**
     * Get all lessons with pagination for public access
     */
    public function publicIndex(Request $request)
    {
        try {
            $query = Lesson::with(['course'])
                ->orderBy('order', 'asc')
                ->orderBy('created_at', 'desc');

            // Search functionality
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Filter by course
            if ($request->has('course_id')) {
                $query->where('course_id', $request->get('course_id'));
            }

            // Filter by free lessons only for non-authenticated users
            $user = $request->user();
            if (!$user || !$user->isAdmin()) {
                $query->where('is_free', true);
            }

            $lessons = $query->paginate(10);

            return LessonResource::collection($lessons)->additional([
                'message' => [
                    'ar' => 'تم جلب الدروس بنجاح',
                    'en' => 'Lessons retrieved successfully'
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Public get lessons error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Get all lessons for admin
     */
    public function adminIndex(Request $request)
    {
        try {
            // التحقق من صلاحيات المدير
            if (!auth()->user()->isAdmin()) {
                return $this->errorResponse('غير مصرح لك بالوصول', 403);
            }

            $query = Lesson::with(['course']);

            // Search functionality
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // Filter by course
            if ($request->has('course_id')) {
                $query->where('course_id', $request->get('course_id'));
            }

            // Filter by gender
            if ($request->has('target_gender')) {
                $query->where('target_gender', $request->get('target_gender'));
            }

            // Filter by video status
            if ($request->has('video_status')) {
                $query->where('video_status', $request->get('video_status'));
            }

            $lessons = $query->orderBy('order', 'asc')
                ->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 15));

            return $this->successResponse($lessons, [
                'ar' => 'تم جلب جميع الدروس بنجاح',
                'en' => 'All lessons retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Admin get lessons error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Get lessons for a specific course
     */
    public function index($courseId, Request $request)
    {
        try {
            $course = Course::findOrFail($courseId);
            // Support optional authentication (works for guests, students, and admins)
            $user = $request->user() ?? auth('sanctum')->user();

            $isAdmin = $user && $user->isAdminAny();
            $isSubscribed = $user && ($isAdmin || $user->canAccessCourse($courseId));

            // التحقق من حالة الكورس (يُستثنى الأدمن)
            if (!$course->is_active && !$isAdmin) {
                return $this->errorResponse([
                    'ar' => 'هذه الدورة غير متاحة حالياً',
                    'en' => 'This course is currently unavailable'
                ], 403);
            }

            $query = $course->lessons();

            // Log total lessons before filtering
            $totalLessonsCount = $course->lessons()->count();
            Log::info('Lessons debug', [
                'course_id' => $courseId,
                'total_lessons' => $totalLessonsCount,
                'user_id' => $user?->id,
                'user_gender' => $user?->gender,
                'is_admin' => $isAdmin,
            ]);

            // الفلترة بحسب الجنس للطلاب غير الأدمن إذا كان جنس الطالب محدداً
            if (!$isAdmin && $user && !empty($user->gender)) {
                $query->where(function ($q) use ($user) {
                    $q->where('target_gender', 'both')
                        ->orWhere('target_gender', $user->gender)
                        ->orWhereNull('target_gender');
                });
            }

            $lessons = $query->orderBy('order', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

            Log::info('Lessons after gender filter', [
                'course_id' => $courseId,
                'filtered_count' => $lessons->count(),
                'lesson_genders' => $lessons->pluck('target_gender', 'id')->toArray(),
            ]);

            // تحديد إمكانية الوصول ورابط الفيديو لكل درس
            $rawToken = $request->bearerToken();
            $lessons->each(function ($lesson) use ($user, $isAdmin, $isSubscribed, $rawToken) {
                $canAccess = $isAdmin || $lesson->is_free || $isSubscribed;
                $lesson->can_access = $canAccess;

                $videoStatus = $lesson->video_status ?? ($lesson->has_video ? 'ready' : null);

                if ($canAccess && $lesson->has_video && ($videoStatus === 'ready' || empty($lesson->video_status))) {
                    $lesson->video_url = ($lesson->video_source === 'youtube') ? null : $lesson->getSignedStreamUrl(240, $rawToken);
                    $lesson->video_duration_formatted = $lesson->getFormattedDuration();
                    $lesson->video_size_formatted = $lesson->getFormattedSize();
                } else {
                    $lesson->video_url = null;
                }
            });

            $activeSubscription = ($user && !$isAdmin) ? $user->getActiveSubscription($courseId) : null;

            return $this->successResponse([
                'course' => $course,
                'lessons' => $lessons->values(),
                'user_subscribed' => (bool) $isSubscribed,
                'subscription_info' => $activeSubscription ? [
                    'expires_at' => $activeSubscription->expires_at,
                    'days_remaining' => $activeSubscription->getDaysRemaining()
                ] : null
            ], 'تم جلب الدروس بنجاح');

        } catch (ModelNotFoundException $e) {
            return $this->errorResponse([
                'ar' => 'الكورس المطلوب غير موجود',
                'en' => 'The requested course does not exist'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Get lessons error: ' . $e->getMessage(), [
                'course_id' => $courseId,
                'trace' => $e->getTraceAsString()
            ]);
            return $this->serverErrorResponse();
        }
    }

    /**
     * Store a new lesson
     */
    public function store(Request $request)
    {
        try {
            // التحقق من صلاحيات المدير
            if (!auth()->user()->isAdmin()) {
                return $this->errorResponse('غير مصرح لك بإنشاء الدروس', 403);
            }

            $request->validate([
                'course_id' => 'required|exists:courses,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'content' => 'required|string',
                'order' => 'nullable|integer|min:0',
                'duration_minutes' => 'nullable|integer|min:0',
                'is_free' => 'boolean',
                'target_gender' => 'required|in:male,female,both',
                'is_video_protected' => 'boolean',
            ]);

            $lesson = Lesson::create(array_merge(
                $request->all(),
                ['is_video_protected' => $request->get('is_video_protected', true)]
            ));

            $this->clearCoursesAndLessonsCache();

            return $this->successResponse(
                $lesson->load('course'),
                'تم إنشاء الدرس بنجاح',
                201
            );

        } catch (\Exception $e) {
            Log::error('Create lesson error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Update lesson
     */
    public function update(Request $request, $id)
    {
        try {
            // التحقق من صلاحيات المدير
            if (!auth()->user()->isAdmin()) {
                return $this->errorResponse('غير مصرح لك بتعديل الدروس', 403);
            }

            $lesson = Lesson::findOrFail($id);

            $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'content' => 'sometimes|string',
                'order' => 'nullable|integer|min:0',
                'duration_minutes' => 'nullable|integer|min:0',
                'is_free' => 'boolean',
                'target_gender' => 'sometimes|in:male,female,both',
                'is_video_protected' => 'boolean',
            ]);

            $lesson->update($request->all());

            $this->clearCoursesAndLessonsCache();

            return $this->successResponse(
                $lesson->load('course'),
                'تم تحديث الدرس بنجاح'
            );

        } catch (\Exception $e) {
            Log::error('Update lesson error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Delete lesson
     */
    public function destroy($id)
    {
        try {
            // التحقق من صلاحيات المدير
            if (!auth()->user()->isAdmin()) {
                return $this->errorResponse('غير مصرح لك بحذف الدروس', 403);
            }

            $lesson = Lesson::findOrFail($id);

            // حذف ملف الفيديو إذا وجد
            $lesson->deleteVideoFile();

            $lesson->delete();

            $this->clearCoursesAndLessonsCache();

            return $this->successResponse([], 'تم حذف الدرس بنجاح');

        } catch (\Exception $e) {
            Log::error('Delete lesson error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    private function clearCoursesAndLessonsCache(): void
    {
        try {
            if (in_array(config('cache.default'), ['redis', 'memcached'])) {
                \Illuminate\Support\Facades\Cache::tags(['courses'])->flush();
            } else {
                \Illuminate\Support\Facades\Cache::flush();
            }
        } catch (\Throwable $e) {
            try {
                \Illuminate\Support\Facades\Cache::flush();
            } catch (\Throwable $ex) {
                // Ignore fallback
            }
        }
        try {
            \Illuminate\Support\Facades\Cache::forget('admin_dashboard_stats');
        } catch (\Throwable $e) {
            // Ignore
        }
    }

    /**
     * Show single lesson
     */
    public function show($id)
    {
        try {
            /** @var User|null $user */
            $user = auth('sanctum')->user() ?? auth()->user();

            $lesson = Lesson::with(['course'])->find($id);

            if (!$lesson) {
                return $this->errorResponse('الدرس غير موجود', 404);
            }

            if (!$lesson->course->is_active) {
                return $this->errorResponse([
                    'ar' => 'هذه الدورة غير نشطة',
                    'en' => 'This course is not active'
                ], 403);
            }

            // Visitor/Guest access: free lessons are allowed for everyone
            $canAccess = $lesson->is_free;
            if ($user) {
                if ($user->isAdminAny() || $user->isSubscribedTo($lesson->course_id)) {
                    $canAccess = true;
                }
            }

            if (!$canAccess) {
                return $this->subscriptionRequiredResponse();
            }

            $lesson->can_access = true;

            // Video information
            if ($lesson->has_video) {
                $videoStatus = $lesson->video_status ?? 'ready';
                if ($lesson->video_source === 'youtube') {
                    $lesson->embed_url = $lesson->getSecureYouTubeEmbedUrl();
                } else if ($videoStatus === 'ready' || empty($lesson->video_status)) {
                    $rawToken = $request->bearerToken();
                    $lesson->video_url = $lesson->getSignedStreamUrl(240, $rawToken);
                } else {
                    $lesson->video_url = null;
                }
                $lesson->video_duration_formatted = $lesson->getFormattedDuration();
                $lesson->video_size_formatted = $lesson->getFormattedSize();
                $lesson->video_status_message = $lesson->getVideoStatusMessage();
            }

            // Include user progress if authenticated
            if ($user) {
                $progress = \App\Models\LessonProgress::where('user_id', $user->id)
                    ->where('lesson_id', $lesson->id)
                    ->first();

                $lesson->progress = [
                    'is_completed' => $progress ? (bool) $progress->is_completed : false,
                    'last_position_seconds' => $progress ? (int) $progress->last_position_seconds : 0,
                ];
            }

            return $this->successResponse($lesson, 'تم جلب الدرس بنجاح');

        } catch (\Exception $e) {
            Log::error('Error retrieving lesson: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Update video watch progress (resume playback position)
     */
    public function updateProgress(Request $request, $id)
    {
        try {
            $user = auth()->user();
            if (!$user) {
                return $this->unauthorizedResponse();
            }

            $lesson = Lesson::findOrFail($id);
            $position = (int) $request->input('last_position_seconds', 0);

            $progress = \App\Models\LessonProgress::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'lesson_id' => $lesson->id,
                ],
                [
                    'course_id' => $lesson->course_id,
                    'last_position_seconds' => $position,
                ]
            );

            return $this->successResponse($progress, 'تم تحديث تقدم المشاهدة');
        } catch (\Exception $e) {
            Log::error('Error updating lesson progress: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Mark lesson as completed
     */
    public function markCompleted(Request $request, $id)
    {
        try {
            $user = auth()->user();
            if (!$user) {
                return $this->unauthorizedResponse();
            }

            $lesson = Lesson::findOrFail($id);

            $progress = \App\Models\LessonProgress::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'lesson_id' => $lesson->id,
                ],
                [
                    'course_id' => $lesson->course_id,
                    'is_completed' => true,
                    'completed_at' => now(),
                ]
            );

            return $this->successResponse($progress, 'تم إكمال الدرس بنجاح');
        } catch (\Exception $e) {
            Log::error('Error marking lesson complete: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Get lesson video information for admin
     */
    public function getVideoInfo($id)
    {
        try {
            if (!auth()->user()->isAdmin()) {
                return $this->errorResponse('غير مصرح لك بالوصول', 403);
            }

            $lesson = Lesson::findOrFail($id);

            $videoInfo = [
                'lesson_id' => $lesson->id,
                'has_video' => $lesson->hasVideo(),
                'video_status' => $lesson->video_status,
                'video_path' => $lesson->video_path,
                'video_duration' => $lesson->video_duration,
                'video_size' => $lesson->video_size,
                'video_duration_formatted' => $lesson->getFormattedDuration(),
                'video_size_formatted' => $lesson->getFormattedSize(),
                'is_video_protected' => $lesson->is_video_protected,
                'video_file_exists' => $lesson->videoFileExists(),
                'video_metadata' => $lesson->video_metadata,
                'video_status_message' => $lesson->getVideoStatusMessage(),
            ];

            return $this->successResponse($videoInfo, 'تم جلب معلومات الفيديو بنجاح');

        } catch (\Exception $e) {
            Log::error('Get video info error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }
}