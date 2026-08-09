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
        Schema::table('installation_settings', function (Blueprint $table): void {
            $table->text('tracking_code')->nullable()->after('malware_scanning_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('installation_settings', function (Blueprint $table): void {
            $table->dropColumn('tracking_code');
        });
    }
};
