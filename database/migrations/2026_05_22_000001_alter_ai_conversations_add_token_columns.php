<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_conversations', function (Blueprint $table) {
            $table->unsignedInteger('total_tokens')->default(0)->after('user_id');
            $table->unsignedSmallInteger('message_count')->default(0)->after('total_tokens');
            $table->timestamp('last_compressed_at')->nullable()->after('message_count');
            $table->text('compression_summary')->nullable()->after('last_compressed_at');
        });
    }

    public function down(): void
    {
        Schema::table('ai_conversations', function (Blueprint $table) {
            $table->dropColumn(['total_tokens', 'message_count', 'last_compressed_at', 'compression_summary']);
        });
    }
};
