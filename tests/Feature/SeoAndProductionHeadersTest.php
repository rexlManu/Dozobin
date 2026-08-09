<?php

use App\Models\InstallationSetting;
use App\Models\Share;
use Illuminate\Support\Facades\Storage;

it('blocks crawlers before installation', function (): void {
    config(['seo.indexing_enabled' => true]);

    $this->get('/')
        ->assertRedirect()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');

    $this->get('/robots.txt')
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
        ->assertSee("User-agent: *\nDisallow: /", false);

    $this->get('/sitemap.xml')
        ->assertOk()
        ->assertDontSee('<loc>', false);
});

it('generates production robots and sitemap responses dynamically', function (): void {
    InstallationSetting::factory()->create();
    config(['seo.indexing_enabled' => true]);
    $homeUrl = rtrim((string) config('app.url'), '/');
    $sitemapUrl = $homeUrl.'/sitemap.xml';

    $this->get('/robots.txt')
        ->assertOk()
        ->assertSee('Allow: /', false)
        ->assertSee('Disallow: /admin/', false)
        ->assertSee('Sitemap: '.$sitemapUrl, false);

    $this->get('/sitemap.xml')
        ->assertOk()
        ->assertHeader('Content-Type', 'text/xml; charset=UTF-8')
        ->assertSee('<loc>'.$homeUrl.'</loc>', false)
        ->assertSee('<priority>1.0</priority>', false);
});

it('uses the application name in the browser title', function (): void {
    InstallationSetting::factory()->create();
    $this->withoutVite();

    $this->get('/signin')
        ->assertOk()
        ->assertSee('Dōzobin</title>', false)
        ->assertDontSee('Laravel</title>', false);
});

it('renders indexable metadata only on the Drop Workspace', function (): void {
    InstallationSetting::factory()->create();
    config(['seo.indexing_enabled' => true]);
    $this->withoutVite();
    $canonical = rtrim((string) config('app.url'), '/');

    $this->get('/')
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'index, follow')
        ->assertSee('<meta data-server-seo name="robots" content="index, follow">', false)
        ->assertSee('<link data-server-seo rel="canonical" href="'.$canonical.'">', false)
        ->assertSee('https://schema.org', false);

    $this->get('/signin')
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
        ->assertSee('<meta data-server-seo name="robots" content="noindex, nofollow, noarchive">', false)
        ->assertDontSee('rel="canonical"', false);
});

it('keeps unlisted shares out of search results', function (): void {
    InstallationSetting::factory()->create();
    config(['seo.indexing_enabled' => true]);
    $this->withoutVite();
    $share = Share::factory()->file()->create();

    $this->get(route('shares.show', $share))
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
        ->assertSee('<meta data-server-seo name="robots" content="noindex, nofollow, noarchive">', false);
});

it('sandboxes browser-rendered upload payloads', function (): void {
    InstallationSetting::factory()->create();
    Storage::fake();
    Storage::put('shares/test/payload.html', '<script>window.top.location = "/admin"</script>');
    $share = Share::factory()->file()->create([
        'filename' => 'payload.html',
        'mime_type' => 'text/html',
        'storage_path' => 'shares/test/payload.html',
    ]);

    $this->get(route('shares.content', $share))
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
        ->assertHeader(
            'Content-Security-Policy',
            "sandbox; default-src 'none'; img-src data: blob:; media-src blob:; style-src 'unsafe-inline'",
        );
});
