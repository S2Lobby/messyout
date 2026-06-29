export interface ExplainEntry {
  pattern: RegExp | string;
  label: string;
  description: string;
}

export interface DetectResult {
  language: string;
  displayName: string;
  confidence: number;
  explain?: ExplainEntry[];
  special?: 'jwt' | 'http' | 'cookie' | 'url' | 'passwd' | 'shadow';
}

export interface Detector {
  detect(input: string): DetectResult | null;
}
