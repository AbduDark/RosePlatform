<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\{
    AuthController,
    CourseController,
    LessonController,
    SubscriptionController,
    FavoriteController,
    CommentController,
    RatingController,
    UserController,
    AdminController,
    NotificationController,
    LessonVideoController
};
use App\Http\Middleware\AdminMiddleware;

/*
|--------------------------------------------------------------------------
| Health Check Routes
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    return response()->json([
        'message'   => 'Rose Academy API is running',
        'version'   => '1.0.0',
        'timestamp' => now(),
        'status'    => 'active'
    ]);
});
Route::get('/health', fn() => response()->json(['status' => 'OK', 'timestamp' => now()]));


/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
    Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
        Route::post('register',        [AuthController::class, 'register']);
        Route::post('login',           [AuthController::class, 'login'])->name('login');
        Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('reset-password',  [AuthController::class, 'resetPassword']);
        Route::post('force-logout',    [AuthController::class, 'forceLogout']);
    });

// Payment proof route - accessible for admins only
Route::middleware(['auth:sanctum', AdminMiddleware::class])->group(function () {
    Route::get('payment-proofs/{filename}', [SubscriptionController::class, 'getPaymentProof']);
});

// Public Course & Lesson Routes (Guests can view courses, curriculum, and free lessons!)
Route::get('courses',                          [CourseController::class, 'index']);
Route::get('courses/{id}',                     [CourseController::class, 'show']);
Route::get('courses/{id}/lessons',             [LessonController::class, 'index']);
Route::get('lessons/{id}',                     [LessonController::class, 'show']);
Route::get('lessons/{lessonId}/comments',      [CommentController::class, 'getLessonComments']);
Route::get('courses/{id}/ratings',             [RatingController::class, 'index']);

// Video stream & status — public endpoints
// The route MUST be named 'lesson.video.stream' for URL::temporarySignedRoute() to resolve it
Route::get('lessons/{lesson}/stream/{file?}', [LessonVideoController::class, 'streamVideo'])
     ->name('lesson.video.stream');
Route::get('lessons/{lesson}/status', [LessonVideoController::class, 'getProcessingStatus'])
     ->name('lesson.video.status');

// Pagination routes for all models
Route::get('subscriptions',                    [SubscriptionController::class, 'index']);
Route::get('lessons',                          [LessonController::class, 'publicIndex']);
Route::get('users',                            [UserController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Authenticated User Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum'])->group(function () {
    // Authentication
    Route::prefix('auth')->group(function () {
        Route::get('profile',          [AuthController::class, 'profile']);
        Route::put('update',           [AuthController::class, 'update']);
        Route::put('password',         [AuthController::class, 'changePassword']);
        Route::post('logout',          [AuthController::class, 'logout']);
    });

    // Subscriptions
    Route::post('subscribe',                           [SubscriptionController::class, 'subscribe']);
    Route::get('my-subscriptions',                     [SubscriptionController::class, 'mySubscriptions']);
    Route::post('subscriptions/{id}/cancel',           [SubscriptionController::class, 'cancelSubscription']);
    Route::post('subscriptions/renew',                 [SubscriptionController::class, 'renewSubscription']);
    Route::get('expired-subscriptions',                [SubscriptionController::class, 'getExpiredSubscriptions']);
    Route::get('subscriptions/status/{courseId}',      [SubscriptionController::class, 'getSubscriptionStatus']);

    // Notifications
    Route::get('notifications',                        [NotificationController::class, 'index']);
    Route::get('notifications/unread-count',           [NotificationController::class, 'unreadCount']);
    Route::get('notifications/{id}',                   [NotificationController::class, 'show']);
    Route::put('notifications/{id}/read',              [NotificationController::class, 'markAsRead']);
    Route::put('notifications/mark-all-read',          [NotificationController::class, 'markAllAsRead']);
    Route::delete('notifications/{id}',                [NotificationController::class, 'destroy']);

    // Comments (Create, Reply, Update, Like, Delete)
    Route::post('comments',                            [CommentController::class, 'store']);
    Route::put('comments/{id}',                        [CommentController::class, 'update']);
    Route::delete('comments/{id}',                     [CommentController::class, 'destroy']);
    Route::post('comments/{id}/like',                  [CommentController::class, 'toggleLike']);
    Route::get('my-comments',                          [CommentController::class, 'getUserComments']);

    // Favorites
    Route::post('favorite/{course_id}',                [FavoriteController::class, 'add']);
    Route::delete('favorite/{course_id}',              [FavoriteController::class, 'remove']);
    Route::get('favorite-subscriptions',               [FavoriteController::class, 'getFavoriteSubscriptions']);

    // Lessons progress
    Route::post('lessons/{id}/progress',               [LessonController::class, 'updateProgress']);
    Route::post('lessons/{id}/complete',               [LessonController::class, 'markCompleted']);

    // Ratings
    Route::post('ratings',                             [RatingController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/
    Route::middleware(['auth:sanctum', AdminMiddleware::class])
        ->prefix('admin')
        ->group(function () {
        // Courses & Lessons
        Route::post('/courses', [CourseController::class, 'store']);
        Route::put('/courses/{id}', [CourseController::class, 'update']);
        Route::patch('/courses/{id}', [CourseController::class, 'update']);
        Route::delete('/courses/{id}', [CourseController::class, 'destroy']);
        Route::get('lessons', [LessonController::class, 'adminIndex']);
        Route::apiResource('lessons', LessonController::class)->except(['index', 'show']);

    // Users & Subscriptions
    Route::controller(AdminController::class)->group(function () {
        Route::get('users',                 'getUsers');
        Route::get('users/{id}',             'getUserDetails');
        Route::put('users/{id}',             'updateUser');
        Route::delete('users/{id}',          'deleteUser');
        Route::get('dashboard/stats',        'getDashboardStats');

        // Subscriptions
        Route::get('subscriptions',          'getSubscriptions');
        Route::get('subscriptions/pending',  'getPendingSubscriptions');
        Route::match(['post', 'put'], 'subscriptions/{id}/approve', 'approveSubscription');
        Route::match(['post', 'put'], 'subscriptions/{id}/reject',  'rejectSubscription');
    });

    // Comments
    Route::prefix('comments')->group(function () {
        Route::get('pending',                 [AdminController::class, 'getPendingComments']);
        Route::match(['post', 'put'], '{id}/approve', [AdminController::class, 'approveComment']);
    });

    // Notifications
    Route::post('notifications/send',         [NotificationController::class, 'sendNotification']);
    Route::get('notifications/statistics',    [NotificationController::class, 'statistics']);
});
/*
|--------------------------------------------------------------------------
| Video Management Routes - Direct URL System
|--------------------------------------------------------------------------
*/
use App\Http\Controllers\Api\VideoController;

// Public video info
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('video/{lesson}/info', [VideoController::class, 'info'])->name('api.video.info');
});

// Admin video management
Route::middleware(['auth:sanctum', AdminMiddleware::class])
    ->prefix('admin')
    ->group(function () {
        Route::post('video/{lesson}/upload', [VideoController::class, 'upload'])->name('admin.video.upload');
        Route::post('video/{lesson}/youtube', [VideoController::class, 'saveYouTubeUrl'])->name('admin.video.youtube');
        Route::delete('video/{lesson}/delete', [VideoController::class, 'delete'])->name('admin.video.delete');
        Route::delete('video/{lesson}', [VideoController::class, 'delete']);
        Route::delete('lessons/{lesson}/video', [VideoController::class, 'delete']);
    });