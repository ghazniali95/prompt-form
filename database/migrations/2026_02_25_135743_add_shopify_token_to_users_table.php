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
        Schema::table('users', function (Blueprint $table) {
            // Dedicated column for the Shopify access token.
            // The laravel-shopify package reads/writes via $shop->password, which we
            // redirect to this column through accessors on the User model, keeping
            // the actual `password` column free for real user authentication.
            $table->string('shopify_token', 100)->nullable()->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('shopify_token');
        });
    }
};
