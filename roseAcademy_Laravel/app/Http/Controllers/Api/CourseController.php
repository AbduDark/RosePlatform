<?php

namespace App\Http\Controllers\Api;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Storage, Cache, Log, Validator, Auth};
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use App\Models\{Course, Subscription, User};
use App\Http\Resources\CourseResource;

use App\Services\{CourseImageGenerator, ImageOptimizer};
use Symfony\Component\HttpFoundation\Response;

class CourseController extends BaseController
{
    use ApiResponseTrait;

    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index', 'show']);
    }

    public function index(Request $request)
    {
        try {
            $cacheKey = 'courses_' . md5(serialize($request->all()));

            try {
                if (in_array(config('cache.default'), ['redis', 'memcached'])) {
                    $courses = Cache::tags(['courses'])->remember($cacheKey, now()->addMinutes(30), function () use ($request) {
                        return $this->buildCoursesQuery($request);
                    });
                } else {
                    $courses = Cache::remember($cacheKey, now()->addMinutes(30), function () use ($request) {
                        return $this->buildCoursesQuery($request);
                    });
                }
            } catch (\Throwable $e) {
                $courses = $this->buildCoursesQuery($request);
            }

            return CourseResource::collection($courses)->additional([
                'message' => [
                    'ar' => 'تم جلب الكورسات بنجاح',
                    'en' => 'Courses retrieved successfully'
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Courses index error', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);
            return $this->serverErrorResponse();
        }
    }

    private function buildCoursesQuery(Request $request)
    {
        $query = Course::where('is_active', true);

        // Search
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%")
                  ->orWhere('instructor_name', 'like', "%{$request->search}%");
            });
        }

        // Filters
        $query->when($request->level, fn($q, $level) => $q->where('level', $level))
             ->when($request->language, fn($q, $lang) => $q->where('language', $lang))
             ->when($request->grade, fn($q, $grade) => $q->where('grade', $grade))
             ->when($request->min_price, fn($q, $min) => $q->where('price', '>=', $min))
             ->when($request->max_price, fn($q, $max) => $q->where('price', '<=', $max));

        // Sorting
        $sortBy = in_array($request->sort_by, ['title', 'price', 'created_at', 'duration_hours'])
            ? $request->sort_by
            : 'created_at';

        $sortOrder = $request->sort_order === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sortBy, $sortOrder)
                   ->paginate($request->per_page ?? 10);
    }

    private function clearCoursesCache(): void
    {
        try {
            if (in_array(config('cache.default'), ['redis', 'memcached'])) {
                Cache::tags(['courses'])->flush();
            } else {
                Cache::flush();
            }
        } catch (\Throwable $e) {
            try {
                Cache::flush();
            } catch (\Throwable $ex) {
                // Ignore fallback
            }
        }
    }

    public function show($id, Request $request)
    {
        try {
            $user = $request->user();
            $course = Course::with(['ratings.user'])
                          ->findOrFail($id);

            if (!$course->is_active) {
                return $this->errorResponse([
                    'ar' => 'الكورس غير متاح حالياً',
                    'en' => 'Course not available'
                ], 404);
            }

            $course->load(['lessons' => function($query) use ($user, $course) {
                $query->orderBy('order');

                if ($user) {
                    if ($user->isSubscribedTo($course->id)) {
                        $query->where(function($q) use ($user) {
                            $q->where('target_gender', 'both')
                              ->orWhere('target_gender', $user->gender);
                        });
                    } else {
                        $query->where('is_free', true)
                              ->where(function($q) use ($user) {
                                  $q->where('target_gender', 'both')
                                    ->orWhere('target_gender', $user->gender);
                              });
                    }
                } else {
                    $query->where('is_free', true)
                          ->where('target_gender', 'both');
                }
            }]);

            $course->average_rating = $course->averageRating();
            $course->total_ratings = $course->totalRatings();
            $course->is_subscribed = $user ? $user->isSubscribedTo($id) : false;
            $course->is_favorited = $user ? $user->hasFavorited($id) : false;

            $subscriptionInfo = null;

            if ($user && !$user->isAdmin()) {
                $subscription = $user->subscriptions()
                    ->where('course_id', $id)
                    ->where('status', 'approved')
                    ->first();

                if ($subscription) {
                    $subscriptionInfo = [
                        'is_subscribed' => true,
                        'is_active' => $subscription->is_active,
                        'is_expired' => $subscription->isExpired(),
                        'expires_at' => $subscription->expires_at,
                        'days_remaining' => $subscription->getDaysRemaining(),
                        'hours_remaining' => $subscription->getHoursRemaining(),
                        'is_expiring_soon' => $subscription->isExpiringSoon(),
                        'subscription_id' => $subscription->id
                    ];
                } else {
                    $subscriptionInfo = [
                        'is_subscribed' => false,
                        'message' => [
                            'ar' => 'يجب الاشتراك في هذا الكورس للوصول إلى محتواه',
                            'en' => 'You must subscribe to this course to access its content'
                        ]
                    ];
                }
            }


            return $this->successResponse(
                new CourseResource($course),
                [
                    'ar' => 'تم جلب الكورس بنجاح',
                    'en' => 'Course retrieved successfully'
                ]
            );

        } catch (ModelNotFoundException $e) {
            return $this->errorResponse([
                'ar' => 'الكورس غير موجود',
                'en' => 'Course not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Course show error', [
                'course_id' => $id,
                'user_id' => $user?->id ?? 'guest',
                'error' => $e->getMessage()
            ]);
            return $this->serverErrorResponse();
        }
    }

   public function store(Request $request)
{
    // التحقق من أن المستخدم مسجل دخول ومدير
    if (!auth()->check() || !auth()->user()->isAdmin()) {
        return response()->json([
            'success' => false,
            'status_code' => 403,
            'message' => [
                'ar' => 'ممنوع - ليس لديك صلاحية للوصول',
                'en' => 'Forbidden - You do not have permission'
            ]
        ], 403);
    }

    try {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255|unique:courses',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'level' => 'nullable|in:beginner,intermediate,advanced',
            'duration_hours' => 'nullable|integer|min:0',
            'requirements' => 'nullable|string',
            'instructor_name' => 'nullable|string|max:255',
            'language' => 'nullable|string|max:10',
            'grade' => 'required|in:الاول,الثاني,الثالث',
            'image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $data = $request->except('image');
        $data['language'] = $data['language'] ?? 'ar';
        $data['instructor_name'] = $data['instructor_name'] ?? 'أ.روز';
        $data['level'] = $data['level'] ?? 'beginner';

        // رفع الصورة
        if ($request->hasFile('image')) {
            $data['image'] = $this->uploadCourseImage($request->file('image'));
        }

        $course = Course::create($data);
        $this->clearCoursesCache();
        Cache::forget('admin_dashboard_stats');
        $course->image_url = $course->image 
            ? url($course->image) 
            : null;
        return $this->successResponse(
            new CourseResource($course),
            [
                'ar' => 'تم إنشاء الكورس بنجاح',
                'en' => 'Course created successfully'
            ],
            201
        );

    } catch (ValidationException $e) {
        return $this->validationErrorResponse($e);
    } catch (\Exception $e) {
        Log::error('Error creating course: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
        return $this->errorResponse(
            ['ar' => 'حدث خطأ أثناء إنشاء الدورة: ' . $e->getMessage(), 'en' => 'An error occurred while creating the course: ' . $e->getMessage()],
            Response::HTTP_INTERNAL_SERVER_ERROR
        );
    } catch (\Throwable $e) {
        Log::error('Error creating course: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

        return $this->errorResponse(
            ['ar' => 'حدث خطأ أثناء إنشاء الدورة: ' . $e->getMessage(), 'en' => 'An error occurred while creating the course: ' . $e->getMessage()],
            Response::HTTP_INTERNAL_SERVER_ERROR
        );
    }
}



    public function update(Request $request, $id)
    {
    
    if (!auth()->check() || !auth()->user()->isAdmin()) {
        return response()->json([
            'success' => false,
            'status_code' => 403,
            'message' => [
                'ar' => 'ممنوع - ليس لديك صلاحية للوصول',
                'en' => 'Forbidden - You do not have permission'
            ]
        ], 403);
    }

    try {
        $course = Course::findOrFail($id);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255|unique:courses,title,' . $id,
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'level' => 'nullable|in:beginner,intermediate,advanced',
            'duration_hours' => 'nullable|integer|min:0',
            'requirements' => 'nullable|string',
            'instructor_name' => 'nullable|string|max:255',
            'language' => 'nullable|string|max:10',
            'grade' => 'nullable|in:الاول,الثاني,الثالث',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $data = $validated;

        // ✅ لو فيه صورة جديدة في الريكويست
        if ($request->hasFile('image')) {
            // 🗑️ امسح الصورة القديمة من السيرفر لو موجودة
            if ($course->image && file_exists(public_path($course->image))) {
                @unlink(public_path($course->image));
            }

            // 📤 ارفع الصورة الجديدة
            $data['image'] = $this->uploadCourseImage($request->file('image'));
        }

        // ✍️ حدّث الكورس بالبيانات
        $course->update($data);
        $this->clearCoursesCache();
        Cache::forget('course_' . $id);
        Cache::forget('admin_dashboard_stats');

        // 📌 جهّز الريسبونس مع لينك الصورة
        $courseFresh = $course->fresh();
        $courseFresh->image_url = $courseFresh->image 
            ? url($courseFresh->image) 
            : null;

        return response()->json([
            'success' => true,
            'message' => [
                'ar' => 'تم تحديث الكورس بنجاح',
                'en' => 'Course updated successfully'
            ],
            'data'    => $courseFresh
        ]);
    } catch (ValidationException $e) {
        return response()->json([
            'success' => false,
            'message' => [
                'ar' => 'خطأ في التحقق من البيانات',
                'en' => 'Validation error'
            ],
            'errors'  => $e->errors()
        ], 422);
    } catch (ModelNotFoundException $e) {
        return response()->json([
            'success' => false,
            'message' => [
                'ar' => 'الكورس غير موجود',
                'en' => 'Course not found'
            ]
        ], 404);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => [
                'ar' => 'حدث خطأ غير متوقع',
                'en' => 'Unexpected error occurred'
            ],
            'error'   => $e->getMessage()
        ], 500);
    }
}







    public function destroy(string $id)
    {
        // التحقق من أن المستخدم مسجل دخول ومدير
        if (!auth()->check() || !auth()->user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'status_code' => 403,
                'message' => [
                    'ar' => 'ممنوع - ليس لديك صلاحية للوصول',
                    'en' => 'Forbidden - You do not have permission'
                ]
            ], 403);
        }

        try {
            $course = Course::findOrFail($id);

            if ($course->image && Storage::disk('public')->exists($course->image)) {
                Storage::disk('public')->delete($course->image);
            }

            $course->delete();
            $this->clearCoursesCache();
            Cache::forget('course_' . $id);
            Cache::forget('admin_dashboard_stats');

            return $this->successResponse(
                null,
                [
                    'ar' => 'تم حذف الكورس بنجاح',
                    'en' => 'Course deleted successfully'
                ]
            );

        } catch (ModelNotFoundException $e) {
            return $this->errorResponse([
                'ar' => 'الكورس غير موجود',
                'en' => 'Course not found'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Course deletion error', [
                'course_id' => $id,
                'error' => $e->getMessage()
            ]);
            return $this->serverErrorResponse();
        }
    }

    /**
     * Upload course image with permission fallback
     */
    private function uploadCourseImage($image): string
    {
        $filename = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
        $uploadDir = public_path('uploads/courses');

        if (!file_exists($uploadDir)) {
            @mkdir($uploadDir, 0777, true);
        }

        if (file_exists($uploadDir) && is_writable($uploadDir)) {
            $image->move($uploadDir, $filename);
            return 'uploads/courses/' . $filename;
        }

        // Fallback to public storage disk
        $path = $image->storeAs('uploads/courses', $filename, 'public');
        return 'storage/' . $path;
    }
}