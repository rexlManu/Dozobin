/*
  The prototype has no backend, so seeded shares have no bytes behind them.
  Rather than faking a preview with styled divs, two of the sample formats are
  generated for real in the browser: a one-page PDF and a short WAV tone. Those
  previews are genuine. Video is the one format that cannot be synthesised
  cheaply, so its preview says so instead of pretending.
*/

let pdfUrl: string | null = null;
let wavUrl: string | null = null;

function buildPdf(lines: string[]): string {
    const escape = (s: string) => s.replace(/([\\()])/g, '\\$1');
    const content =
        'BT\n/F1 20 Tf\n60 780 Td\n24 TL\n' +
        lines.map((line) => `(${escape(line)}) Tj T*`).join('\n') +
        '\nET\n';

    const objects = [
        '<</Type/Catalog/Pages 2 0 R>>',
        '<</Type/Pages/Kids[3 0 R]/Count 1>>',
        '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
        '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
        `<</Length ${content.length}>>\nstream\n${content}endstream`,
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];
    objects.forEach((body, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;

    for (const offset of offsets) {
        pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;

    return pdf;
}

export function samplePdfUrl(): string {
    if (pdfUrl) {
        return pdfUrl;
    }

    const pdf = buildPdf([
        'Invoice 2026-0417',
        '',
        'Hartkamp Interface Works',
        'Colocation, rack 4B, July 2026',
        '',
        'Line 1  Half rack, 2U reserved      EUR 184.00',
        'Line 2  Metered bandwidth           EUR  61.40',
        'Line 3  Remote hands, 40 min        EUR  48.00',
        '',
        'Total                               EUR 293.40',
    ]);
    const blob = new Blob([pdf], { type: 'application/pdf' });
    pdfUrl = URL.createObjectURL(blob);

    return pdfUrl;
}

export function sampleWavUrl(): string {
    if (wavUrl) {
        return wavUrl;
    }

    const rate = 11025;
    const seconds = 4;
    const frames = rate * seconds;
    const buffer = new ArrayBuffer(44 + frames * 2);
    const view = new DataView(buffer);

    const ascii = (offset: number, text: string) => {
        for (let i = 0; i < text.length; i += 1) {
            view.setUint8(offset + i, text.charCodeAt(i));
        }
    };

    ascii(0, 'RIFF');
    view.setUint32(4, 36 + frames * 2, true);
    ascii(8, 'WAVEfmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    ascii(36, 'data');
    view.setUint32(40, frames * 2, true);

    // Four descending plucked notes, so the waveform reads as intentional audio.
    const notes = [523.25, 392.0, 329.63, 261.63];

    for (let i = 0; i < frames; i += 1) {
        const t = i / rate;
        const note = notes[Math.min(notes.length - 1, Math.floor(t))];
        const envelope = Math.exp(-4 * (t % 1));
        const value = Math.sin(2 * Math.PI * note * t) * envelope * 0.32;
        view.setInt16(44 + i * 2, Math.round(value * 32767), true);
    }

    wavUrl = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));

    return wavUrl;
}

export function picsum(seed: string, width: number, height: number): string {
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
}
