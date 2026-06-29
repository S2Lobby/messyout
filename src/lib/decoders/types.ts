export interface Decoder {
  name: string;
  detect(input: string): number; // 0-1 confidence
  decode(input: string): string;
}
