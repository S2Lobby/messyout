import type { Decoder } from './types';

const UNICODE_RE = /\\u[0-9a-fA-F]{4}/g;

export const unicodeDecoder: Decoder = {
  name: 'Unicode Escape',
  detect(input) {
    const matches = (input.match(UNICODE_RE) || []).length;
    if (matches === 0) return 0;
    return Math.min(0.95, 0.5 + matches * 0.1);
  },
  decode(input) {
    return input.replace(UNICODE_RE, (m) => String.fromCharCode(parseInt(m.slice(2), 16)));
  },
};
