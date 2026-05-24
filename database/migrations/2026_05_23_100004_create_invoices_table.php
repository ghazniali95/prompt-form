<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_subscription_id')->nullable()->constrained('user_subscriptions')->nullOnDelete();
            $table->enum('provider', ['stripe', 'shopify']);
            $table->string('provider_invoice_id')->nullable()->index();
            $table->string('plan_name', 128)->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->string('currency', 3)->default('usd');
            $table->enum('status', ['paid', 'open', 'draft', 'void', 'uncollectible'])->default('open');
            $table->string('hosted_invoice_url')->nullable();
            $table->timestamp('invoice_date')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'provider']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
