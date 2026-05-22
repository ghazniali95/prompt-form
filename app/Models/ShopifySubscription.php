<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShopifySubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'shopify_charge_id',
        'integration_id',
        'status',
        'test',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'test'     => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function integration()
    {
        return $this->belongsTo(Integration::class);
    }
}
