import type { Decoder } from './types';

// Pure hex like "48656c6c6f" (even length)
const PURE_HEX_RE = /^(0x)?[0-9a-fA-F]+$/;
// Hex with spaces like "48 65 6c 6c 6f"
const SPACED_HEX_RE = /^([0-9a-fA-F]{2}[\s:]+)+[0-9a-fA-F]{2}$/;

function decodeHexStr(hex: string): string {
  let out = '';
  for (let i = 0; i < hex.length; i += 2) {
    out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
  }
  return out;
}

function printableRatio(s: string): number {
  if (!s.length) return 0;
  let p = 0;
  for (const c of s) {
    const code = c.charCodeAt(0);
    if ((code >= 32 && code < 127) || c === '\n' || c === '\r' || c === '\t') p++;
  }
  return p / s.length;
}

export const hexDecoder: Decoder = {
  name: 'Hex',
  detect(input) {
    const t = input.trim();
    if (SPACED_HEX_RE.test(t)) return 0.85;
    if (PURE_HEX_RE.test(t)) {
      const clean = t.replace(/^0x/, '');
      if (clean.length < 8 || clean.length % 2 !== 0) return 0;
      // Only treat as hex-encoded text if it decodes to mostly printable chars.
      // This avoids "decoding" things like real hex hashes or random hex IDs.
      const ratio = printableRatio(decodeHexStr(clean));
      return ratio >= 0.9 ? 0.65 : 0;
    }
    return 0;
  },
  decode(input) {
    const hex = input.trim().replace(/^0x/, '').replace(/[\s:]+/g, '');
    return decodeHexStr(hex);
  },
};
