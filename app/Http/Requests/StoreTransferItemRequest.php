<?php

namespace App\Http\Requests;

use App\Models\InstallationSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

final class StoreTransferItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $max = InstallationSetting::current()->max_upload_mb * 1024;

        return [
            'file' => ['nullable', 'file', "max:{$max}", 'required_without:body'],
            'body' => ['nullable', 'string', 'max:1000000', 'required_without:file'],
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->hasFile('file') && $this->filled('body')) {
                $validator->errors()->add('body', 'Add a file or text, not both at once.');
            }
        }];
    }
}
