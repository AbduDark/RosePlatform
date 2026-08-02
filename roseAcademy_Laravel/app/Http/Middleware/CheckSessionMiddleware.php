<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Traits\ApiResponseTrait;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon;

class CheckSessionMiddleware
{
    use ApiResponseTrait;

    public function handle(Request $request, Closure $next)
    {
        if (!Auth::guard('sanctum')->check()) {
            return response()->json([
                'success' => false,
                'message' => [
                    'ar' => 'يرجى تسجيل الدخول للوصول إلى هذا المحتوى',
                    'en' => 'Please login to access this content'
                ]
            ], Response::HTTP_UNAUTHORIZED);
        }

        $user = Auth::guard('sanctum')->user();

        // التحقق من انتهاء صلاحية الجلسة
        if ($user->session_expires_at && $user->session_expires_at->isPast()) {
            $user->tokens()->delete();
            $user->update([
                'active_session_id' => null,
                'device_fingerprint' => null,
                'session_expires_at' => null,
            ]);

            return $this->errorResponse([
                'ar' => 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى',
                'en' => 'Session expired. Please login again'
            ], 401);
        }

        // التحقق من بصمة الجهاز
        $currentDeviceFingerprint = hash('sha256', 
            $request->userAgent() . 
            $request->ip() . 
            ($request->header('Accept-Language') ?? '') .
            ($request->header('Accept-Encoding') ?? '')
        );

        if ($user->device_fingerprint && $user->device_fingerprint !== $currentDeviceFingerprint) {
            $user->tokens()->delete();
            $user->update([
                'active_session_id' => null,
                'device_fingerprint' => null,
                'session_expires_at' => null,
            ]);

            return $this->errorResponse([
                'ar' => 'تم اكتشاف تسجيل دخول من جهاز آخر. يرجى تسجيل الدخول مرة أخرى',
                'en' => 'Login detected from another device. Please login again'
            ], 401);
        }

        // تحديث آخر نشاط وتمديد الجلسة
        $user->update([
            'last_activity_at' => now(),
            'session_expires_at' => now()->addHours(24),
        ]);

        return $next($request);
    }
}
