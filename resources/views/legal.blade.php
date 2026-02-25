<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title') — PromptForm</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; background: #fff; line-height: 1.7; }
        header { border-bottom: 1px solid #e5e7eb; padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
        header a { text-decoration: none; color: #111; font-weight: 600; font-size: 18px; }
        header span { color: #6b7280; font-size: 14px; }
        main { max-width: 760px; margin: 48px auto; padding: 0 24px 80px; }
        h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .meta { color: #6b7280; font-size: 14px; margin-bottom: 40px; }
        h2 { font-size: 18px; font-weight: 600; margin: 36px 0 12px; }
        p { margin-bottom: 14px; color: #374151; }
        ul { margin: 0 0 14px 20px; color: #374151; }
        ul li { margin-bottom: 6px; }
        a { color: #2563eb; }
        footer { border-top: 1px solid #e5e7eb; padding: 24px; text-align: center; font-size: 13px; color: #9ca3af; }
        footer a { color: #6b7280; }
    </style>
</head>
<body>
    <header>
        <a href="https://promptform.mesh99.com">PromptForm</a>
        <span>/ @yield('title')</span>
    </header>

    <main>
        @yield('content')
    </main>

    <footer>
        <a href="/privacy-policy">Privacy Policy</a> &nbsp;·&nbsp;
        <a href="/terms">Terms of Service</a> &nbsp;·&nbsp;
        &copy; {{ date('Y') }} PromptForm
    </footer>
</body>
</html>
