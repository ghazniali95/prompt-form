<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiUsageLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'form_id',
        'conversation_id',
        'provider',
        'model',
        'purpose',
        'prompt_tokens',
        'completion_tokens',
        'cache_write_tokens',
        'cache_read_tokens',
        'reasoning_tokens',
        'created_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function form()
    {
        return $this->belongsTo(Form::class);
    }

    public function conversation()
    {
        return $this->belongsTo(AiConversation::class, 'conversation_id');
    }
}
