import type { Detector, DetectResult } from './types';

// A real hex grid: offset then at least 4 hex byte columns (rejects prose / log
// lines that merely start with hex). Supports xxd, hexdump -C, hexdump, od -t x1.
const HEX_LINE = /^\s*[0-9A-Fa-f]{4,16}:?\s+(?:[0-9A-Fa-f]{2,4}\s+){3,}[0-9A-Fa-f]{2,4}/;
// `od` default prints OCTAL offset + octal 2-byte words — skip, don't corrupt.
const OD_OCTAL_LINE = /^[0-7]{7}\s+[0-7]{6}(\s+[0-7]{6})*\s*$/;

function reconstruct(input: string, maxBytes = 64): number[] {
  const bytes: number[] = [];
  for (const line of input.split('\n')) {
    if (OD_OCTAL_LINE.test(line)) continue;
    if (!HEX_LINE.test(line)) continue;
    let rest = line.replace(/^\s*[0-9A-Fa-f]{4,16}:?\s+/, '');
    if (rest.includes('|')) rest = rest.split('|')[0];   // hexdump -C ASCII column
    else rest = rest.split(/\s{2,}/)[0];                  // xxd ASCII column
    const tokens = rest.match(/[0-9A-Fa-f]+/g) ?? [];
    // `hexdump` (no -C) emits little-endian 2-byte words ("457f" → 7f,45).
    const wordSwap = tokens.length > 0 && tokens.every(t => t.length === 4);
    for (const t of tokens) {
      if (wordSwap) {
        bytes.push(parseInt(t.slice(2, 4), 16), parseInt(t.slice(0, 2), 16));
      } else {
        for (const p of t.match(/../g) ?? []) bytes.push(parseInt(p, 16));
      }
      if (bytes.length >= maxBytes) return bytes.slice(0, maxBytes);
    }
  }
  return bytes;
}

const MAGICS: { sig: number[]; name: string }[] = [
  { sig: [0x7f, 0x45, 0x4c, 0x46], name: 'ELF executable' },
  { sig: [0x4d, 0x5a], name: 'PE / DOS executable (MZ)' },
  { sig: [0x89, 0x50, 0x4e, 0x47], name: 'PNG image' },
  { sig: [0x25, 0x50, 0x44, 0x46], name: 'PDF document' },
  { sig: [0x50, 0x4b, 0x03, 0x04], name: 'ZIP / JAR / Office (PK)' },
  { sig: [0x1f, 0x8b], name: 'gzip archive' },
  { sig: [0xca, 0xfe, 0xba, 0xbe], name: 'Java class / Mach-O' },
  { sig: [0xff, 0xd8, 0xff], name: 'JPEG image' },
  { sig: [0x42, 0x4d], name: 'BMP image' },
  { sig: [0x37, 0x7a, 0xbc, 0xaf], name: '7-Zip archive' },
  { sig: [0x52, 0x61, 0x72, 0x21], name: 'RAR archive' },
  { sig: [0x47, 0x49, 0x46, 0x38], name: 'GIF image' },
];

function idFile(bytes: number[]): string | null {
  for (const m of MAGICS) if (m.sig.every((b, i) => bytes[i] === b)) return m.name;
  return null;
}

export const hexdumpDetector: Detector = {
  detect(input): DetectResult | null {
    if (input.split('\n').filter(l => HEX_LINE.test(l)).length < 2) return null;
    const bytes = reconstruct(input);
    if (bytes.length < 4) return null;
    const file = idFile(bytes);
    const head = bytes.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join(' ');
    return {
      language: 'plaintext',
      displayName: file ? `Hexdump · ${file}` : 'Hexdump',
      confidence: 0.9,
      explain: [
        { pattern: /.*/, label: 'Hexdump', description: file ? `Magic bytes identify this as: ${file}` : 'Hex + ASCII dump (xxd / hexdump -C / od)' },
        { pattern: /.*/, label: 'First bytes', description: head },
      ],
    };
  },
};
