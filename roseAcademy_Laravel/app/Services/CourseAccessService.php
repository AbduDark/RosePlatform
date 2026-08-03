<?php

namespace App\Services;

use App\Models\User;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Subscription;
use Illuminate\Support\Facades\Cache;

class CourseAccessService
{
    /**
     * Check if a user can access a specific course (enrolled / admin).
     */
    public function canAccessCourse(?User $user, int|Course $course): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->isAdminAny()) {
            return true;
        }

        $courseId = $course instanceof Course ? $course->id : $course;

        return Cache::remember("user_{$user->id}_sub_{$courseId}", now()->addMinutes(5), function () use ($user, $courseId) {
            return $user->subscriptions()
                ->where('course_id', $courseId)
                ->where('status', 'approved')
                ->where('is_active', true)
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                })
                ->exists();
        });
    }

    /**
     * Check if user (or guest) can access a specific lesson.
     * Visitors/Guests can watch ALL free lessons without enrollment!
     */
    public function canAccessLesson(?User $user, Lesson $lesson): bool
    {
        // 1. Free lessons are accessible to EVERYONE (guests, students, admins)
        if ($lesson->is_free) {
            return true;
        }

        // 2. Premium lessons require an authenticated user with subscription or admin
        if (!$user) {
            return false;
        }

        if ($user->isAdminAny()) {
            return true;
        }

        return $this->canAccessCourse($user, $lesson->course_id);
    }

    /**
     * Check if lesson matches user's gender (if applicable).
     */
    public function isGenderAllowed(?User $user, Lesson $lesson): bool
    {
        if (!$user || $user->isAdminAny()) {
            return true;
        }

        if (empty($lesson->target_gender) || $lesson->target_gender === 'both') {
            return true;
        }

        return $user->gender === $lesson->target_gender;
    }

    /**
     * Get detailed subscription status for a course.
     */
    public function getSubscriptionInfo(?User $user, int $courseId): ?array
    {
        if (!$user || $user->isAdminAny()) {
            return null;
        }

        $subscription = $user->subscriptions()
            ->where('course_id', $courseId)
            ->first();

        if (!$subscription) {
            return [
                'is_subscribed' => false,
                'status' => 'not_subscribed',
            ];
        }

        return [
            'subscription_id' => $subscription->id,
            'is_subscribed'   => $subscription->status === 'approved' && $subscription->is_active && !$subscription->isExpired(),
            'status'          => $subscription->status,
            'is_active'       => $subscription->is_active,
            'is_expired'      => $subscription->isExpired(),
            'expires_at'      => $subscription->expires_at,
            'days_remaining'  => $subscription->getDaysRemaining(),
        ];
    }
}
