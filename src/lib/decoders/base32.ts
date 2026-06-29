import type { Decoder } from './types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const B32_RE = /^[A-Za-z2-7]+=*$/;

function base32Decode(input: string): string {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = 0, value = 0, out = '';
  for (const c of clean) {
    const idx = ALPHABET.indexOf(c);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((value >>> bits) & 0xff);
    }
  }
  return out;
}

function printableRatio(s: string): number {
  if (!s.length) return 0;
  let p = 0;
  for (const c of s) {
    const x = c.charCodeAt(0);
    if ((x >= 32 && x < 127) || c === '\n' || c === '\r' || c === '\t') p++;
  }
  return p / s.length;
}

export const base32Decoder: Decoder = {
  name: 'Base32',
  detect(input) {
    const t = input.trim().replace(/\s/g, '');
    if (t.length < 8 || !B32_RE.test(t)) return 0;
    // Base32 blocks are 8 chars; valid final-quantum remainders are 2,4,5,7
    // (or 0). This accepts both padded and unpadded (RFC 4648 padding is
    // optional, e.g. `base32 -w0` and many CTF generators omit it).
    if (![0, 2, 4, 5, 7].includes(t.replace(/=+$/, '').length % 8)) return 0;
    try {
      const d = base32Decode(t);
      return d.length >= 3 && printableRatio(d) >= 0.9 ? 0.7 : 0;
    } catch { return 0; }
  },
  decode(input) {
    return base32Decode(input.trim());
  },
};
