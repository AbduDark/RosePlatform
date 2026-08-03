<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\CommentLike;
use App\Models\Lesson;
use App\Models\User;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class CommentController extends Controller
{
    use ApiResponseTrait;

    /**
     * Get comments for a specific lesson with threaded replies and likes.
     */
    public function getLessonComments($lessonId, Request $request)
    {
        try {
            $lesson = Lesson::with('course')->findOrFail($lessonId);
            /** @var User|null $user */
            $user = auth('sanctum')->user() ?? Auth::user();

            if (!$lesson->course->is_active) {
                return $this->errorResponse([
                    'ar' => 'الكورس غير متاح حالياً',
                    'en' => 'Course is not available'
                ], 403);
            }

            // Check if user has access to lesson comments (free lesson or active subscriber/admin)
            $canAccess = $lesson->is_free;
            if ($user) {
                if ($user->isAdminAny() || $user->isSubscribedTo($lesson->course_id)) {
                    $canAccess = true;
                }
            }

            if (!$canAccess) {
                return $this->errorResponse([
                    'ar' => 'يجب أن تكون مشتركاً في الكورس لعرض التعليقات',
                    'en' => 'You must be subscribed to the course to view comments'
                ], 403);
            }

            // Fetch top-level comments (where parent_id is NULL) with nested replies
            $commentsQuery = Comment::where('lesson_id', $lessonId)
                ->whereNull('parent_id')
                ->with([
                    'user:id,name,email,image',
                    'replies.user:id,name,email,image',
                    'replies.likes'
                ])
                ->latest();

            $comments = $commentsQuery->paginate($request->get('per_page', 15));

            // Attach user-specific like information
            $comments->getCollection()->transform(function ($comment) use ($user) {
                $comment->is_liked = $user ? $comment->isLikedBy($user) : false;
                $comment->replies->transform(function ($reply) use ($user) {
                    $reply->is_liked = $user ? $reply->isLikedBy($user) : false;
                    return $reply;
                });
                return $comment;
            });

            return $this->successResponse($comments, [
                'ar' => 'تم جلب التعليقات بنجاح',
                'en' => 'Comments retrieved successfully'
            ]);

        } catch (ModelNotFoundException $e) {
            return $this->errorResponse([
                'ar' => 'الدرس المطلوب غير موجود',
                'en' => 'The requested lesson does not exist'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Get lesson comments error: ' . $e->getMessage(), [
                'lesson_id' => $lessonId,
                'trace'     => $e->getTraceAsString()
            ]);
            return $this->serverErrorResponse();
        }
    }

    /**
     * Add a new comment or reply to an existing comment.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'lesson_id' => 'required|exists:lessons,id',
                'parent_id' => 'nullable|exists:comments,id',
                'content'   => 'required|string|min:1|max:1000'
            ], [
                'lesson_id.required' => 'معرف الدرس مطلوب|Lesson ID is required',
                'lesson_id.exists'   => 'الدرس غير موجود|Lesson does not exist',
                'content.required'   => 'محتوى التعليق مطلوب|Comment content is required',
                'content.min'        => 'التعليق يجب أن يحتوي على حرف واحد على الأقل|Comment must be at least 1 character',
                'content.max'        => 'التعليق لا يجب أن يتجاوز 1000 حرف|Comment must not exceed 1000 characters'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse(new ValidationException($validator));
            }

            /** @var User $user */
            $user = Auth::user();
            $lesson = Lesson::with('course')->findOrFail($request->lesson_id);

            if (!$lesson->course->is_active) {
                return $this->errorResponse([
                    'ar' => 'الكورس غير متاح حالياً',
                    'en' => 'Course is not available'
                ], 403);
            }

            // Authorization: admin, free lesson, or active subscriber
            if (!$user->isAdminAny() && !$lesson->is_free) {
                if (!$user->isSubscribedTo($lesson->course_id)) {
                    return $this->errorResponse([
                        'ar' => 'يجب أن تكون مشتركاً في الكورس لإضافة تعليق',
                        'en' => 'You must be subscribed to the course to add a comment'
                    ], 403);
                }
            }

            $comment = Comment::create([
                'user_id'   => $user->id,
                'lesson_id' => $lesson->id,
                'course_id' => $lesson->course_id,
                'parent_id' => $request->parent_id ?? null,
                'content'   => trim($request->content),
            ]);

            $comment->load(['user:id,name,email,image']);
            $comment->is_liked = false;

            return $this->successResponse([
                'comment' => $comment
            ], [
                'ar' => 'تم إضافة التعليق بنجاح',
                'en' => 'Comment added successfully'
            ], 201);

        } catch (ModelNotFoundException $e) {
            return $this->errorResponse([
                'ar' => 'الدرس المطلوب غير موجود',
                'en' => 'The requested lesson does not exist'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Comment store error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Edit user's own comment.
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'content' => 'required|string|min:1|max:1000'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse(new ValidationException($validator));
            }

            $comment = Comment::findOrFail($id);
            /** @var User $user */
            $user = Auth::user();

            if ($comment->user_id !== $user->id && !$user->isAdminAny()) {
                return $this->forbiddenResponse();
            }

            $comment->update([
                'content' => trim($request->content)
            ]);

            $comment->load(['user:id,name,email,image']);

            return $this->successResponse([
                'comment' => $comment
            ], [
                'ar' => 'تم تحديث التعليق بنجاح',
                'en' => 'Comment updated successfully'
            ]);

        } catch (ModelNotFoundException $e) {
            return $this->errorResponse([
                'ar' => 'التعليق غير موجود',
                'en' => 'Comment not found'
            ], 404);
        } catch (\Exception $e) {
            return $this->serverErrorResponse();
        }
    }

    /**
     * Delete comment (owner or admin).
     */
    public function destroy($id)
    {
        try {
            $comment = Comment::findOrFail($id);
            /** @var User $user */
            $user = Auth::user();

            if ($comment->user_id !== $user->id && !$user->isAdminAny()) {
                return $this->forbiddenResponse();
            }

            $comment->delete();

            return $this->successResponse(null, [
                'ar' => 'تم حذف التعليق بنجاح',
                'en' => 'Comment deleted successfully'
            ]);

        } catch (ModelNotFoundException $e) {
            return $this->errorResponse([
                'ar' => 'التعليق المطلوب غير موجود',
                'en' => 'The requested comment does not exist'
            ], 404);
        } catch (\Exception $e) {
            return $this->serverErrorResponse();
        }
    }

    /**
     * Toggle like on a comment.
     */
    public function toggleLike($id)
    {
        try {
            $comment = Comment::findOrFail($id);
            /** @var User $user */
            $user = Auth::user();

            $existingLike = CommentLike::where('user_id', $user->id)
                ->where('comment_id', $comment->id)
                ->first();

            if ($existingLike) {
                $existingLike->delete();
                $comment->decrement('likes_count');
                $liked = false;
            } else {
                CommentLike::create([
                    'user_id'    => $user->id,
                    'comment_id' => $comment->id,
                ]);
                $comment->increment('likes_count');
                $liked = true;
            }

            return $this->successResponse([
                'liked'       => $liked,
                'likes_count' => $comment->fresh()->likes_count,
            ], [
                'ar' => $liked ? 'تم تسجيل الإعجاب' : 'تم إلغاء الإعجاب',
                'en' => $liked ? 'Liked' : 'Unliked',
            ]);

        } catch (ModelNotFoundException $e) {
            return $this->errorResponse([
                'ar' => 'التعليق غير موجود',
                'en' => 'Comment not found'
            ], 404);
        } catch (\Exception $e) {
            return $this->serverErrorResponse();
        }
    }

    /**
     * Get comments created by current user.
     */
    public function getUserComments()
    {
        try {
            /** @var User $user */
            $user = Auth::user();

            $comments = Comment::where('user_id', $user->id)
                ->with(['lesson:id,title', 'course:id,title'])
                ->latest()
                ->get();

            return $this->successResponse([
                'comments' => $comments,
                'total'    => $comments->count()
            ], [
                'ar' => 'تم جلب تعليقاتك بنجاح',
                'en' => 'Your comments retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return $this->serverErrorResponse();
        }
    }
}