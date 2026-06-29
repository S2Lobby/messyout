import type { Detector, DetectResult } from './types';
import { identifyHash } from '../hashes';

export const hashDetector: Detector = {
  detect(input): DetectResult | null {
    const info = identifyHash(input);
    if (!info) return null;
    const explain = [
      { pattern: /.*/, label: info.name, description: `Likely: ${info.candidates.join(', ')}` },
    ];
    if (info.hashcat) explain.push({ pattern: /.*/, label: 'hashcat -m', description: info.hashcat });
    if (info.john) explain.push({ pattern: /.*/, label: 'john --format', description: info.john });
    // Unambiguous formats ($-prefixed crypt, secretsdump, MySQL *) are confident;
    // a bare hex string could just be an ID/checksum, so let real structured
    // formats win when one is present.
    const unambiguous = /^[$*]/.test(input.trim()) || input.includes(':');
    return {
      language: 'plaintext',
      displayName: `${info.name} hash`,
      confidence: unambiguous ? 0.92 : 0.7,
      explain,
    };
  },
};
