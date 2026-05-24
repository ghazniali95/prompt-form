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
            $table->longText('html_content')->nullable();
            $table->string('layout_type')->nullable();
            $table->longText('compiled_content')->nullable();
            $table->boolean('is_published')->default(false);
            $table->unsignedInteger('views')->default(0);
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forms');
    }
};
