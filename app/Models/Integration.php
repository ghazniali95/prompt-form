<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Integration extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'token',
        'secret',
        'type',
        'url',
        'status',
        'meta',
    ];

    protected $hidden = [
        'token',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
            'meta'   => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shopifySubscription()
    {
        return $this->hasOne(ShopifySubscription::class);
    }
}
