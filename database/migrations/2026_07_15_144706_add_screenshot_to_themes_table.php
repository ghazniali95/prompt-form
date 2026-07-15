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
        Schema::table('themes', function (Blueprint $table) {
            $table->string('screenshot_url')->nullable()->after('favicon_url');
            $table->string('screenshot_status')->nullable()->after('screenshot_url');
            $table->timestamp('screenshot_captured_at')->nullable()->after('screenshot_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('themes', function (Blueprint $table) {
            $table->dropColumn(['screenshot_url', 'screenshot_status', 'screenshot_captured_at']);
        });
    }
};
