<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class JsxCompilerService
{
    private string $esbuild;

    public function __construct()
    {
        $this->esbuild = base_path('node_modules/esbuild/bin/esbuild');
    }

    /**
     * Compile JSX source to plain JS using esbuild.
     * Returns the compiled JS string, or null if compilation fails.
     */
    public function compile(string $jsxCode): ?string
    {
        if (! is_executable($this->esbuild)) {
            Log::warning('JsxCompilerService: esbuild not found at ' . $this->esbuild);
            return null;
        }

        $tmpFile = tempnam(sys_get_temp_dir(), 'pf_jsx_') . '.jsx';

        try {
            file_put_contents($tmpFile, $jsxCode);

            $cmd = escapeshellarg($this->esbuild)
                . ' ' . escapeshellarg($tmpFile)
                . ' --loader=jsx --platform=browser 2>&1';

            $output   = shell_exec($cmd);
            $exitCode = 0;

            // esbuild exits non-zero on error; check for error markers in output
            if (! $output || str_contains($output, '[ERROR]')) {
                Log::warning('JsxCompilerService: compilation failed', ['output' => $output]);
                return null;
            }

            return $output;
        } finally {
            @unlink($tmpFile);
        }
    }
}
