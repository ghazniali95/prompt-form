<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'login_type',
        'api_key',
        'stripe_id',
        'pm_type',
        'pm_last_four',
        'onboarding_completed',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'api_key',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'onboarding_completed' => 'boolean',
        ];
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function theme()
    {
        return $this->hasOne(Theme::class)->where('is_active', true)->latest();
    }

    public function integrations()
    {
        return $this->hasMany(Integration::class);
    }

    /**
     * The website URL we already know for this user (their connected store),
     * or null when we need to ask them for it. Shopify merchants are onboarded
     * with their storefront domain, so we never ask them for a URL.
     */
    public function knownWebsiteUrl(): ?string
    {
        $shopify = $this->integrations()
            ->where('type', 'shopify')
            ->first();

        if ($shopify?->name) {
            // e.g. "mystore.myshopify.com" — redirects to the primary domain when captured.
            return 'https://'.$shopify->name;
        }

        $woo = $this->integrations()
            ->where('type', 'woocommerce')
            ->whereNotNull('url')
            ->first();

        return $woo?->url ?: null;
    }

    public function forms()
    {
        return $this->hasMany(Form::class);
    }

    public function formResponses()
    {
        return $this->hasMany(FormResponse::class);
    }

    public function aiGenerations()
    {
        return $this->hasMany(AiGeneration::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(UserSubscription::class);
    }

    // The single active subscription (any provider).
    public function activeSubscription()
    {
        return $this->hasOne(UserSubscription::class)
            ->where('status', 'active')
            ->latest();
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class)->orderByDesc('invoice_date');
    }

    // ── Computed attributes ───────────────────────────────────────────────────

    // Returns the plan slug ('free' | 'starter' | 'growing') for PlanLimits compatibility.
    public function getPlanAttribute(): string
    {
        return $this->activeSubscription?->plan_slug ?? 'free';
    }

    // ── Stripe helpers ────────────────────────────────────────────────────────

    public function hasStripeId(): bool
    {
        return ! empty($this->stripe_id);
    }
}
