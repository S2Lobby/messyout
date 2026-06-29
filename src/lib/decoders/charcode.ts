import type { Decoder } from './types';

const FROMCHARCODE = /(?:String\.)?fromCharCode\s*\(([^)]*)\)/i;
const CHR_CALL = /\bchr\s*\(\s*(0x[0-9A-Fa-f]+|\d+)\s*\)/gi;
const BARE_ARRAY = /^\[\s*\d{1,3}(\s*,\s*\d{1,3})+\s*,?\s*\]$/;
const NUM_TOKEN = /^(0x[0-9A-Fa-f]+|\d+)$/;

// Strictly parse a comma/space-separated number list. Returns null if ANY token
// is malformed (e.g. an expression like 0x41+1) or out of byte range — better to
// refuse than emit plausible-but-wrong output.
function parseStrict(s: string): number[] | null {
  const tokens = s.split(/[,\s]+/).map(x => x.trim()).filter(Boolean);
  if (tokens.length === 0) return null;
  const nums: number[] = [];
  for (const tok of tokens) {
    if (!NUM_TOKEN.test(tok)) return null;
    const n = tok.startsWith('0x') || tok.startsWith('0X') ? parseInt(tok, 16) : parseInt(tok, 10);
    if (Number.isNaN(n) || n < 0 || n > 0x10ffff) return null;
    nums.push(n);
  }
  return nums;
}

function toChars(nums: number[]): string {
  return nums.map(n => String.fromCodePoint(n)).join('');
}

export const charcodeDecoder: Decoder = {
  name: 'Charcode array',
  detect(input) {
    const t = input.trim();
    const fcc = t.match(FROMCHARCODE);
    if (fcc) return parseStrict(fcc[1]) ? 0.9 : 0;

    const chrMatches = [...t.matchAll(CHR_CALL)];
    if (chrMatches.length >= 2) {
      // detect must agree with decode: bail if any value is out of range,
      // otherwise decode() would throw and the layer would be silently dropped.
      const ok = chrMatches.every(m => {
        const n = m[1].startsWith('0x') ? parseInt(m[1], 16) : parseInt(m[1], 10);
        return n >= 0 && n <= 0x10ffff;
      });
      return ok ? 0.85 : 0;
    }

    if (BARE_ARRAY.test(t)) {
      const nums = parseStrict(t.slice(1, -1));
      if (!nums) return 0;
      const printable = nums.filter(n => n >= 32 && n < 127).length;
      return printable / nums.length > 0.8 ? 0.7 : 0;
    }
    return 0;
  },
  decode(input) {
    const t = input.trim();
    const fcc = t.match(FROMCHARCODE);
    if (fcc) {
      const nums = parseStrict(fcc[1]);
      return nums ? toChars(nums) : input;
    }

    const chrMatches = [...t.matchAll(CHR_CALL)];
    if (chrMatches.length >= 2) {
      const nums = chrMatches.map(m => m[1].startsWith('0x') ? parseInt(m[1], 16) : parseInt(m[1], 10));
      if (nums.some(n => n < 0 || n > 0x10ffff)) return input;
      return toChars(nums);
    }

    if (BARE_ARRAY.test(t)) {
      const nums = parseStrict(t.slice(1, -1));
      return nums ? toChars(nums) : input;
    }
    return input;
  },
};
