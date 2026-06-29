import type { Decoder } from './types';

// PowerShell `powershell -enc <blob>` is base64 of UTF-16LE. The plain base64
// decoder turns it into "i.e.x. ." (a null between every char) and gives up, so
// the actual attacker command stays hidden — the #1 "I can't read this" artifact
// for SOC/DFIR. This decodes the UTF-16LE properly.
function tryUtf16le(b64: string): string | null {
  let bin: string;
  try { bin = atob(b64); } catch { return null; }
  if (bin.length < 4 || bin.length % 2 !== 0) return null;
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  // UTF-16LE tell: roughly every other byte is 0x00 for ASCII-heavy PowerShell.
  let zeros = 0;
  for (let i = 1; i < bytes.length; i += 2) if (bytes[i] === 0) zeros++;
  if (zeros / (bytes.length / 2) < 0.6) return null;
  try {
    const s = new TextDecoder('utf-16le', { fatal: false }).decode(bytes);
    return /[\x20-\x7e]/.test(s) ? s : null;
  } catch { return null; }
}

function extractBlob(t: string): string | null {
  const m = t.match(/(?:-e(?:nc(?:odedcommand)?)?\s+)?([A-Za-z0-9+/]{16,}={0,2})/i);
  if (m) return m[1];
  if (/^[A-Za-z0-9+/=\s]+$/.test(t)) return t.replace(/\s/g, '');
  return null;
}

export const powershellEncDecoder: Decoder = {
  name: 'PowerShell -enc',
  detect(input) {
    const blob = extractBlob(input.trim());
    return blob && tryUtf16le(blob) ? 0.96 : 0;
  },
  decode(input) {
    const blob = extractBlob(input.trim());
    return blob ? (tryUtf16le(blob) ?? input) : input;
  },
};
