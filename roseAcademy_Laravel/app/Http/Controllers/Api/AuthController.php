<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Auth;
use App\Traits\ApiResponseTrait;
use Illuminate\Validation\ValidationException;
use App\Services\AuthService;

class AuthController extends Controller
{
    use ApiResponseTrait;

    protected AuthService $authService;

    public function __construct(AuthService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Register a new user and log them in immediately.
     */
    public function register(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name'     => 'required|string|max:255',
                'email'    => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed|regex:/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/',
                'phone'    => 'required|string|max:20|unique:users',
                'gender'   => 'required|in:male,female',
                'image'    => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048'
            ], [
                'name.required'     => 'الاسم مطلوب|Name is required',
                'name.string'       => 'الاسم يجب أن يكون نص|Name must be a string',
                'name.max'          => 'الاسم يجب ألا يزيد عن 255 حرف|Name must not exceed 255 characters',
                'email.required'    => 'البريد الإلكتروني مطلوب|Email is required',
                'email.email'       => 'البريد الإلكتروني غير صحيح|Invalid email format',
                'email.unique'      => 'البريد الإلكتروني مستخدم بالفعل|Email already exists',
                'password.required' => 'كلمة المرور مطلوبة|Password is required',
                'password.min'      => 'كلمة المرور يجب ألا تقل عن 8 أحرف|Password must be at least 8 characters',
                'password.confirmed'=> 'تأكيد كلمة المرور غير مطابق|Password confirmation does not match',
                'phone.required'    => 'رقم الهاتف مطلوب|Phone number is required',
                'phone.max'         => 'رقم الهاتف يجب ألا يزيد عن 20 رقم|Phone number must not exceed 20 digits',
                'phone.unique'      => 'رقم الهاتف مستخدم بالفعل|Phone number already exists',
                'gender.required'   => 'الجنس مطلوب|Gender is required',
                'gender.in'         => 'الجنس يجب أن يكون ذكر أو أنثى|Gender must be male or female'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse(new ValidationException($validator));
            }

            $authData = $this->authService->register($validator->validated(), $request);

            return $this->successResponse($authData, [
                'ar' => 'تم إنشاء الحساب وتسجيل الدخول بنجاح',
                'en' => 'Account created and logged in successfully'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Registration failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return $this->serverErrorResponse();
        }
    }

    /**
     * User login.
     */
    public function login(Request $request)
    {
        try {
            $key = 'login:' . $request->ip();
            if (RateLimiter::tooManyAttempts($key, 10)) {
                $seconds = RateLimiter::availableIn($key);
                return $this->errorResponse([
                    'ar' => 'محاولات دخول كثيرة جداً، حاول مرة أخرى خلال ' . $seconds . ' ثانية',
                    'en' => 'Too many login attempts. Try again in ' . $seconds . ' seconds.'
                ], 429);
            }

            $validator = Validator::make($request->all(), [
                'email'    => 'required|email',
                'password' => 'required',
            ], [
                'email.required'    => 'البريد الإلكتروني مطلوب|Email is required',
                'email.email'       => 'البريد الإلكتروني غير صحيح|Invalid email format',
                'password.required' => 'كلمة المرور مطلوبة|Password is required',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse(new ValidationException($validator));
            }

            $user = User::where('email', $request->email)->first();

            if (!$user || !Hash::check($request->password, $user->password)) {
                RateLimiter::hit($key, 900);

                Log::channel('security')->warning('Failed login attempt', [
                    'email'      => $request->email,
                    'ip'         => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);

                return $this->errorResponse([
                    'ar' => 'بيانات الدخول غير صحيحة',
                    'en' => 'Invalid credentials'
                ], 401);
            }

            RateLimiter::clear($key);

            $authData = $this->authService->login($user, $request);

            return $this->successResponse($authData, [
                'ar' => 'تم تسجيل الدخول بنجاح',
                'en' => 'Login successful'
            ]);
        } catch (\Exception $e) {
            Log::error('Login error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Logout user session.
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorizedResponse();
            }

            $this->authService->logout($user);

            return $this->successResponse([], [
                'ar' => 'تم تسجيل الخروج بنجاح',
                'en' => 'Logged out successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Logout error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Force logout from all active sessions.
     */
    public function forceLogout(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return $this->unauthorizedResponse();
            }

            $this->authService->forceLogout($user);

            return $this->successResponse([], [
                'ar' => 'تم تسجيل الخروج من جميع الأجهزة بنجاح',
                'en' => 'Successfully logged out from all devices'
            ]);
        } catch (\Exception $e) {
            Log::error('Force logout error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Get profile of authenticated user.
     */
    public function profile()
    {
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        return $this->successResponse([
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'phone'     => $user->phone,
            'gender'    => $user->gender,
            'role'      => $user->role,
            'image'     => $user->image ? url('storage/' . $user->image) : null,
            'image_url' => $user->image ? url('storage/' . $user->image) : null,
        ], [
            'ar' => 'تم جلب بيانات البروفايل بنجاح',
            'en' => 'Profile retrieved successfully'
        ]);
    }

    /**
     * Update user profile.
     */
    public function update(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) {
            return $this->unauthorizedResponse();
        }

        $validator = Validator::make($request->all(), [
            'name'  => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse(new ValidationException($validator));
        }

        $user->name = $request->name;
        if ($request->filled('phone')) {
            $user->phone = $request->phone;
        }

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('avatars', $filename, 'public');
            $user->image = $path;
        }

        $user->save();

        return $this->successResponse([
            'id'        => $user->id,
            'name'      => $user->name,
            'phone'     => $user->phone,
            'image'     => $user->image ? url('storage/' . $user->image) : null,
            'image_url' => $user->image ? url('storage/' . $user->image) : null,
        ], [
            'ar' => 'تم تحديث البروفايل بنجاح',
            'en' => 'Profile updated successfully'
        ]);
    }

    /**
     * Change password for logged in user.
     */
    public function changePassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password'     => [
                    'required',
                    'string',
                    'min:8',
                    'regex:/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/',
                    'confirmed'
                ]
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse(new ValidationException($validator));
            }

            $user = $request->user();

            if (!Hash::check($request->current_password, $user->password)) {
                return $this->errorResponse([
                    'ar' => 'كلمة المرور الحالية غير صحيحة',
                    'en' => 'Current password is incorrect'
                ], 422);
            }

            $this->authService->changePassword($user, $request->new_password);

            return $this->successResponse([], [
                'ar' => 'تم تغيير كلمة المرور بنجاح',
                'en' => 'Password changed successfully'
            ]);
        } catch (\Exception $e) {
            return $this->serverErrorResponse();
        }
    }

    /**
     * Send password reset email link.
     */
    public function forgotPassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|exists:users,email'
            ], [
                'email.required' => 'البريد الإلكتروني مطلوب|Email is required',
                'email.email'    => 'البريد الإلكتروني غير صحيح|Invalid email format',
                'email.exists'   => 'البريد الإلكتروني غير مسجل لدينا|Email not found in our records'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse(new ValidationException($validator));
            }

            $user = User::where('email', $request->email)->first();
            $this->authService->sendPasswordResetLink($user);

            return $this->successResponse([], [
                'ar' => 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
                'en' => 'Password reset link has been sent to your email'
            ]);
        } catch (\Exception $e) {
            Log::error('Forgot password error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Reset password using token.
     */
    public function resetPassword(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'token'    => 'required|string',
                'email'    => 'required|email|exists:users,email',
                'password' => [
                    'required',
                    'string',
                    'min:8',
                    'regex:/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/',
                    'confirmed'
                ]
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse(new ValidationException($validator));
            }

            $success = $this->authService->resetPassword($request->email, $request->token, $request->password);

            if (!$success) {
                return $this->errorResponse([
                    'ar' => 'رابط غير صالح أو منتهي الصلاحية',
                    'en' => 'Invalid or expired reset link'
                ], 400);
            }

            return $this->successResponse([], [
                'ar' => 'تم تغيير كلمة المرور بنجاح',
                'en' => 'Password changed successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Reset password error: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }
}
