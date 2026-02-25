<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Osiset\ShopifyApp\Contracts\ShopModel as IShopModel;
use Osiset\ShopifyApp\Traits\ShopModel;

class User extends Authenticatable implements IShopModel
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, ShopModel;

    protected $fillable = [
        'name',
        'email',
        'password',
        'shopify_token',
        'plan',
        'shopify_charge_id',
        'subscription_status',
    ];

    protected $hidden = [
        'password',
        'shopify_token',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
        ];
    }

    /**
     * The laravel-shopify package stores the Shopify access token via $shop->password.
     * These accessors transparently redirect those reads/writes to the dedicated
     * `shopify_token` column, keeping `password` free for real user auth.
     */
    public function getPasswordAttribute(): string
    {
        return $this->attributes['shopify_token'] ?? '';
    }

    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['shopify_token'] = $value;
    }

    public function forms()
    {
        return $this->hasMany(Form::class, 'shop_id');
    }

    public function aiGenerations()
    {
        return $this->hasMany(AiGeneration::class, 'shop_id');
    }

    public function formResponses()
    {
        return $this->hasMany(FormResponse::class, 'shop_id');
    }
}
