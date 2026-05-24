<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $fillable = [
        'user_id',
        'user_subscription_id',
        'provider',
        'provider_invoice_id',
        'plan_name',
        'amount',
        'currency',
        'status',
        'hosted_invoice_url',
        'invoice_date',
    ];

    protected function casts(): array
    {
        return [
            'amount'       => 'decimal:2',
            'invoice_date' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function subscription()
    {
        return $this->belongsTo(UserSubscription::class, 'user_subscription_id');
    }
}
