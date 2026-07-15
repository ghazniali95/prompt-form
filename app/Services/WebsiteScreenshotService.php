<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Browsershot\Browsershot;

class WebsiteScreenshotService
{
    /**
     * Capture a screenshot of the given URL and store it on the configured disk.
     *
     * @return string The public URL of the stored screenshot.
     *
     * @throws \RuntimeException When the URL is not safe to capture.
     */
    public function capture(string $url, int|string $ownerId): string
    {
        $url = $this->normaliseUrl($url);

        $this->assertSafeUrl($url);

        $binary = Browsershot::url($url)
            ->windowSize(
                (int) config('screenshot.width'),
                (int) config('screenshot.height')
            )
            ->setScreenshotType('jpeg', (int) config('screenshot.quality'))
            ->waitUntilNetworkIdle()
            ->timeout((int) config('screenshot.timeout'))
            ->noSandbox()
            ->dismissDialogs();

        if (config('screenshot.full_page')) {
            $binary->fullPage();
        }

        if ($path = config('screenshot.chrome_path')) {
            $binary->setChromePath($path);
        }
        if ($node = config('screenshot.node_binary')) {
            $binary->setNodeBinary($node);
        }
        if ($npm = config('screenshot.npm_binary')) {
            $binary->setNpmBinary($npm);
        }

        $bytes = $binary->screenshot();

        $disk = config('screenshot.disk');
        $key = trim(config('screenshot.directory'), '/').'/'.$ownerId.'/'.Str::uuid().'.jpg';

        Storage::disk($disk)->put($key, $bytes, 'public');

        return Storage::disk($disk)->url($key);
    }

    /**
     * Ensure a scheme is present and strip trailing slashes.
     */
    private function normaliseUrl(string $url): string
    {
        $url = trim($url);
        if (! preg_match('#^https?://#i', $url)) {
            $url = 'https://'.$url;
        }

        return rtrim($url, '/');
    }

    /**
     * Guard against SSRF: only http(s) to public hosts. Rejects private,
     * loopback, link-local and reserved IP ranges so a merchant-supplied URL
     * cannot be used to reach internal services from the server.
     *
     * @throws \RuntimeException
     */
    private function assertSafeUrl(string $url): void
    {
        $parts = parse_url($url);

        $scheme = strtolower($parts['scheme'] ?? '');
        if (! in_array($scheme, ['http', 'https'], true)) {
            throw new \RuntimeException("Refusing to capture non-http(s) URL: {$url}");
        }

        $host = $parts['host'] ?? '';
        if ($host === '') {
            throw new \RuntimeException("Refusing to capture URL without a host: {$url}");
        }

        // Resolve every A/AAAA record and reject if any points at a private range.
        $ips = $this->resolveHost($host);
        if ($ips === []) {
            throw new \RuntimeException("Could not resolve host: {$host}");
        }

        foreach ($ips as $ip) {
            if (! filter_var(
                $ip,
                FILTER_VALIDATE_IP,
                FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
            )) {
                throw new \RuntimeException("Refusing to capture private/reserved address for host {$host} ({$ip}).");
            }
        }
    }

    /**
     * @return array<int, string> Resolved IP addresses (IPv4 + IPv6).
     */
    private function resolveHost(string $host): array
    {
        // A literal IP is its own resolution.
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return [$host];
        }

        $ips = [];

        $records = @dns_get_record($host, DNS_A + DNS_AAAA) ?: [];
        foreach ($records as $record) {
            if (isset($record['ip'])) {
                $ips[] = $record['ip'];
            }
            if (isset($record['ipv6'])) {
                $ips[] = $record['ipv6'];
            }
        }

        // Fallback to gethostbyname for environments where dns_get_record is limited.
        if ($ips === []) {
            $resolved = gethostbyname($host);
            if ($resolved !== $host) {
                $ips[] = $resolved;
            }
        }

        return array_values(array_unique($ips));
    }
}
