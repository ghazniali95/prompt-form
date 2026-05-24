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
     * Compile JSX source to plain JS using esbuild via stdin.
     * Returns the compiled JS string, or null if compilation fails.
     */
    public function compile(string $jsxCode): ?string
    {
        if (! is_executable($this->esbuild)) {
            Log::warning('JsxCompilerService: esbuild not found at ' . $this->esbuild);
            return null;
        }

        $cmd = escapeshellarg($this->esbuild)
            . ' --loader=jsx --platform=browser 2>&1';

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];

        $process = proc_open($cmd, $descriptors, $pipes);

        if (! is_resource($process)) {
            Log::warning('JsxCompilerService: failed to open esbuild process');
            return null;
        }

        fwrite($pipes[0], $jsxCode);
        fclose($pipes[0]);

        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        $exitCode = proc_close($process);

        if ($exitCode !== 0 || str_contains((string) $stderr, '[ERROR]')) {
            Log::warning('JsxCompilerService: compilation failed', [
                'exit_code' => $exitCode,
                'stderr'    => $stderr,
            ]);
            return null;
        }

        return $stdout ?: null;
    }
}
