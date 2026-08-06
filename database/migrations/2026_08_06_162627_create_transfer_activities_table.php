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
        Schema::create('transfer_activities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('transfer_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('transfer_participant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('actor');
            $table->string('description');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfer_activities');
    }
};
