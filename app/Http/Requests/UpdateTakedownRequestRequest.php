<?php

namespace App\Http\Requests;

use App\Enums\TakedownStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateTakedownRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(TakedownStatus::class)],
            'remove_share' => ['sometimes', 'boolean'],
        ];
    }
}
