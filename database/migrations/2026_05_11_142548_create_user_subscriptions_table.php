<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('plan_slug')->default('free');
            $table->enum('provider', ['shopify', 'stripe'])->index();
            $table->text('provider_subscription_id')->nullable();
            $table->enum('status', ['active', 'cancelled', 'past_due', 'trialing', 'paused', 'incomplete'])->default('active')->index();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('activated_on')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('confirmation_url')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_subscriptions');
    }
};
