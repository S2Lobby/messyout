import type { Decoder } from './types';

// data:[<mediatype>][;param=val]*[;base64],<data>  — mediatype/params optional.
const DATA_URI_BASE64 = /^data:[^,]*;base64,(.+)$/s;
const DATA_URI_PLAIN = /^data:[^,]*,(.+)$/s;

export const dataUriDecoder: Decoder = {
  name: 'Data URI',
  detect(input) {
    const t = input.trim();
    if (DATA_URI_BASE64.test(t)) return 0.99;
    if (DATA_URI_PLAIN.test(t)) return 0.9;
    return 0;
  },
  decode(input) {
    const t = input.trim();
    const b64 = t.match(DATA_URI_BASE64);
    if (b64) {
      try { return atob(b64[1].replace(/\s/g, '')); } catch { return input; }
    }
    const plain = t.match(DATA_URI_PLAIN);
    if (plain) {
      // Non-base64 data URIs are percent-encoded.
      try { return decodeURIComponent(plain[1]); } catch { return plain[1]; }
    }
    return input;
  },
};
