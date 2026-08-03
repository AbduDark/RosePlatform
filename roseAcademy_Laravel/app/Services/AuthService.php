<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Mail\PasswordResetMail;
use Illuminate\Support\Facades\Mail;

class AuthService
{
    /**
     * Register a new user and automatically log them in.
     */
    public function register(array $data, Request $request): array
    {
        $user = User::create([
            'name'              => $data['name'],
            'email'             => $data['email'],
            'password'          => Hash::make($data['password']),
            'phone'             => $data['phone'],
            'gender'            => $data['gender'],
            'role'              => 'student',
            'email_verified_at' => now(), // Auto-verify email
        ]);

        // Auto-login: generate session & token
        $sessionId = Str::random(40);
        $sessionExpiry = now()->addHours(24);

        $deviceFingerprint = hash('sha256', 
            $request->userAgent() . 
            $request->ip() . 
            ($request->header('Accept-Language') ?? '') .
            ($request->header('Accept-Encoding') ?? '')
        );

        $user->update([
            'active_session_id'  => $sessionId,
            'device_fingerprint' => $deviceFingerprint,
            'last_login_at'      => now(),
            'last_activity_at'   => now(),
            'session_expires_at' => $sessionExpiry,
        ]);

        $token = $user->createToken('auth_token', ['*'], $sessionExpiry)->plainTextToken;

        $userData = [
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'phone'     => $user->phone,
            'gender'    => $user->gender,
            'role'      => $user->role ?? 'student',
            'image_url' => $user->image ? url('storage/' . $user->image) : null,
        ];

        return [
            'user'               => $userData,
            'token'              => $token,
            'session_id'         => $sessionId,
            'session_expires_at' => $sessionExpiry->toISOString(),
        ];
    }

    /**
     * Authenticate user and issue token.
     */
    public function login(User $user, Request $request): array
    {
        // Invalidate previous sessions
        $user->tokens()->delete();

        $deviceFingerprint = hash('sha256', 
            $request->userAgent() . 
            $request->ip() . 
            ($request->header('Accept-Language') ?? '') .
            ($request->header('Accept-Encoding') ?? '')
        );

        $sessionId = Str::random(40);
        $sessionExpiry = now()->addHours(24);

        $user->update([
            'active_session_id'  => $sessionId,
            'device_fingerprint' => $deviceFingerprint,
            'last_login_at'      => now(),
            'last_activity_at'   => now(),
            'session_expires_at' => $sessionExpiry,
        ]);

        $token = $user->createToken('auth_token', ['*'], $sessionExpiry)->plainTextToken;

        $userData = [
            'id'        => $user->id,
            'name'      => $user->name,
            'email'     => $user->email,
            'phone'     => $user->phone,
            'gender'    => $user->gender,
            'role'      => $user->role ?? 'student',
            'image_url' => $user->image ? url('storage/' . $user->image) : null,
        ];

        if ($user->image) {
            $userData['image'] = $user->image;
        }

        return [
            'token'              => $token,
            'session_id'         => $sessionId,
            'session_expires_at' => $sessionExpiry->toISOString(),
            'user'               => $userData,
        ];
    }

    /**
     * Logout current session.
     */
    public function logout(User $user): void
    {
        $user->tokens()->delete();
        $user->update([
            'active_session_id'  => null,
            'device_fingerprint' => null,
            'session_expires_at' => null,
        ]);
    }

    /**
     * Force logout from all devices.
     */
    public function forceLogout(User $user): void
    {
        $this->logout($user);
    }

    /**
     * Change user password.
     */
    public function changePassword(User $user, string $newPassword): void
    {
        $user->update([
            'password' => Hash::make($newPassword),
        ]);
    }

    /**
     * Send password reset email using password_reset_tokens table.
     */
    public function sendPasswordResetLink(User $user): void
    {
        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'token'      => $token,
                'expires_at' => now()->addMinutes(60),
                'created_at' => now(),
            ]
        );

        $resetUrl = url("/reset-password?token={$token}&email=" . urlencode($user->email));
        Mail::to($user->email)->send(new PasswordResetMail($resetUrl, $user));
    }

    /**
     * Reset password with token.
     */
    public function resetPassword(string $email, string $token, string $newPassword): bool
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('token', $token)
            ->first();

        if (!$record) {
            return false;
        }

        if (Carbon::parse($record->expires_at)->isPast()) {
            return false;
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return false;
        }

        $user->password = Hash::make($newPassword);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $email)->delete();

        return true;
    }
}
