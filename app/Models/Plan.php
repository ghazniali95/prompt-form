<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'price',
        'stripe_price_id',
        'shopify_plan_name',
        'shopify_price',
        'form_limit',
        'response_limit',
        'ai_token_limit',
        'is_free',
        'trial_days',
        'test',
    ];

    protected function casts(): array
    {
        return [
            'price'          => 'decimal:2',
            'shopify_price'  => 'decimal:2',
            'form_limit'      => 'integer',
            'response_limit'  => 'integer',
            'ai_token_limit'  => 'integer',
            'is_free'        => 'boolean',
            'trial_days'     => 'integer',
            'test'           => 'boolean',
        ];
    }

    public function subscriptions()
    {
        return $this->hasMany(UserSubscription::class);
    }

    public function isUnlimitedForms(): bool
    {
        return $this->form_limit >= PHP_INT_MAX;
    }

    public function isUnlimitedResponses(): bool
    {
        return $this->response_limit >= PHP_INT_MAX;
    }
}
