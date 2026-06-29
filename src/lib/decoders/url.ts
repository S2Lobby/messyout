import type { Decoder } from './types';

const PCT_RE = /%[0-9A-Fa-f]{2}/g;
// A run of consecutive %XX so multi-byte UTF-8 (e.g. %E2%9C%93) decodes together.
const PCT_RUN_RE = /(?:%[0-9A-Fa-f]{2})+/g;

export const urlDecoder: Decoder = {
  name: 'URL',
  detect(input) {
    const matches = (input.match(PCT_RE) || []).length;
    if (matches === 0) return 0;
    // Require a meaningful density so literal '%' in prose, SQL LIKE '%x%',
    // printf formats, "50% done" etc. don't trigger a bogus decode.
    const density = matches / Math.max(1, input.length / 3);
    if (matches < 2 && density < 0.5) return 0;
    return Math.min(0.92, 0.45 + density * 0.5);
  },
  decode(input) {
    // Decode ONLY matched %XX runs, so literal '%' survives and a malformed
    // sequence never discards the whole string. Runs decode together so
    // multi-byte UTF-8 percent-encoding is preserved.
    return input.replace(PCT_RUN_RE, (m) => {
      try { return decodeURIComponent(m); } catch { return m; }
    });
  },
};
