import type { Decoder } from './types';

const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;

function b64urlToStr(part: string): string {
  const padded = part + '='.repeat((4 - part.length % 4) % 4);
  try { return atob(padded.replace(/-/g, '+').replace(/_/g, '/')); }
  catch { return part; }
}

function parseObj(part: string): Record<string, unknown> | null {
  try {
    const obj = JSON.parse(b64urlToStr(part));
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : null;
  } catch { return null; }
}

function pretty(part: string): string {
  const obj = parseObj(part);
  return obj ? JSON.stringify(obj, null, 2) : b64urlToStr(part);
}

export const jwtDecoder: Decoder = {
  name: 'JWT',
  detect(input) {
    const t = input.trim();
    if (!JWT_RE.test(t)) return 0;
    // Real JWT: header must be a JSON object carrying an `alg`. This rejects
    // look-alikes such as "aaa.bbb.ccc" or version strings.
    const header = parseObj(t.split('.')[0]);
    return header && 'alg' in header ? 0.99 : 0;
  },
  decode(input) {
    const parts = input.trim().split('.');
    if (parts.length !== 3) return input;
    return `// Header\n${pretty(parts[0])}\n\n// Payload\n${pretty(parts[1])}\n\n// Signature (raw)\n${parts[2]}`;
  },
};
