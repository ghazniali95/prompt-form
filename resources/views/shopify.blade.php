<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prompt Form</title>
    {{-- App Bridge v4: must load before React app, sets up window.shopify global --}}
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
            data-api-key="{{ config('shopify-app.api_key') }}"></script>
    @viteReactRefresh
    @vite(['resources/js/shopify/main.jsx'])
</head>
<body>
    <div id="shopify-app-root"></div>
</body>
</html>
