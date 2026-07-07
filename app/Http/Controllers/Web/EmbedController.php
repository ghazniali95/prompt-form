<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class EmbedController extends Controller
{
    /**
     * Serve the storefront embed script with CORS + long-term cache headers.
     */
    public function __invoke(): BinaryFileResponse
    {
        $path = public_path('embed.js');

        abort_unless(file_exists($path), 404);

        return response()->file($path, [
            'Content-Type'                => 'application/javascript',
            'Cache-Control'               => 'public, max-age=86400',
            'Access-Control-Allow-Origin' => '*',
        ]);
    }
}
