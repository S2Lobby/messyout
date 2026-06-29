import type { Secret } from './lib/secrets';
import type { EmbeddedToken } from './lib/embedded';

export interface Layer {
  decoderName: string;
  input: string;
  output: string;
}

export interface DecodeResult {
  layers: Layer[];
  finalOutput: string;
  encodingsFound: string[];
  format: import('./lib/detectors/types').DetectResult;
  entropy: number;
  entropyLabel: 'Low' | 'Medium' | 'High' | 'Very High';
  secrets: Secret[];
  embedded: EmbeddedToken[];
  truncated: boolean;
}
