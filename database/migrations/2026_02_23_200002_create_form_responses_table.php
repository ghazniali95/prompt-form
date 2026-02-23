<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_id')->constrained('forms')->cascadeOnDelete();
            $table->foreignId('shop_id')->constrained('users')->cascadeOnDelete();
            $table->json('data');               // Submitted field values
            $table->json('metadata')->nullable(); // Hashed IP, user agent, referrer
            $table->timestamp('submitted_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_responses');
    }
};
