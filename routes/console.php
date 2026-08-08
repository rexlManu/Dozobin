<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('transfers:cleanup-expired')
    ->everyMinute()
    ->onOneServer()
    ->withoutOverlapping();

Schedule::command('shares:cleanup-expired-payloads')
    ->hourly()
    ->onOneServer()
    ->withoutOverlapping();
