<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_slug',
        'provider',
        'provider_subscription_id',
        'status',
        'trial_ends_at',
        'activated_on',
        'cancelled_at',
        'confirmation_url',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'trial_ends_at' => 'datetime',
            'activated_on'  => 'datetime',
            'cancelled_at'  => 'datetime',
            'metadata'      => 'array',
        ];
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class, 'plan_slug', 'slug');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }

    // ── Status helpers ────────────────────────────────────────────────────────

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isIncomplete(): bool
    {
        return $this->status === 'incomplete';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function onTrial(): bool
    {
        return $this->status === 'trialing' && $this->trial_ends_at?->isFuture();
    }

    public function isPastDue(): bool
    {
        return $this->status === 'past_due';
    }

    // ── Provider helpers ──────────────────────────────────────────────────────

    public function isStripe(): bool
    {
        return $this->provider === 'stripe';
    }

    public function isShopify(): bool
    {
        return $this->provider === 'shopify';
    }
}
