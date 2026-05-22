<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            // Drop JSON schema columns replaced by html_content
            $table->dropColumn(['schema', 'styles', 'steps', 'settings', 'display', 'image', 'cookies', 'post_submit']);

            $table->longText('html_content')->nullable()->after('title');
            $table->unsignedInteger('views')->default(0)->after('is_published');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('forms', function (Blueprint $table) {
            $table->dropColumn(['html_content', 'views']);
            $table->dropSoftDeletes();

            $table->json('schema')->nullable();
            $table->json('styles')->nullable();
            $table->json('steps')->nullable();
            $table->json('settings')->nullable();
            $table->json('display')->nullable();
            $table->json('image')->nullable();
            $table->json('cookies')->nullable();
            $table->json('post_submit')->nullable();
        });
    }
};
