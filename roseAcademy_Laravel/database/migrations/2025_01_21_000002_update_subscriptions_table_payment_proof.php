
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('subscriptions', 'payment_proof_image')) {
                $table->string('payment_proof_image')->nullable()->after('student_info');
            }
            if (!Schema::hasColumn('subscriptions', 'payment_proof')) {
                $table->string('payment_proof')->nullable()->after('payment_proof_image');
            }
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('subscriptions', 'payment_proof_image')) {
                $table->dropColumn('payment_proof_image');
            }
            if (Schema::hasColumn('subscriptions', 'payment_proof')) {
                $table->dropColumn('payment_proof');
            }
        });
    }
};
