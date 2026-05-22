<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('forms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->ulid('ulid')->unique();
            $table->string('title');
            $table->json('schema')->nullable();
            $table->json('styles')->nullable();
            $table->json('steps')->nullable();
            $table->json('settings')->nullable();
            $table->json('display')->nullable();
            $table->json('image')->nullable();
            $table->json('cookies')->nullable();
            $table->json('post_submit')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forms');
    }
};
