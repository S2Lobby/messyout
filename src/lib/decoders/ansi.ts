import type { Decoder } from './types';

// CSI sequences (colors, cursor moves) + OSC + other escape sequences.
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\)|[@-Z\\-_])/g;

export const ansiDecoder: Decoder = {
  name: 'ANSI strip',
  detect(input) {
    // Cheap test (no allocation) — runs first so color codes don't pollute
    // detection. ANSI_RE is /g, so reset lastIndex before each test().
    ANSI_RE.lastIndex = 0;
    return ANSI_RE.test(input) ? 0.97 : 0;
  },
  decode(input) {
    return input.replace(ANSI_RE, '');
  },
};
