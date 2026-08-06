<?php

namespace App\Http\Requests;

use App\Data\CreateFileShareData;
use App\Enums\Expiration;
use App\Models\InstallationSetting;
use App\Models\Share;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class StoreFileShareRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Share::class)
            ?? InstallationSetting::current()->guest_sharing;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $settings = InstallationSetting::current();

        return [
            'file' => ['required', 'file', 'max:'.($settings->max_upload_mb * 1024)],
            'expiration' => ['required', Rule::enum(Expiration::class), Rule::in($settings->expirationsFor($this->user()))],
            'password' => ['nullable', 'string', 'min:4', 'max:255'],
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $settings = InstallationSetting::current();
            $file = $this->file('file');

            if (! $file instanceof UploadedFile) {
                return;
            }

            if ($this->user() === null && $this->filled('password') && ! $settings->guest_password_protection) {
                $validator->errors()->add('password', 'Guests cannot protect shares on this installation.');
            }

            $extension = strtolower($file->getClientOriginalExtension());
            $listed = in_array($extension, $settings->file_type_list, true);
            $blocked = $settings->file_type_mode === 'block' ? $listed : ! $listed;
            if ($settings->file_type_list !== [] && $blocked) {
                $validator->errors()->add('file', "Files with the .{$extension} extension are not allowed.");
            }

            $user = $this->user();
            if ($user !== null) {
                $used = (int) $user->shares()->sum('size_bytes');
                if ($used + $file->getSize() > $user->storage_limit) {
                    $validator->errors()->add('file', 'This upload would exceed your storage quota.');
                }
            }
        }];
    }

    public function toData(): CreateFileShareData
    {
        /** @var UploadedFile $file */
        $file = $this->file('file');

        return new CreateFileShareData(
            file: $file,
            expiration: Expiration::from($this->string('expiration')->toString()),
            password: $this->filled('password') ? $this->string('password')->toString() : null,
        );
    }
}
