import { passwdDetector } from './passwd';
import { nginxDetector } from './nginx';
import { apacheDetector } from './apache';
import { hashDetector } from './hash';
import { hexdumpDetector } from './hexdump';
import { secretsdumpDetector } from './secretsdump';
import { traceDetectors } from './traces';
import { codeDetectors } from './code';
import { dataDetectors } from './data';
import type { Detector, DetectResult } from './types';

const allDetectors: Detector[] = [
  passwdDetector,
  nginxDetector,
  apacheDetector,
  secretsdumpDetector,
  hashDetector,
  hexdumpDetector,
  ...traceDetectors,
  ...dataDetectors,
  ...codeDetectors,
];

export function detectFormat(input: string): DetectResult {
  let best: DetectResult = { language: 'plaintext', displayName: 'Plain text', confidence: 0 };
  for (const detector of allDetectors) {
    const result = detector.detect(input);
    if (result && result.confidence > best.confidence) {
      best = result;
    }
  }
  return best;
}

export type { DetectResult };
