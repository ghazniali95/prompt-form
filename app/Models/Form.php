<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Form extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'ulid',
        'title',
        'html_content',
        'compiled_content',
        'layout_type',
        'is_published',
        'views',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Form $form) {
            $form->ulid = (string) Str::ulid();
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function responses()
    {
        return $this->hasMany(FormResponse::class);
    }

    public function versions()
    {
        return $this->hasMany(FormVersion::class);
    }

    public function conversations()
    {
        return $this->morphMany(AiConversation::class, 'conversable');
    }

    public function aiGenerations()
    {
        return $this->hasMany(AiGeneration::class);
    }
}
