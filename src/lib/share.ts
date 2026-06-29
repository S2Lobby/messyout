import LZString from 'lz-string';

export function encodeShare(text: string): string {
  return LZString.compressToEncodedURIComponent(text);
}

export function decodeShare(encoded: string): string | null {
  return LZString.decompressFromEncodedURIComponent(encoded);
}

export function getShareUrl(input: string): string {
  const compressed = encodeShare(input);
  const url = new URL(window.location.href);
  url.hash = `d=${compressed}`;
  return url.toString();
}

export function loadFromHash(): string | null {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const d = params.get('d');
  if (!d) return null;
  return decodeShare(d);
}
