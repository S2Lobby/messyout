import type { Decoder } from './types';

const B64URL_RE = /^[A-Za-z0-9_-]+={0,2}$/;

function printableRatio(s: string): number {
  if (!s.length) return 0;
  let p = 0;
  for (const c of s) {
    const x = c.charCodeAt(0);
    if ((x >= 32 && x < 127) || c === '\n' || c === '\r' || c === '\t') p++;
  }
  return p / s.length;
}

function decode(t: string): string {
  const padded = t + '='.repeat((4 - t.length % 4) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}

export const base64urlDecoder: Decoder = {
  name: 'Base64URL',
  detect(input) {
    const t = input.trim();
    // Must use the URL-safe alphabet (- or _) to distinguish from standard
    // base64, and must NOT be a JWT (which has dots and is handled elsewhere).
    if (t.includes('.')) return 0;
    if (!/[_-]/.test(t)) return 0;
    if (t.length < 12 || !B64URL_RE.test(t)) return 0;
    // Reject all-letter single-case words (mirrors the base64 guard).
    if (/^[a-zA-Z]+$/.test(t) && !/[A-Z].*[a-z]|[a-z].*[A-Z]/.test(t)) return 0;
    try {
      const d = decode(t);
      return d.length >= 8 && printableRatio(d) >= 0.85 ? 0.8 : 0;
    } catch { return 0; }
  },
  decode(input) {
    return decode(input.trim());
  },
};
