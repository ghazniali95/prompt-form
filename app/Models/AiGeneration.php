<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiGeneration extends Model
{
    protected $fillable = [
        'user_id',
        'form_id',
        'prompt',
        'generated_schema',
        'model',
        'tokens_used',
        'status',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'generated_schema' => 'array',
            'tokens_used'      => 'integer',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function form()
    {
        return $this->belongsTo(Form::class);
    }
}
