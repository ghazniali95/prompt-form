<?php

namespace App\Services;

use App\AI\Agents\WebsiteIntelligenceAgent;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebsiteIntelligenceService
{
    public function scan(string $url): array
    {
        $url  = $this->normaliseUrl($url);
        $html = $this->fetchHtml($url);

        if (! $html) {
            return $this->emptyResult($url);
        }

        $parsed = $this->parseHtml($html, $url);
        $ai     = $this->enrichWithAi($parsed, $url);

        return array_merge($parsed, $ai, ['website_url' => $url]);
    }

    // ── HTML fetching ─────────────────────────────────────────────────────────

    private function fetchHtml(string $url): ?string
    {
        try {
            $response = Http::timeout(10)
                ->withHeaders(['User-Agent' => 'Mozilla/5.0 (compatible; PromptFormBot/1.0)'])
                ->get($url);

            return $response->successful() ? $response->body() : null;
        } catch (\Throwable $e) {
            Log::warning('WebsiteIntelligenceService: fetch failed', ['url' => $url, 'error' => $e->getMessage()]);
            return null;
        }
    }

    // ── HTML parsing ──────────────────────────────────────────────────────────

    private function parseHtml(string $html, string $baseUrl): array
    {
        libxml_use_internal_errors(true);
        $dom = new \DOMDocument();
        @$dom->loadHTML($html, LIBXML_NOWARNING | LIBXML_NOERROR);
        libxml_clear_errors();

        $xpath = new \DOMXPath($dom);

        return [
            'company_name'    => $this->extractCompanyName($xpath),
            'description'     => $this->extractDescription($xpath),
            'logo_url'        => $this->extractLogo($xpath, $baseUrl),
            'favicon_url'     => $this->extractFavicon($xpath, $baseUrl),
            'primary_color'   => null,
            'secondary_color' => null,
            'accent_color'    => null,
            'font_family'     => $this->extractFont($xpath),
            '_colors_hint'    => $this->extractColors($html),
            '_theme_color'    => $this->extractMeta($xpath, 'theme-color'),
            '_og_description' => $this->extractOgMeta($xpath, 'og:description'),
            '_title'          => $this->extractTitle($xpath),
        ];
    }

    private function extractTitle(\DOMXPath $xpath): string
    {
        $nodes = $xpath->query('//title');
        return $nodes->length ? trim($nodes->item(0)->textContent) : '';
    }

    private function extractCompanyName(\DOMXPath $xpath): ?string
    {
        $name = $this->extractOgMeta($xpath, 'og:site_name')
            ?? $this->extractOgMeta($xpath, 'og:title');

        if ($name) return $name;

        // Fall back to first part of <title> (before separator)
        $title = $this->extractTitle($xpath);
        if ($title) {
            return preg_split('/\s*[\|\-–—]\s*/', $title)[0] ?? $title;
        }

        return null;
    }

    private function extractDescription(\DOMXPath $xpath): ?string
    {
        return $this->extractMeta($xpath, 'description')
            ?? $this->extractOgMeta($xpath, 'og:description');
    }

    private function extractLogo(\DOMXPath $xpath, string $baseUrl): ?string
    {
        // 1. og:image is the most reliable brand image
        $og = $this->extractOgMeta($xpath, 'og:image');
        if ($og) return $this->absoluteUrl($og, $baseUrl);

        // 2. <img> with logo in id/class/alt/src
        $imgs = $xpath->query('//img[contains(translate(@id,"LOGO","logo"),"logo") or contains(translate(@class,"LOGO","logo"),"logo") or contains(translate(@alt,"LOGO","logo"),"logo") or contains(translate(@src,"LOGO","logo"),"logo")]');
        if ($imgs->length) {
            $src = $imgs->item(0)->getAttribute('src');
            if ($src) return $this->absoluteUrl($src, $baseUrl);
        }

        return null;
    }

    private function extractFavicon(\DOMXPath $xpath, string $baseUrl): ?string
    {
        $queries = [
            '//link[@rel="icon"]/@href',
            '//link[contains(@rel,"shortcut")]/@href',
            '//link[@rel="apple-touch-icon"]/@href',
        ];

        foreach ($queries as $q) {
            $nodes = $xpath->query($q);
            if ($nodes->length) {
                return $this->absoluteUrl($nodes->item(0)->nodeValue, $baseUrl);
            }
        }

        // Default /favicon.ico
        $parsed = parse_url($baseUrl);
        return ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '') . '/favicon.ico';
    }

    private function extractFont(\DOMXPath $xpath): ?string
    {
        // Google Fonts link — extract family name
        $links = $xpath->query('//link[contains(@href,"fonts.googleapis.com")]/@href');
        if ($links->length) {
            $href = $links->item(0)->nodeValue;
            if (preg_match('/family=([^:&|]+)/', $href, $m)) {
                return urldecode(str_replace('+', ' ', $m[1]));
            }
        }

        // @import in <style>
        $styles = $xpath->query('//style');
        foreach ($styles as $style) {
            if (preg_match('/fonts\.googleapis\.com\/css[^"\']*family=([^:&|"\']+)/', $style->textContent, $m)) {
                return urldecode(str_replace('+', ' ', $m[1]));
            }
        }

        return null;
    }

    private function extractColors(string $html): array
    {
        // Grab the first 8000 chars of HTML to keep regex fast
        $chunk = substr($html, 0, 8000);

        preg_match_all('/#([0-9a-fA-F]{6})\b/', $chunk, $matches);

        $counts = array_count_values(array_map('strtolower', $matches[1] ?? []));
        arsort($counts);

        $filtered = [];
        foreach (array_keys($counts) as $hex) {
            [$r, $g, $b] = sscanf($hex, '%02x%02x%02x');
            $l = (0.299 * $r + 0.587 * $g + 0.114 * $b) / 255;
            // Skip near-white and near-black
            if ($l > 0.08 && $l < 0.92) {
                $filtered[] = '#' . $hex;
            }
            if (count($filtered) >= 5) break;
        }

        return $filtered;
    }

    private function extractMeta(\DOMXPath $xpath, string $name): ?string
    {
        $nodes = $xpath->query("//meta[@name='{$name}']/@content");
        return $nodes->length ? trim($nodes->item(0)->nodeValue) : null;
    }

    private function extractOgMeta(\DOMXPath $xpath, string $property): ?string
    {
        $nodes = $xpath->query("//meta[@property='{$property}']/@content");
        return $nodes->length ? trim($nodes->item(0)->nodeValue) : null;
    }

    // ── AI enrichment ─────────────────────────────────────────────────────────

    private function enrichWithAi(array $parsed, string $url): array
    {
        $colorsHint  = implode(', ', $parsed['_colors_hint'] ?? []) ?: 'none found';
        $themeColor  = $parsed['_theme_color'] ?? 'not set';

        $prompt = implode("\n", [
            "Website URL: {$url}",
            "Page title: " . ($parsed['_title'] ?? ''),
            "og:site_name / company name candidate: " . ($parsed['company_name'] ?? ''),
            "Meta description: " . ($parsed['description'] ?? ''),
            "og:description: " . ($parsed['_og_description'] ?? ''),
            "theme-color meta: {$themeColor}",
            "Colors found in CSS/HTML: {$colorsHint}",
            "Font found: " . ($parsed['font_family'] ?? 'none'),
        ]);

        try {
            $response = WebsiteIntelligenceAgent::make()->prompt($prompt);
            $data     = json_decode($response->text, true);

            if (! is_array($data)) {
                return [];
            }

            return [
                'company_name'    => $data['company_name']    ?? $parsed['company_name'],
                'description'     => $data['description']     ?? $parsed['description'],
                'primary_color'   => $data['primary_color']   ?? null,
                'secondary_color' => $data['secondary_color'] ?? null,
                'accent_color'    => $data['accent_color']    ?? null,
                'font_family'     => $data['font_family']     ?? $parsed['font_family'],
            ];
        } catch (\Throwable $e) {
            Log::warning('WebsiteIntelligenceService: AI enrichment failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function normaliseUrl(string $url): string
    {
        $url = trim($url);
        if (! preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }
        return rtrim($url, '/');
    }

    private function absoluteUrl(string $href, string $baseUrl): string
    {
        if (preg_match('#^https?://#i', $href)) return $href;
        if (str_starts_with($href, '//')) return 'https:' . $href;

        $parsed = parse_url($baseUrl);
        $origin = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '');

        return str_starts_with($href, '/')
            ? $origin . $href
            : $origin . '/' . ltrim($href, '/');
    }

    private function emptyResult(string $url): array
    {
        return [
            'website_url'     => $url,
            'company_name'    => null,
            'description'     => null,
            'logo_url'        => null,
            'favicon_url'     => null,
            'primary_color'   => null,
            'secondary_color' => null,
            'accent_color'    => null,
            'font_family'     => null,
        ];
    }
}
