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
            if (!Schema::hasColumn('lessons', 'youtube_url')) {
                $table->text('youtube_url')->nullable()->after('video_path');
            }
            if (!Schema::hasColumn('lessons', 'video_source')) {
                $table->string('video_source', 20)->default('local')->after('youtube_url');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table) {
            $table->dropColumn(['youtube_url', 'video_source']);
        });
    }
};
