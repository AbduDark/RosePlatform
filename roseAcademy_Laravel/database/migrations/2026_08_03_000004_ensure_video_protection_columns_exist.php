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
        Schema::table('lessons', function (Blueprint $table) {
            if (!Schema::hasColumn('lessons', 'is_video_protected')) {
                $table->boolean('is_video_protected')->default(true);
            }
            if (!Schema::hasColumn('lessons', 'video_token')) {
                $table->string('video_token')->nullable();
            }
            if (!Schema::hasColumn('lessons', 'video_token_expires_at')) {
                $table->timestamp('video_token_expires_at')->nullable();
            }
            if (!Schema::hasColumn('lessons', 'video_metadata')) {
                $table->json('video_metadata')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $columnsToDrop = array_filter([
                Schema::hasColumn('lessons', 'is_video_protected') ? 'is_video_protected' : null,
                Schema::hasColumn('lessons', 'video_token') ? 'video_token' : null,
                Schema::hasColumn('lessons', 'video_token_expires_at') ? 'video_token_expires_at' : null,
                Schema::hasColumn('lessons', 'video_metadata') ? 'video_metadata' : null,
            ]);

            if (!empty($columnsToDrop)) {
                $table->dropColumn(array_values($columnsToDrop));
            }
        });
    }
};
