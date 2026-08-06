<?php

namespace App\Http\Requests;

use App\Enums\Appearance;
use App\Enums\Expiration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users')->ignore($this->user()?->id)],
            'appearance' => ['sometimes', Rule::enum(Appearance::class)],
            'default_expiration' => ['sometimes', Rule::enum(Expiration::class)],
            'avatar' => ['sometimes', 'nullable', 'image', 'max:2048'],
            'remove_avatar' => ['sometimes', 'boolean'],
        ];
    }
}
