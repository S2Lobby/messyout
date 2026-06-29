import type { Decoder } from './types';

const ENTITY_RE = /&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g;
const ANY_ENTITY = /&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g;

// Common named entities. Numeric (&#nn; / &#xNN;) handled separately.
const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  nbsp: ' ', copy: '©', reg: '®', trade: '™', deg: '°',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’',
  ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', middot: '·',
  bull: '•', dagger: '†', euro: '€', pound: '£', cent: '¢', yen: '¥',
  sect: '§', para: '¶', plusmn: '±', times: '×', divide: '÷',
  frac12: '½', frac14: '¼', frac34: '¾', micro: 'µ', infin: '∞',
};

export const htmlEntitiesDecoder: Decoder = {
  name: 'HTML Entities',
  detect(input) {
    const matches = (input.match(ANY_ENTITY) || []).length;
    if (matches === 0) return 0;
    return Math.min(0.95, 0.5 + matches * 0.05);
  },
  // Pure string transform — decodes ONLY entities and leaves all markup intact.
  // Deliberately avoids DOMParser/innerHTML (which would strip tags AND can
  // execute attacker-controlled payloads like the XSS/SSRF output users paste).
  decode(input) {
    return input.replace(ENTITY_RE, (m, body: string) => {
      if (body[0] === '#') {
        const code = body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
        if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return m;
        try { return String.fromCodePoint(code); } catch { return m; }
      }
      const found = NAMED[body.toLowerCase()];
      return found ?? m;
    });
  },
};
