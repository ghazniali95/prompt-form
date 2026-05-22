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
        Schema::create('shopify_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('shopify_charge_id')->unique();
            $table->foreignId('integration_id')->nullable()->constrained('integrations')->nullOnDelete();
            $table->string('status')->nullable();
            $table->boolean('test')->default(false);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('shopify_charge_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shopify_subscriptions');
    }
};
