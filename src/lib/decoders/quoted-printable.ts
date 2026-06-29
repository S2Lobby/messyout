import type { Decoder } from './types';

const QP_HEX = /=([0-9A-Fa-f]{2})/g;
const SOFT_BREAK = /=\r?\n/g;
// Decode a run of consecutive =XX as raw bytes, then interpret as UTF-8 so
// "=C3=A9" becomes "é" rather than byte-wise mojibake "Ã©".
const QP_RUN = /(?:=[0-9A-Fa-f]{2})+/g;

export const quotedPrintableDecoder: Decoder = {
  name: 'Quoted-Printable',
  detect(input) {
    // A soft line break (=\n) is the unambiguous QP signal. Without it, `=AB`
    // patterns are far more likely to be hexdumps, configs, or color values, so
    // we refuse — avoiding the data-corruption false positives those cause.
    SOFT_BREAK.lastIndex = 0;
    if (!SOFT_BREAK.test(input)) return 0;
    const hex = (input.match(QP_HEX) || []).length;
    return Math.min(0.85, 0.55 + hex * 0.04);
  },
  decode(input) {
    const noSoft = input.replace(SOFT_BREAK, '');
    return noSoft.replace(QP_RUN, (run) => {
      const bytes = Uint8Array.from(
        run.match(QP_HEX)!.map(h => parseInt(h.slice(1), 16))
      );
      try { return new TextDecoder('utf-8', { fatal: false }).decode(bytes); }
      catch { return run; }
    });
  },
};
