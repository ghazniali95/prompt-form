<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name'           => 'Free',
                'type'           => 'RECURRING',
                'price'          => 0.00,
                'form_limit'     => 1,
                'response_limit' => 100,
                'is_free'        => true,
                'trial_days'     => 0,
                'test'           => false,
            ],
            [
                'name'           => 'Basic',
                'type'           => 'RECURRING',
                'price'          => 9.99,
                'stripe_price_id'=> null, // set when Stripe product is created
                'form_limit'     => 5,
                'response_limit' => 1000,
                'is_free'        => false,
                'trial_days'     => 7,
                'test'           => false,
            ],
            [
                'name'           => 'Pro',
                'type'           => 'RECURRING',
                'price'          => 29.99,
                'stripe_price_id'=> null,
                'form_limit'     => 0,    // unlimited
                'response_limit' => 0,    // unlimited
                'is_free'        => false,
                'trial_days'     => 7,
                'test'           => false,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::firstOrCreate(['name' => $plan['name']], $plan);
        }
    }
}
