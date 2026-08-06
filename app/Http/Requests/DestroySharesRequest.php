<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class DestroySharesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:100'],
            'ids.*' => ['required', 'string', 'distinct', 'exists:shares,slug'],
        ];
    }
}
