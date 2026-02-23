<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('form_id')->nullable()->constrained('forms')->nullOnDelete();
            $table->text('prompt');
            $table->json('generated_schema')->nullable();
            $table->string('model')->default('gpt-4o');
            $table->integer('tokens_used')->default(0);
            $table->enum('status', ['pending', 'success', 'failed'])->default('pending');
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_generations');
    }
};
