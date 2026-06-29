import { b64ToUtf8 } from './b64';

export interface EmbeddedToken {
  type: 'Base64' | 'Hex' | 'JWT';
  raw: string;
  decoded: string;
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

function truncate(s: string, n = 200): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export function findEmbedded(text: string): EmbeddedToken[] {
  // Only scan plaintext that wasn't itself one big token.
  const trimmed = text.trim();
  if (trimmed.length < 24) return [];

  const out: EmbeddedToken[] = [];
  const seen = new Set<string>();
  // Dedupe on the full token (key), not the truncated display value.
  const add = (key: string, t: EmbeddedToken) => {
    if (seen.has(key) || out.length >= 20) return;
    seen.add(key);
    out.push(t);
  };

  // JWT tokens
  const jwtRe = /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]*\b/g;
  let jm: RegExpExecArray | null;
  while ((jm = jwtRe.exec(text)) !== null) {
    const [h, p] = jm[0].split('.');
    try {
      const pad = (s: string) => s + '='.repeat((4 - s.length % 4) % 4);
      const header = JSON.parse(atob(pad(h).replace(/-/g, '+').replace(/_/g, '/')));
      if (header && header.alg) {
        const payload = atob(pad(p).replace(/-/g, '+').replace(/_/g, '/'));
        add(jm[0], { type: 'JWT', raw: truncate(jm[0], 50), decoded: truncate(payload) });
      }
    } catch { /* skip */ }
  }

  // Base64 runs (maximal runs of base64 chars + optional padding, ≥16).
  // NOTE: no \b before the padding — \b sits between the last alnum and '=',
  // which would strip the padding and break length%4 for every padded token.
  const b64Re = /[A-Za-z0-9+/]{16,}={0,2}/g;
  let bm: RegExpExecArray | null;
  while ((bm = b64Re.exec(text)) !== null) {
    const tok = bm[0];
    if (tok.length % 4 !== 0) continue;
    if (/^[a-zA-Z]+$/.test(tok)) continue; // plain word, not base64
    try {
      const decoded = b64ToUtf8(tok);
      if (printableRatio(decoded) >= 0.9 && decoded.length >= 8) {
        add(tok, { type: 'Base64', raw: truncate(tok, 50), decoded: truncate(decoded) });
      }
    } catch { /* skip */ }
  }

  // Hex runs (≥16 even-length hex that decode to printable text)
  const hexRe = /\b[0-9a-fA-F]{16,}\b/g;
  let hm: RegExpExecArray | null;
  while ((hm = hexRe.exec(text)) !== null) {
    const tok = hm[0];
    if (tok.length % 2 !== 0) continue;
    let decoded = '';
    for (let i = 0; i < tok.length; i += 2) decoded += String.fromCharCode(parseInt(tok.slice(i, i + 2), 16));
    if (printableRatio(decoded) >= 0.95) {
      add(tok, { type: 'Hex', raw: truncate(tok, 50), decoded: truncate(decoded) });
    }
  }

  return out;
}
