<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Theme extends Model
{
    protected $fillable = [
        'user_id',
        'website_url',
        'company_name',
        'description',
        'logo_url',
        'favicon_url',
        'screenshot_url',
        'screenshot_status',
        'screenshot_captured_at',
        'primary_color',
        'secondary_color',
        'accent_color',
        'font_family',
        'raw_data',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'raw_data'               => 'array',
            'is_active'              => 'boolean',
            'screenshot_captured_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
