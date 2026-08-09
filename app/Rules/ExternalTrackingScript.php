<?php

namespace App\Rules;

use App\Services\TrackingScriptParser;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

final class ExternalTrackingScript implements ValidationRule
{
    public function __construct(private readonly TrackingScriptParser $parser) {}

    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        if (! is_string($value) || $this->parser->parse($value) === null) {
            $fail('The :attribute must be one external HTTPS script tag without inline JavaScript.');
        }
    }
}
