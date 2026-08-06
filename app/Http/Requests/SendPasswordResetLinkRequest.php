<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class SendPasswordResetLinkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['email' => ['required', 'email']];
    }
}
