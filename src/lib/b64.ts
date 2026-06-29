// Decode base64 to a string, interpreting the bytes as UTF-8 when valid.
// Plain atob() returns a Latin-1 byte string, so base64 of UTF-8 text (JSON
// with accents, JWT payloads with unicode, …) comes out as mojibake ("Ã©").
export function b64ToUtf8(b64: string): string {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return bin; // not valid UTF-8 — keep the raw byte string
  }
}

// Same, for the base64url alphabet (JWT parts, URL-safe tokens).
export function b64urlToUtf8(part: string): string {
  const padded = part + '='.repeat((4 - part.length % 4) % 4);
  return b64ToUtf8(padded.replace(/-/g, '+').replace(/_/g, '/'));
}
