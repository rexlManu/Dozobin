<?php

namespace Database\Seeders;

use GdImage;
use RuntimeException;
use ZipArchive;

/**
 * Small, real demo files for the seeder, made on the fly so previews,
 * downloads and file sizes all behave like real uploads. Deterministic:
 * the same call always returns the same bytes.
 */
final class DemoFiles
{
    /**
     * A product screenshot: window bar, sidebar, a headline and a row of cards.
     *
     * @param  int<1, max>  $width
     * @param  int<1, max>  $height
     * @param  array{int, int, int}  $accent
     */
    public static function mockup(int $width, int $height, array $accent): string
    {
        $image = self::canvas($width, $height, [246, 243, 238]);
        $ink = self::color($image, [32, 30, 44]);
        $muted = self::color($image, [206, 200, 214]);
        $paper = self::color($image, [255, 255, 255]);
        $tint = self::color($image, $accent);
        $soft = self::color($image, array_map(fn (int $c): int => (int) round($c * 0.35 + 255 * 0.65), $accent));

        imagefilledrectangle($image, 0, 0, $width, 44, $ink);
        foreach ([[255, 95, 86], [255, 189, 46], [39, 201, 63]] as $index => $dot) {
            imagefilledellipse($image, 24 + $index * 22, 22, 12, 12, self::color($image, $dot));
        }

        $sidebar = (int) ($width * 0.2);
        imagefilledrectangle($image, 0, 44, $sidebar, $height, $paper);
        for ($row = 0; $row < 7; $row++) {
            imagefilledrectangle($image, 24, 84 + $row * 40, $sidebar - 40 - ($row % 3) * 24, 96 + $row * 40, $row === 1 ? $tint : $muted);
        }

        $left = $sidebar + 48;
        imagefilledrectangle($image, $left, 84, $left + (int) ($width * 0.36), 110, $ink);
        imagefilledrectangle($image, $left, 126, $left + (int) ($width * 0.5), 138, $muted);
        imagefilledrectangle($image, $left, 150, $left + (int) ($width * 0.42), 162, $muted);

        $cardWidth = (int) (($width - $left - 48 - 2 * 24) / 3);
        for ($card = 0; $card < 3; $card++) {
            $x = $left + $card * ($cardWidth + 24);
            imagefilledrectangle($image, $x, 200, $x + $cardWidth, $height - 60, $paper);
            imagefilledrectangle($image, $x, 200, $x + $cardWidth, 200 + (int) (($height - 260) * 0.5), $card === 0 ? $tint : $soft);
            imagefilledrectangle($image, $x + 20, $height - 130, $x + $cardWidth - 60, $height - 116, $ink);
            imagefilledrectangle($image, $x + 20, $height - 100, $x + $cardWidth - 30, $height - 90, $muted);
        }

        return self::png($image);
    }

    /**
     * A dusk landscape photo: sky gradient, sun and three hill layers.
     *
     * @param  int<1, max>  $width
     * @param  int<1, max>  $height
     */
    public static function photo(int $width, int $height, int $seed): string
    {
        mt_srand($seed);
        $image = imagecreatetruecolor($width, $height) ?: throw new RuntimeException('GD failed.');
        $top = [44 + mt_rand(0, 30), 40, 110 + mt_rand(0, 40)];
        $bottom = [255, 150 + mt_rand(0, 40), 120 + mt_rand(0, 40)];

        for ($y = 0; $y < $height; $y++) {
            $t = $y / $height;
            imageline($image, 0, $y, $width, $y, self::color($image, [
                (int) ($top[0] + ($bottom[0] - $top[0]) * $t),
                (int) ($top[1] + ($bottom[1] - $top[1]) * $t),
                (int) ($top[2] + ($bottom[2] - $top[2]) * $t),
            ]));
        }

        imagefilledellipse($image, (int) ($width * (0.3 + mt_rand(0, 40) / 100)), (int) ($height * 0.58), (int) ($width * 0.12), (int) ($width * 0.12), self::color($image, [255, 236, 196]));

        foreach ([[96, 60, 120, 0.62], [64, 40, 92, 0.72], [34, 22, 52, 0.84]] as [$r, $g, $b, $level]) {
            $points = [0, $height];
            for ($x = 0; $x <= $width; $x += (int) ($width / 12)) {
                $points[] = $x;
                $points[] = (int) ($height * $level + sin($x / $width * 6 + mt_rand(0, 10)) * $height * 0.05);
            }
            $points[] = $width;
            $points[] = $height;
            imagefilledpolygon($image, $points, self::color($image, [$r, $g, $b]));
        }

        ob_start();
        imagejpeg($image, null, 86);

        return (string) ob_get_clean();
    }

    /**
     * A whiteboard snapshot from a phone: sticky notes and marker lines.
     *
     * @param  int<1, max>  $width
     * @param  int<1, max>  $height
     */
    public static function whiteboard(int $width, int $height): string
    {
        $image = self::canvas($width, $height, [250, 250, 247]);
        imagesetthickness($image, 5);
        $marker = self::color($image, [40, 60, 140]);

        foreach ([[0.08, 0.12, [255, 228, 120]], [0.36, 0.1, [255, 190, 210]], [0.64, 0.16, [180, 230, 200]], [0.2, 0.52, [190, 210, 255]], [0.56, 0.56, [255, 228, 120]]] as [$x, $y, $rgb]) {
            $left = (int) ($width * $x);
            $topY = (int) ($height * $y);
            imagefilledrectangle($image, $left, $topY, $left + (int) ($width * 0.22), $topY + (int) ($height * 0.26), self::color($image, $rgb));
            for ($line = 0; $line < 3; $line++) {
                imageline($image, $left + 16, $topY + 30 + $line * 26, $left + (int) ($width * 0.22) - 24 - $line * 14, $topY + 30 + $line * 26, $marker);
            }
        }

        imageline($image, (int) ($width * 0.31), (int) ($height * 0.25), (int) ($width * 0.35), (int) ($height * 0.25), $marker);
        imageline($image, (int) ($width * 0.42), (int) ($height * 0.37), (int) ($width * 0.42), (int) ($height * 0.55), $marker);

        return self::png($image);
    }

    /**
     * A short voice-memo style tone, 16-bit mono PCM.
     *
     * @param  list<float>  $notes  Frequencies in Hz, played one after another.
     */
    public static function wav(float $seconds, array $notes): string
    {
        $rate = 22050;
        $samples = (int) ($seconds * $rate);
        $perNote = max(1, intdiv($samples, count($notes)));
        $data = '';

        for ($index = 0; $index < $samples; $index++) {
            $note = $notes[min(count($notes) - 1, intdiv($index, $perNote))];
            $position = ($index % $perNote) / $perNote;
            $envelope = min(1, $position * 20) * (1 - $position) ** 0.6;
            $data .= pack('v', (int) (sin(2 * M_PI * $note * $index / $rate) * 9000 * $envelope) & 0xFFFF);
        }

        return 'RIFF'.pack('V', 36 + strlen($data)).'WAVEfmt '
            .pack('VvvVVvv', 16, 1, 1, $rate, $rate * 2, 2, 16)
            .'data'.pack('V', strlen($data)).$data;
    }

    /**
     * A one-page PDF with a title and plain text lines.
     *
     * @param  list<string>  $lines
     */
    public static function pdf(string $title, array $lines): string
    {
        $escape = fn (string $text): string => str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
        $stream = "BT /F1 22 Tf 72 740 Td ({$escape($title)}) Tj ET\nBT /F1 12 Tf 72 704 Td 18 TL\n";
        foreach ($lines as $line) {
            $stream .= "({$escape($line)}) '\n";
        }
        $stream .= 'ET';

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($index + 1)." 0 obj\n{$object}\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= 'xref
0 '.(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf.'trailer << /Size '.(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF\n";
    }

    /** @param  array<string, string>  $files  Path inside the archive => contents. */
    public static function zip(array $files): string
    {
        $path = tempnam(sys_get_temp_dir(), 'dozo-zip') ?: throw new RuntimeException('No temp file.');
        $archive = new ZipArchive;
        $archive->open($path, ZipArchive::OVERWRITE);
        foreach ($files as $name => $contents) {
            $archive->addFromString($name, $contents);
        }
        $archive->close();
        $bytes = (string) file_get_contents($path);
        unlink($path);

        return $bytes;
    }

    /** @param  list<list<string|int|float>>  $rows */
    public static function csv(array $rows): string
    {
        return implode("\n", array_map(
            fn (array $row): string => implode(',', array_map(fn ($cell): string => is_string($cell) && str_contains($cell, ',') ? "\"{$cell}\"" : (string) $cell, $row)),
            $rows,
        ))."\n";
    }

    /** Bytes that do not compress, for files whose size matters more than their content. */
    public static function noise(int $bytes, int $seed): string
    {
        mt_srand($seed);
        $data = '';
        while (strlen($data) < $bytes) {
            $data .= pack('N*', ...array_map(fn (): int => mt_rand(), range(1, 1024)));
        }

        return substr($data, 0, $bytes);
    }

    /**
     * @param  int<1, max>  $width
     * @param  int<1, max>  $height
     * @param  array{int, int, int}  $rgb
     */
    private static function canvas(int $width, int $height, array $rgb): GdImage
    {
        $image = imagecreatetruecolor($width, $height) ?: throw new RuntimeException('GD failed.');
        imagefill($image, 0, 0, self::color($image, $rgb));

        return $image;
    }

    /** @param  array{int, int, int}|list<int>  $rgb */
    private static function color(GdImage $image, array $rgb): int
    {
        [$red, $green, $blue] = array_map(fn (int $channel): int => min(255, max(0, $channel)), $rgb);

        return (int) imagecolorallocate($image, $red, $green, $blue);
    }

    private static function png(GdImage $image): string
    {
        ob_start();
        imagepng($image, null, 9);

        return (string) ob_get_clean();
    }
}
