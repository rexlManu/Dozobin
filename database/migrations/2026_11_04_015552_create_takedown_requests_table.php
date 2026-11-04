<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('takedown_requests', function (Blueprint $table): void {
            $table->id();
            // Kept when the share is deleted, so the report still says what it was about.
            $table->foreignId('share_id')->nullable()->constrained()->nullOnDelete();
            $table->string('share_url', 2048);
            $table->string('reason', 32);
            $table->text('details');
            $table->string('reporter_name', 120)->nullable();
            $table->string('reporter_email');
            $table->string('status', 32)->default('open')->index();
            $table->foreignId('handled_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('handled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('takedown_requests');
    }
};
