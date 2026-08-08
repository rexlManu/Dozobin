<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('installation_settings', function (Blueprint $table): void {
            $table->timestamp('installed_at')->nullable();
        });

        // Anything that already has a settings row predates the wizard, so it is
        // a finished installation. Without this backfill an upgrade would drop
        // its administrator back into the installer.
        DB::table('installation_settings')
            ->whereNull('installed_at')
            ->update(['installed_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('installation_settings', function (Blueprint $table): void {
            $table->dropColumn('installed_at');
        });
    }
};
