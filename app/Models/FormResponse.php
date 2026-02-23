<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormResponse extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'form_id',
        'shop_id',
        'data',
        'metadata',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'data'         => 'array',
            'metadata'     => 'array',
            'submitted_at' => 'datetime',
        ];
    }

    public function form()
    {
        return $this->belongsTo(Form::class);
    }

    public function shop()
    {
        return $this->belongsTo(User::class, 'shop_id');
    }
}
