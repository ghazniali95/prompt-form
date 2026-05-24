<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('integrations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('name')->unique();   // shop domain (mystore.myshopify.com)
            $table->string('email')->nullable();

            $table->text('token')->nullable();   // OAuth access token
            $table->string('secret')->nullable(); // WooCommerce consumer secret
            $table->enum('type', ['shopify', 'woocommerce'])->default('shopify');
            $table->string('url')->nullable();    // WooCommerce site URL

            $table->boolean('status')->default(true);
            $table->json('meta')->nullable();

            $table->rememberToken();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integrations');
    }
};
