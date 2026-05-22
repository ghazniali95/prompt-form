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
            'password'          => 'hashed',
        ];
    }

    public function integrations()
    {
        return $this->hasMany(Integration::class);
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
}
