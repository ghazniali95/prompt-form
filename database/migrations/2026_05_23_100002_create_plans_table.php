<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 64);
            $table->string('slug', 32)->unique();
            $table->decimal('price', 8, 2)->default(0);
            $table->string('stripe_price_id')->nullable();
            $table->string('shopify_plan_name', 128)->nullable();
            $table->decimal('shopify_price', 8, 2)->nullable();
            $table->unsignedBigInteger('form_limit')->default(1);
            $table->unsignedBigInteger('response_limit')->default(50);
            $table->unsignedBigInteger('ai_token_limit')->default(50000);
            $table->boolean('is_free')->default(false);
            $table->unsignedTinyInteger('trial_days')->default(0);
            $table->boolean('test')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
