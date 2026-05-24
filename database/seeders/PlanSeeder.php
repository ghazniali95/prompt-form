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
                'name'              => 'Free',
                'slug'              => 'free',
                'price'             => 0.00,
                'stripe_price_id'   => null,
                'shopify_plan_name' => null,
                'shopify_price'     => null,
                'form_limit'        => 1,
                'response_limit'    => 50,
                'ai_token_limit'    => 50_000,
                'is_free'           => true,
                'trial_days'        => 0,
            ],
            [
                'name'              => 'Starter',
                'slug'              => 'starter',
                'price'             => 9.00,
                'stripe_price_id'   => config('services.stripe.plans.starter'),
                'shopify_plan_name' => 'Starter Plan',
                'shopify_price'     => 9.00,
                'form_limit'        => 5,
                'response_limit'    => 1000,
                'ai_token_limit'    => 200_000,
                'is_free'           => false,
                'trial_days'        => 0,
            ],
            [
                'name'              => 'Growing',
                'slug'              => 'growing',
                'price'             => 24.00,
                'stripe_price_id'   => config('services.stripe.plans.growing'),
                'shopify_plan_name' => 'Growing Plan',
                'shopify_price'     => 24.00,
                'form_limit'        => PHP_INT_MAX,
                'response_limit'    => PHP_INT_MAX,
                'ai_token_limit'    => 750_000,
                'is_free'           => false,
                'trial_days'        => 0,
            ],
        ];

        foreach ($plans as $data) {
            Plan::updateOrCreate(['slug' => $data['slug']], $data);
        }
    }
}
