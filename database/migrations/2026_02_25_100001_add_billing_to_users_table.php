<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('plan')->default('free')->after('name');
            $table->string('shopify_charge_id')->nullable()->after('plan');
            $table->string('subscription_status')->nullable()->after('shopify_charge_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['plan', 'shopify_charge_id', 'subscription_status']);
        });
    }
};
