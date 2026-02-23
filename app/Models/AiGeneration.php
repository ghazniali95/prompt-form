<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiGeneration extends Model
{
    protected $fillable = [
        'shop_id',
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

    public function shop()
    {
        return $this->belongsTo(User::class, 'shop_id');
    }

    public function form()
    {
        return $this->belongsTo(Form::class);
    }
}
