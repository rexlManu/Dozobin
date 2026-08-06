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
        Schema::create('transfer_sessions', function (Blueprint $table): void {
            $table->id();
            $table->string('access_code', 8)->unique();
            $table->timestamp('last_activity_at')->index();
            $table->timestamp('expires_at')->index();
            $table->timestamp('expired_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfer_sessions');
    }
};
