<?php

namespace App\Http\Requests;

use App\Enums\TakedownReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** A takedown report from anyone, signed in or not. */
final class StoreTakedownRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'share_url' => ['required', 'url:http,https', 'max:2048'],
            'reason' => ['required', Rule::enum(TakedownReason::class)],
            'details' => ['required', 'string', 'min:10', 'max:5000'],
            'reporter_name' => ['nullable', 'string', 'max:120'],
            'reporter_email' => ['required', 'email', 'max:255'],
            'good_faith' => ['accepted'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'good_faith.accepted' => 'Please confirm that this report is true to the best of your knowledge.',
        ];
    }
}
