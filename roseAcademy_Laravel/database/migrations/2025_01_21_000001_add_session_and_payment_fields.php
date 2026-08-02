
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // إضافة حقول الجلسة للمستخدمين
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_activity_at')->nullable()->after('last_login_at');
            $table->timestamp('session_expires_at')->nullable()->after('last_activity_at');
        });

        // إضافة حقل صورة إثبات الدفع للاشتراكات
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('payment_proof_image')->nullable()->after('student_info');
        });

        // إنشاء المجلد لصور إثبات الدفع
        $uploadPath = public_path('uploads/payment_proofs');
        if (!file_exists($uploadPath)) {
            mkdir($uploadPath, 0777, true);
        }
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['last_activity_at', 'session_expires_at']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn('payment_proof_image');
        });
    }
};
