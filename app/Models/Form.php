<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Form extends Model
{
    protected $fillable = [
        'shop_id',
        'ulid',
        'title',
        'schema',
        'styles',
        'steps',
        'settings',
        'display',
        'image',
        'cookies',
        'post_submit',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'schema'       => 'array',
            'styles'       => 'array',
            'steps'        => 'array',
            'settings'     => 'array',
            'display'      => 'array',
            'image'        => 'array',
            'cookies'      => 'array',
            'post_submit'  => 'array',
            'is_published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Form $form) {
            $form->ulid = (string) Str::ulid();
        });
    }

    public function shop()
    {
        return $this->belongsTo(User::class, 'shop_id');
    }

    public function responses()
    {
        return $this->hasMany(FormResponse::class);
    }

    public function versions()
    {
        return $this->hasMany(FormVersion::class);
    }

    public function aiGenerations()
    {
        return $this->hasMany(AiGeneration::class);
    }
}
