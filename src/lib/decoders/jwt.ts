import type { Decoder } from './types';
import { b64urlToUtf8 } from '../b64';

const JWT_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;

function b64urlToStr(part: string): string {
  try { return b64urlToUtf8(part); }
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

// Security notes a pentester wants at a glance — alg confusion, expiry, claims.
function analyze(header: Record<string, unknown> | null, payload: Record<string, unknown> | null): string {
  const warns: string[] = [];
  const alg = header?.alg;
  if (typeof alg === 'string') {
    if (/^none$/i.test(alg)) warns.push('⚠ alg:none — signature not verified; forge freely if the server accepts it');
    else if (/^HS/i.test(alg)) warns.push('⚠ HMAC (HS*) — brute-force the secret (hashcat -m 16500) or try RS→HS key confusion');
  }
  if (payload) {
    if (payload.exp == null) warns.push('⚠ no "exp" — token never expires');
    else if (typeof payload.exp === 'number') {
      const exp = new Date(payload.exp * 1000);
      warns.push(payload.exp * 1000 < Date.now() ? `⚠ EXPIRED at ${exp.toISOString()}` : `exp: ${exp.toISOString()}`);
    }
    for (const k of ['admin', 'role', 'isAdmin', 'is_admin', 'scope', 'groups', 'roles']) {
      if (k in payload) warns.push(`claim "${k}": ${JSON.stringify(payload[k])} — tamper target`);
    }
  }
  return warns.length ? `\n\n// Security\n${warns.join('\n')}` : '';
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
    const security = analyze(parseObj(parts[0]), parseObj(parts[1]));
    return `// Header\n${pretty(parts[0])}\n\n// Payload\n${pretty(parts[1])}\n\n// Signature (raw)\n${parts[2]}${security}`;
  },
};
