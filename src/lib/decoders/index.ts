import { ansiDecoder } from './ansi';
import { base64Decoder } from './base64';
import { base64urlDecoder } from './base64url';
import { base32Decoder } from './base32';
import { urlDecoder } from './url';
import { htmlEntitiesDecoder } from './html-entities';
import { jsonEscapeDecoder } from './json-escape';
import { unicodeDecoder } from './unicode';
import { hexDecoder } from './hex';
import { escapedBytesDecoder } from './escaped-bytes';
import { quotedPrintableDecoder } from './quoted-printable';
import { charcodeDecoder } from './charcode';
import { gzipDecoder } from './gzip';
import { dataUriDecoder } from './data-uri';
import { jwtDecoder } from './jwt';
import { rot13Decoder } from './rot13';
import type { Decoder } from './types';

// Order matters: cleanup + most specific decoders first.
export const decoders: Decoder[] = [
  ansiDecoder,        // strip terminal color codes before anything else
  jwtDecoder,
  dataUriDecoder,
  gzipDecoder,
  charcodeDecoder,
  htmlEntitiesDecoder,
  quotedPrintableDecoder,
  escapedBytesDecoder,
  urlDecoder,
  jsonEscapeDecoder,
  unicodeDecoder,
  base64urlDecoder,
  base64Decoder,
  base32Decoder,
  hexDecoder,
  rot13Decoder,       // conservative; only fires when it reveals English
];

export type { Decoder };
