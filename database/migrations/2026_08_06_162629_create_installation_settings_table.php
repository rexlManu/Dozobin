<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('installation_settings', function (Blueprint $table): void {
            $table->id();
            $table->boolean('guest_sharing')->default(true);
            $table->string('registration', 16)->default('open');
            $table->json('guest_expirations');
            $table->json('member_expirations');
            $table->string('guest_default_expiration', 8)->default('1d');
            $table->string('member_default_expiration', 8)->default('7d');
            $table->boolean('guest_password_protection')->default(true);
            $table->unsignedInteger('default_quota_mb')->default(5120);
            $table->unsignedInteger('max_upload_mb')->default(512);
            $table->string('file_type_mode', 16)->default('block');
            $table->json('file_type_list');
            $table->unsignedTinyInteger('transfer_window_hours')->default(12);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('installation_settings');
    }
};
