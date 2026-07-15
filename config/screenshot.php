<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Browser binary paths
    |--------------------------------------------------------------------------
    |
    | Browsershot shells out to Node/Puppeteer. On most servers the auto-detected
    | paths work, but they can be pinned here if node/npm live somewhere unusual
    | or a specific Chrome/Chromium binary should be used instead of the one
    | Puppeteer downloads.
    |
    */
    'node_binary' => env('SCREENSHOT_NODE_BINARY'),
    'npm_binary' => env('SCREENSHOT_NPM_BINARY'),
    'chrome_path' => env('SCREENSHOT_CHROME_PATH'),

    /*
    |--------------------------------------------------------------------------
    | Capture settings
    |--------------------------------------------------------------------------
    */
    'width' => (int) env('SCREENSHOT_WIDTH', 1280),
    'height' => (int) env('SCREENSHOT_HEIGHT', 800),
    'timeout' => (int) env('SCREENSHOT_TIMEOUT', 30),
    'quality' => (int) env('SCREENSHOT_QUALITY', 70),

    // Capture the entire scrollable page instead of just the viewport.
    'full_page' => (bool) env('SCREENSHOT_FULL_PAGE', true),

    // Storage disk + directory for captured screenshots.
    'disk' => env('SCREENSHOT_DISK', 's3'),
    'directory' => env('SCREENSHOT_DIRECTORY', 'screenshots'),
];
