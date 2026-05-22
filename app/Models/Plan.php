<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'price',
        'stripe_price_id',
        'form_limit',
        'response_limit',
        'is_free',
        'trial_days',
        'test',
    ];

    protected function casts(): array
    {
        return [
            'price'          => 'decimal:2',
            'form_limit'     => 'integer',
            'response_limit' => 'integer',
            'is_free'        => 'boolean',
            'trial_days'     => 'integer',
            'test'           => 'boolean',
        ];
    }

    public function subscriptions()
    {
        return $this->hasMany(UserSubscription::class);
    }
}
