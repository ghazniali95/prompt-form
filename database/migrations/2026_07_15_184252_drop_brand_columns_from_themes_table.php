<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Brand info (company name, colours, logo, font, description) is no longer
     * scraped during onboarding — AI form generation now derives branding from
     * the website screenshot instead, so these columns are dead.
     */
    public function up(): void
    {
        Schema::table('themes', function (Blueprint $table) {
            $table->dropColumn([
                'company_name',
                'description',
                'logo_url',
                'favicon_url',
                'primary_color',
                'secondary_color',
                'accent_color',
                'font_family',
                'raw_data',
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('themes', function (Blueprint $table) {
            $table->string('company_name')->nullable()->after('website_url');
            $table->text('description')->nullable()->after('company_name');
            $table->string('logo_url')->nullable()->after('description');
            $table->string('favicon_url')->nullable()->after('logo_url');
            $table->string('primary_color', 10)->nullable()->after('screenshot_captured_at');
            $table->string('secondary_color', 10)->nullable()->after('primary_color');
            $table->string('accent_color', 10)->nullable()->after('secondary_color');
            $table->string('font_family')->nullable()->after('accent_color');
            $table->json('raw_data')->nullable()->after('font_family');
        });
    }
};
