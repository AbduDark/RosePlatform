<?php
// Debug script to check lessons and courses data
// Run: php artisan tinker < debug_lessons.php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;

echo "=== Courses with Lesson Counts ===\n";
$courses = Course::withCount('lessons')->get();
foreach ($courses as $c) {
    echo "Course #{$c->id} ({$c->title}): {$c->lessons_count} lessons, active=" . ($c->is_active ? 'yes' : 'no') . "\n";
    
    // Show lessons for this course
    $lessons = Lesson::where('course_id', $c->id)->get(['id', 'title', 'target_gender']);
    foreach ($lessons as $l) {
        echo "  - Lesson #{$l->id}: {$l->title} | gender={$l->target_gender}\n";
    }
}

echo "\n=== Students (non-admin) ===\n";
$students = User::where('is_admin', false)->get(['id', 'name', 'gender', 'email']);
foreach ($students as $s) {
    echo "Student #{$s->id}: {$s->name} | gender={$s->gender} | email={$s->email}\n";
}
