<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('plan_slug')->default('free'); // free | starter | growing
            $table->enum('provider', ['shopify', 'stripe'])->index();
            $table->text('provider_subscription_id')->nullable(); // Shopify charge ID or Stripe subscription ID
            $table->enum('status', ['active', 'cancelled', 'past_due', 'trialing', 'paused'])->default('active')->index();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('activated_on')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('confirmation_url')->nullable();  // Shopify billing approval URL
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_subscriptions');
    }
};
