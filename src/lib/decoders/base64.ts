import type { Decoder } from './types';
import { b64ToUtf8 } from '../b64';

const B64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

function printableRatio(s: string): number {
  if (!s.length) return 0;
  let printable = 0;
  for (const c of s) {
    const code = c.charCodeAt(0);
    if (code >= 32 && code < 127) printable++;
    else if (c === '\n' || c === '\r' || c === '\t') printable++;
  }
  return printable / s.length;
}

export const base64Decoder: Decoder = {
  name: 'Base64',
  detect(input) {
    const t = input.trim().replace(/\s/g, '');
    // Real base64 is 4-aligned (padding makes the length a multiple of 4).
    // Requiring alignment filters out most plain words that happen to be
    // valid base64 alphabet (e.g. "administrator").
    if (t.length < 8 || t.length % 4 !== 0) return 0;
    if (!B64_RE.test(t)) return 0;
    // Avoid decoding a string that is already obviously plain text:
    // base64 of real data almost always contains digits or +/ or mixed case.
    const looksLikePlainWord = /^[a-zA-Z]+$/.test(t) && !/[A-Z].*[a-z]|[a-z].*[A-Z]/.test(t);
    if (looksLikePlainWord) return 0;
    try {
      const decoded = atob(t);
      const ratio = printableRatio(decoded);
      if (ratio < 0.85) return 0;
      // Stronger signal if there's padding or it decodes to a long readable blob
      return t.endsWith('=') || decoded.length >= 12 ? 0.88 : 0.6;
    } catch { return 0; }
  },
  decode(input) {
    return b64ToUtf8(input.trim().replace(/\s/g, ''));
  },
};
