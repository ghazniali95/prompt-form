<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiConversation extends Model
{
    protected $fillable = [
        'user_id',
        'conversable_type',
        'conversable_id',
        'total_tokens',
        'message_count',
        'last_compressed_at',
        'compression_summary',
    ];

    protected function casts(): array
    {
        return [
            'total_tokens'       => 'integer',
            'message_count'      => 'integer',
            'last_compressed_at' => 'datetime',
        ];
    }

    public function conversable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(AiMessage::class, 'conversation_id')->orderBy('id');
    }
}
