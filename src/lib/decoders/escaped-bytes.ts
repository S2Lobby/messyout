import type { Decoder } from './types';

const HEX_ESC = /\\x([0-9A-Fa-f]{2})/g;
const OCT_ESC = /\\([0-7]{1,3})/g;

export const escapedBytesDecoder: Decoder = {
  name: 'Escaped bytes',
  detect(input) {
    const hex = (input.match(HEX_ESC) || []).length;
    const oct = (input.match(OCT_ESC) || []).length;
    // Require several to avoid firing on a stray "\x" or octal-looking text.
    if (hex >= 3) return Math.min(0.9, 0.55 + hex * 0.03);
    if (oct >= 4) return Math.min(0.8, 0.45 + oct * 0.03);
    return 0;
  },
  decode(input) {
    let out = input.replace(HEX_ESC, (_m, h) => String.fromCharCode(parseInt(h, 16)));
    // C octal escapes only cover \0–\377. Leave out-of-range sequences as-is
    // instead of silently wrapping mod 65536 into a wrong character.
    out = out.replace(OCT_ESC, (m, o) => {
      const v = parseInt(o, 8);
      return v <= 0xff ? String.fromCharCode(v) : m;
    });
    return out;
  },
};
