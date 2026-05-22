<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'plan_id',
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
}
