<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class DismissUpdateNoticeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'version' => ['required', 'string', 'regex:/\A\d+\.\d+\.\d+\z/'],
        ];
    }
}
