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
            $table->foreignId('shop_id')->constrained('users')->cascadeOnDelete();
            $table->ulid('ulid')->unique(); // Public-facing ID for storefront API
            $table->string('title');
            $table->json('schema')->nullable();    // Form field definitions
            $table->json('styles')->nullable();    // Colors, fonts, layout
            $table->json('steps')->nullable();     // Multi-step config
            $table->json('settings')->nullable();  // Submit text, success message, redirect URL
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('forms');
    }
};
