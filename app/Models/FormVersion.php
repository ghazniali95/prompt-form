<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FormVersion extends Model
{
    protected $fillable = [
        'form_id',
        'schema',
        'styles',
        'steps',
    ];

    protected function casts(): array
    {
        return [
            'schema' => 'array',
            'styles' => 'array',
            'steps'  => 'array',
        ];
    }

    public function form()
    {
        return $this->belongsTo(Form::class);
    }
}
