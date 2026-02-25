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
        'plan',
        'shopify_charge_id',
        'subscription_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
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
