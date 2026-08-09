<?php

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMText;
use Throwable;

final class TrackingScriptParser
{
    private const ALLOWED_ATTRIBUTES = [
        'src',
        'defer',
        'async',
        'integrity',
        'crossorigin',
        'referrerpolicy',
    ];

    /** @return array<string, string|bool>|null */
    public function parse(?string $trackingCode): ?array
    {
        if ($trackingCode === null || trim($trackingCode) === '') {
            return null;
        }

        $previousErrorHandling = libxml_use_internal_errors(true);

        try {
            $document = new DOMDocument;
            $loaded = $document->loadHTML(
                '<!DOCTYPE html><html><body><div id="tracking-script-root">'.trim($trackingCode).'</div></body></html>',
                LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING,
            );

            if (! $loaded) {
                return null;
            }

            $root = $document->getElementById('tracking-script-root');

            if (! $root instanceof DOMElement) {
                return null;
            }

            $children = [];

            foreach ($root->childNodes as $child) {
                if ($child instanceof DOMText && trim($child->textContent) === '') {
                    continue;
                }

                $children[] = $child;
            }

            if (count($children) !== 1
                || ! $children[0] instanceof DOMElement
                || strtolower($children[0]->tagName) !== 'script'
                || trim($children[0]->textContent) !== '') {
                return null;
            }

            $attributes = [];

            foreach ($children[0]->attributes as $attribute) {
                $name = strtolower($attribute->name);

                if (! in_array($name, self::ALLOWED_ATTRIBUTES, true) && ! str_starts_with($name, 'data-')) {
                    return null;
                }

                $attributes[$name] = in_array($name, ['defer', 'async'], true)
                    ? true
                    : $attribute->value;
            }

            $source = $attributes['src'] ?? null;

            if (! is_string($source)
                || filter_var($source, FILTER_VALIDATE_URL) === false
                || strtolower((string) parse_url($source, PHP_URL_SCHEME)) !== 'https'
                || ! is_string(parse_url($source, PHP_URL_HOST))) {
                return null;
            }

            return $attributes;
        } catch (Throwable) {
            return null;
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previousErrorHandling);
        }
    }
}
