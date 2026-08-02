<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\Subscription;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Traits\ApiResponseTrait;

class FavoriteController extends Controller
{
    use ApiResponseTrait;


    /**
     * إضافة كورس إلى المفضلة
     */
    public function add(Request $request, $courseId)
    {
        try {
            $user = $request->user();

            // تحقق من وجود الكورس
            $course = Course::find($courseId);
            if (!$course) {
                return $this->errorResponse([
                    'ar' => 'الكورس غير موجود',
                    'en' => 'Course not found'
                ], 404);
            }

            $favorite = Favorite::firstOrCreate([
                'user_id' => $user->id,
                'course_id' => $courseId,
            ]);

            return $this->successResponse($favorite, [
                'ar' => 'تم إضافة الكورس إلى المفضلة بنجاح',
                'en' => 'Course added to favorites successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('FavoriteController@add', ['error' => $e->getMessage()]);
            return $this->serverErrorResponse();
        }
    }

    /**
     * إزالة كورس من المفضلة
     */
    public function remove($courseId)
    {
        try {
            $user = Auth::user();

            $favorite = Favorite::where('user_id', $user->id)
                ->where('course_id', $courseId)
                ->first();

            if (!$favorite) {
                return $this->errorResponse([
                    'ar' => 'الكورس ليس في المفضلة',
                    'en' => 'Course is not in favorites'
                ], 404);
            }

            $favorite->delete();

            return $this->successResponse(null, [
                'ar' => 'تم إزالة الكورس من المفضلة بنجاح',
                'en' => 'Course removed from favorites successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('FavoriteController@remove', ['error' => $e->getMessage()]);
            return $this->serverErrorResponse();
        }
    }

    /**
     * جلب اشتراكات المستخدم للكورسات المفضلة فقط
     */
    public function getFavoriteSubscriptions()
    {
        try {
            $user = Auth::user();

            $subscriptions = Subscription::where('user_id', $user->id)
                ->whereHas('course.favorites', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->where('status', 'approved')
                ->where('is_active', true)
                ->with(['course', 'approvedBy'])
                ->orderByDesc('created_at')
                ->get();

            return $this->successResponse([
                'subscriptions' => $subscriptions
            ], [
                'ar' => 'تم جلب اشتراكاتك المفضلة بنجاح',
                'en' => 'Your favorite subscriptions retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('FavoriteController@getFavoriteSubscriptions', ['error' => $e->getMessage()]);
            return $this->serverErrorResponse();
        }
    }
}
