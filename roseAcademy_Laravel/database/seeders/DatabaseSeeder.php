<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Main Admin User
        User::updateOrCreate(
            ['email' => 'admin@rose-academy.com'],
            [
                'name' => 'مدير النظام',
                'password' => Hash::make('admin123password'),
                'phone' => '01000000000',
                'gender' => 'male',
                'role' => 'admin',
                'is_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        // 2. Create Demo Student Account
        User::updateOrCreate(
            ['email' => 'student@rose-academy.com'],
            [
                'name' => 'طالب تجريبي',
                'password' => Hash::make('student123password'),
                'phone' => '01111111111',
                'gender' => 'male',
                'role' => 'student',
                'is_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        // 3. Create Sample Course if empty
        $course = Course::firstOrCreate(
            ['title' => 'الكورس التجريبي الأول'],
            [
                'description' => 'كورس تجريبي لاختبار النظام ومشاهدة الفيديوهات والبث المباشر.',
                'price' => 150.00,
                'duration_hours' => 10,
                'level' => 'beginner',
                'language' => 'ar',
                'is_active' => true,
                'instructor_name' => 'أكاديمية روز',
                'grade' => 'الاول',
            ]
        );

        // 4. Create Sample Lesson for the course
        Lesson::firstOrCreate(
            [
                'course_id' => $course->id,
                'title' => 'الدرس الأول - مقدمة تجريبية',
            ],
            [
                'description' => 'شرح تجريبي مفصل لاختبار حماية الفيديوهات والتشغيل.',
                'content' => 'محتوى الدرس التمهيدي للأكاديمية.',
                'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'youtube_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                'duration_minutes' => 15,
                'order' => 1,
                'is_free' => true,
                'target_gender' => 'both',
            ]
        );
    }
}
