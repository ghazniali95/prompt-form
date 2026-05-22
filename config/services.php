<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'shopify' => [
        'client_id'     => env('SHOPIFY_API_KEY', ''),
        'client_secret' => env('SHOPIFY_API_SECRET', ''),
        'api_version'   => '2025-01',
        'scopes'        => '',
        'app_url'       => env('APP_URL') . '/auth/shopify/begin',
        'billing_test'  => (bool) env('SHOPIFY_BILLING_TEST', false),
        'redirect_uri'  => env('APP_URL') . '/auth/shopify/callback',
    ],

];
