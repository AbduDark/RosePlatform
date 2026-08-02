
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // تغيير نوع العمود لـ enum مع القيم الجديدة
        DB::statement("ALTER TABLE `notifications` MODIFY COLUMN `type` ENUM(
            'general', 
            'course', 
            'subscription', 
            'system',
            'new_subscription',
            'subscription_renewal',
            'subscription_cancelled',
            'subscription_approved',
            'subscription_rejected',
            'subscription_expired',
            'subscription_expiring_soon',
            'weekly_encouragement',
            'admin'
        ) DEFAULT 'general'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE `notifications` MODIFY COLUMN `type` ENUM(
            'general', 
            'course', 
            'subscription', 
            'system'
        ) DEFAULT 'general'");
    }
};
