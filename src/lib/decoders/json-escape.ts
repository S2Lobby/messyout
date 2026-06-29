import type { Decoder } from './types';

export const jsonEscapeDecoder: Decoder = {
  name: 'JSON String',
  detect(input) {
    const t = input.trim();
    // Must look like a JSON string value (quoted) or have JSON escape sequences
    const hasEscapes = /\\["\\/bfnrtu]/.test(t);
    if (!hasEscapes) return 0;
    const isString = (t.startsWith('"') && t.endsWith('"')) ||
                     (t.startsWith("'") && t.endsWith("'"));
    return isString ? 0.9 : 0.6;
  },
  decode(input) {
    const t = input.trim();
    // Wrap in quotes if not already quoted, then parse
    const toparse = (t.startsWith('"') && t.endsWith('"')) ? t : `"${t}"`;
    try { return JSON.parse(toparse); } catch { return input; }
  },
};
