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
        Schema::create('transfer_participants', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('transfer_session_id')->constrained()->cascadeOnDelete();
            $table->uuid('browser_id');
            $table->string('label');
            $table->string('device');
            $table->timestamp('joined_at');
            $table->timestamp('left_at')->nullable();
            $table->timestamps();
            $table->unique(['transfer_session_id', 'browser_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfer_participants');
    }
};
