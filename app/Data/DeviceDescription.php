<?php

namespace App\Data;

/**
 * A human name for a browser, read from its user agent: "iPhone · Safari".
 * Used to tell Transfer Session devices apart and to list account sessions.
 */
final readonly class DeviceDescription
{
    public function __construct(
        public string $platform,
        public string $browser,
        public bool $isPhone,
    ) {}

    public static function fromUserAgent(?string $agent): self
    {
        $agent = (string) $agent;

        $platform = match (true) {
            str_contains($agent, 'iPhone') => 'iPhone',
            str_contains($agent, 'iPad') => 'iPad',
            str_contains($agent, 'Android') => str_contains($agent, 'Mobile') ? 'Android phone' : 'Android tablet',
            str_contains($agent, 'CrOS') => 'Chromebook',
            str_contains($agent, 'Macintosh') => 'Mac',
            str_contains($agent, 'Windows') => 'Windows PC',
            str_contains($agent, 'Linux') => 'Linux PC',
            default => 'Browser',
        };

        $browser = match (true) {
            str_contains($agent, 'Edg') => 'Edge',
            str_contains($agent, 'OPR/') => 'Opera',
            str_contains($agent, 'Firefox/') || str_contains($agent, 'FxiOS/') => 'Firefox',
            str_contains($agent, 'Chrome/') || str_contains($agent, 'CriOS/') => 'Chrome',
            str_contains($agent, 'Safari/') => 'Safari',
            default => 'Browser',
        };

        return new self($platform, $browser, str_contains($agent, 'Mobile') || $platform === 'iPhone');
    }

    public function label(): string
    {
        if ($this->platform === 'Browser') {
            return $this->browser === 'Browser' ? 'A browser' : $this->browser;
        }

        return $this->browser === 'Browser' ? $this->platform : "{$this->platform} · {$this->browser}";
    }
}
