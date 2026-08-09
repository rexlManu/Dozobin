@php
    $seoIndexable = (bool) config('seo.indexing_enabled') && request()->routeIs('home');
    $seoDescription = (string) config('seo.description');
    $seoCanonical = rtrim((string) config('app.url'), '/');
    $seoImage = config('seo.image');
    $seoRobots = $seoIndexable ? 'index, follow' : 'noindex, nofollow, noarchive';
    $seoStructuredData = [
        '@context' => 'https://schema.org',
        '@type' => 'SoftwareApplication',
        'name' => config('app.name'),
        'description' => $seoDescription,
        'url' => $seoCanonical,
        'applicationCategory' => 'UtilitiesApplication',
        'operatingSystem' => 'Web',
        'isAccessibleForFree' => true,
    ];
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => data_get($page, 'props.appearance') === 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta data-server-seo name="description" content="{{ $seoDescription }}">
        <meta data-server-seo name="robots" content="{{ $seoRobots }}">

        @if ($seoIndexable)
            <link data-server-seo rel="canonical" href="{{ $seoCanonical }}">
            <meta data-server-seo property="og:type" content="website">
            <meta data-server-seo property="og:site_name" content="{{ config('app.name') }}">
            <meta data-server-seo property="og:title" content="Drop - {{ config('app.name') }}">
            <meta data-server-seo property="og:description" content="{{ $seoDescription }}">
            <meta data-server-seo property="og:url" content="{{ $seoCanonical }}">
            <meta data-server-seo name="twitter:card" content="{{ is_string($seoImage) && $seoImage !== '' ? 'summary_large_image' : 'summary' }}">

            @if (is_string($seoImage) && $seoImage !== '')
                <meta data-server-seo property="og:image" content="{{ $seoImage }}">
                <meta data-server-seo name="twitter:image" content="{{ $seoImage }}">
            @endif

            <script data-server-seo type="application/ld+json">{!! json_encode($seoStructuredData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) !!}</script>
        @endif

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        <x-inertia::head>
            <title>{{ config('app.name', 'Dōzobin') }}</title>
        </x-inertia::head>

        @if ($trackingScriptAttributes !== null)
            <script {{ new Illuminate\View\ComponentAttributeBag($trackingScriptAttributes) }}></script>
        @endif
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
