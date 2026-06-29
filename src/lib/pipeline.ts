import { decoders } from './decoders/index';
import { gzipDecoder, decodeGzip } from './decoders/gzip';
import { detectFormat } from './detectors/index';
import { shannonEntropy, entropyLabel } from './entropy';
import { scanSecrets } from './secrets';
import { findEmbedded } from './embedded';
import type { DecodeResult, Layer } from '../types';

const MAX_LAYERS = 12;
const CONFIDENCE_THRESHOLD = 0.5;
const MAX_INPUT = 2_000_000; // guard against multi-MB pastes freezing the UI

export async function runPipeline(raw: string): Promise<DecodeResult> {
  const layers: Layer[] = [];
  const encodingsFound: string[] = [];
  let truncated = raw.length > MAX_INPUT;
  let current = truncated ? raw.slice(0, MAX_INPUT) : raw;

  // Cycle detection: never revisit a state we've already produced.
  const seen = new Set<string>([current]);

  for (let i = 0; i < MAX_LAYERS; i++) {
    let bestDecoder = null;
    let bestConf = 0;

    for (const decoder of decoders) {
      const conf = decoder.detect(current);
      if (conf > bestConf) {
        bestConf = conf;
        bestDecoder = decoder;
      }
    }

    if (!bestDecoder || bestConf < CONFIDENCE_THRESHOLD) break;

    let output: string;
    try {
      if (bestDecoder === gzipDecoder) {
        output = await decodeGzip(current);
      } else {
        output = bestDecoder.decode(current);
      }
    } catch {
      break;
    }

    // An output-expanding decoder (gzip/charcode/hex) can blow past the input
    // cap, so cap intermediate results too and flag the truncation.
    if (output.length > MAX_INPUT) {
      output = output.slice(0, MAX_INPUT);
      truncated = true;
    }

    // Stop on no-op or any previously-seen state (breaks A→B→A oscillation).
    if (output === current || seen.has(output)) break;

    layers.push({ decoderName: bestDecoder.name, input: current, output });
    if (!encodingsFound.includes(bestDecoder.name)) encodingsFound.push(bestDecoder.name);
    seen.add(output);
    current = output;
  }

  const format = detectFormat(current);
  const e = shannonEntropy(current);
  const secrets = scanSecrets(current);
  // Scan the final output for embedded tokens regardless of layer count — a
  // single URL-decode wrapping a log full of JWTs/base64 should still surface
  // them. findEmbedded won't re-report a whole token the pipeline already peeled
  // (the final output is the decoded content, not the original token).
  const embedded = findEmbedded(current);

  return {
    layers,
    finalOutput: current,
    encodingsFound,
    format,
    entropy: e,
    entropyLabel: entropyLabel(e),
    secrets,
    embedded,
    truncated,
  };
}
