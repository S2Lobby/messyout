import type { Decoder } from './types';

const COMMON = [
  ' the ', ' and ', ' for ', ' that ', ' with ', ' this ', ' you ', ' are ',
  ' was ', ' from ', ' have ', ' not ', ' but ', ' all ', ' can ', ' her ',
  'http', 'flag', 'user', 'pass', 'root', 'admin', 'login', 'true', 'false',
];

function rot13(s: string): string {
  return s.replace(/[a-zA-Z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function englishScore(s: string): number {
  const lower = ' ' + s.toLowerCase() + ' ';
  return COMMON.reduce((n, w) => n + (lower.split(w).length - 1), 0);
}

export const rot13Decoder: Decoder = {
  name: 'ROT13',
  detect(input) {
    const t = input.trim();
    // Only consider mostly-alphabetic text of reasonable length.
    const letters = (t.match(/[a-zA-Z]/g) || []).length;
    if (t.length < 8 || letters / t.length < 0.5) return 0;
    const before = englishScore(t);
    const after = englishScore(rot13(t));
    // Fire only when ROT13 clearly reveals English the original lacked.
    if (after >= 2 && after > before + 1) return 0.75;
    return 0;
  },
  decode(input) {
    return rot13(input);
  },
};
