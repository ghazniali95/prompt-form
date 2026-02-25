<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->json('display')->nullable()->after('settings');     // mode, trigger, delay, overlay
            $table->json('image')->nullable()->after('display');        // url, position, alt
            $table->json('cookies')->nullable()->after('image');        // array of cookie save configs
            $table->json('post_submit')->nullable()->after('cookies');  // action, template, redirect
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->dropColumn(['display', 'image', 'cookies', 'post_submit']);
        });
    }
};
