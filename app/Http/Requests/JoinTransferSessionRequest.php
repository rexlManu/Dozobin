<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class JoinTransferSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['code' => ['required', 'string', 'size:8', 'regex:/^[A-Z0-9]{8}$/']];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['code' => strtoupper((string) $this->input('code'))]);
    }
}
