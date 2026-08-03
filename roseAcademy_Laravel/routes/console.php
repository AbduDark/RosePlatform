<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// ─── الاشتراكات ────────────────────────────────────────────────────────────
// تحديث الاشتراكات المنتهية وإرسال إشعار انتهاء الاشتراك — يومياً في منتصف الليل
Schedule::command('subscriptions:notify-expired')
    ->dailyAt('00:00')
    ->withoutOverlapping()
    ->runInBackground();

// تذكير الطلاب قبل انتهاء اشتراكاتهم بـ 3 أيام — مرتين يومياً
Schedule::command('subscriptions:notify-expired')
    ->twiceDaily(8, 20)
    ->withoutOverlapping()
    ->runInBackground();

// رسائل التشجيع الأسبوعية للطلاب النشطين — كل أحد الساعة 10 صباحاً
Schedule::command('subscriptions:notify-expired --weekly-encouragement')
    ->weekly()
    ->sundays()
    ->at('10:00')
    ->withoutOverlapping()
    ->runInBackground();

// ─── قاعدة البيانات والكاش ────────────────────────────────────────────────
// تنظيف الـ Cache القديم — كل ساعة
Schedule::command('cache:prune-stale-tags')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground();

// تنظيف الـ Jobs الفاشلة القديمة (أكثر من 7 أيام) — أسبوعياً
Schedule::command('queue:prune-failed --hours=168')
    ->weekly()
    ->withoutOverlapping()
    ->runInBackground();

// ─── إلهام يومي (اختياري) ─────────────────────────────────────────────────
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
