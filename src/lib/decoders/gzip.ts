import type { Decoder } from './types';

function isGzipBase64(s: string): boolean {
  // Gzip magic bytes: 1f 8b — in base64 starts with "H4sI"
  return s.trim().startsWith('H4sI');
}

export const gzipDecoder: Decoder = {
  name: 'Gzip (base64)',
  detect(input) {
    return isGzipBase64(input.trim()) ? 0.95 : 0;
  },
  decode(input) {
    // Real decompression is async — the pipeline detects gzipDecoder and
    // calls decodeGzip() instead. This sync stub is never used for output.
    return input;
  },
};

const MAX_GZIP_OUTPUT = 8_000_000; // guard against decompression bombs (65KB → 50MB)

export async function decodeGzip(input: string): Promise<string> {
  const b64 = input.trim().replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  // Chain + swallow writer-side rejections so malformed gzip can't surface an
  // unhandledrejection (the read side propagates the error to the caller).
  writer.write(bytes).then(() => writer.close()).catch(() => {});
  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
    if (total > MAX_GZIP_OUTPUT) {
      // Stop accumulating; cancel the stream to release the writer.
      await reader.cancel().catch(() => {});
      break;
    }
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(result);
}
