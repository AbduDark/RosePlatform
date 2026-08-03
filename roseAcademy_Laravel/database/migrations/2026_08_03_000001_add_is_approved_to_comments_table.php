<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('comments') && !Schema::hasColumn('comments', 'is_approved')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->boolean('is_approved')->default(false)->after('content');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('comments') && Schema::hasColumn('comments', 'is_approved')) {
            Schema::table('comments', function (Blueprint $table) {
                $table->dropColumn('is_approved');
            });
        }
    }
};
