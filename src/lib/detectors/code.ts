import type { Detector, DetectResult } from './types';

// PHP
const phpDetector: Detector = {
  detect(input): DetectResult | null {
    const signals = [/^<\?php/m, /<\?=/, /\$[a-zA-Z_]\w*\s*=/, /echo\s+/, /function\s+\w+\s*\(/, /\barray\s*\(/, /->/, /::/].filter(r => r.test(input)).length;
    if (signals < 2) return null;
    return { language: 'php', displayName: 'PHP', confidence: Math.min(0.98, 0.5 + signals * 0.1) };
  },
};

// JavaScript / Node
const jsDetector: Detector = {
  detect(input): DetectResult | null {
    const signals = [
      /\bconst\s+\w+\s*=/, /\blet\s+\w+\s*=/, /\bfunction\s+\w+\s*\(/,
      /=>\s*\{/, /\brequire\s*\(/, /\bimport\s+.+from/, /\bconsole\.log\(/,
      /\bmodule\.exports/, /\basync\s+function/, /\bawait\s+/,
    ].filter(r => r.test(input)).length;
    if (signals < 2) return null;
    return { language: 'javascript', displayName: 'JavaScript', confidence: Math.min(0.97, 0.45 + signals * 0.1) };
  },
};

// Python — require two STRONG signals (the old `:$` / 4-space-indent heuristics
// collided with YAML, nginx and indented logs).
const pythonDetector: Detector = {
  detect(input): DetectResult | null {
    const signals = [
      /^def\s+\w+\s*\(/m, /^from\s+\w+\s+import/m, /^import\s+\w+/m,
      /^class\s+\w+/m, /\bself\b/, /\b__\w+__\b/, /\bprint\s*\(/,
      /\bif\s+__name__\s*==/,
    ].filter(r => r.test(input)).length;
    if (signals < 2) return null;
    return { language: 'python', displayName: 'Python', confidence: Math.min(0.97, 0.45 + signals * 0.12) };
  },
};

// SQL
const sqlDetector: Detector = {
  detect(input): DetectResult | null {
    const signals = [
      /\bSELECT\b/i, /\bFROM\b/i, /\bWHERE\b/i, /\bINSERT\s+INTO\b/i,
      /\bCREATE\s+TABLE\b/i, /\bDROP\s+TABLE\b/i, /\bUPDATE\s+\w+\s+SET\b/i,
      /\bJOIN\b/i, /\bGROUP\s+BY\b/i,
    ].filter(r => r.test(input)).length;
    if (signals < 2) return null;
    return { language: 'sql', displayName: 'SQL', confidence: Math.min(0.97, 0.5 + signals * 0.08) };
  },
};

// Bash/Shell
const bashDetector: Detector = {
  detect(input): DetectResult | null {
    const signals = [
      /^#!.*\b(sh|bash|zsh)\b/m, /\bexport\s+\w+=/, /\bif\s+\[\[?/, /\bfi\b/,
      /\bfor\s+\w+\s+in\b/, /\|\s*(grep|awk|sed|cut|sort|uniq|xargs)\b/,
      /\bsudo\s+/, /\$\([^)]+\)/, /2>&1|>\/dev\/null|&&|\|\|/, /<<\s*['"]?\w+/,
      /\bcase\s+.*\bin\b/, /\bdone\b/,
    ].filter(r => r.test(input)).length;
    if (signals < 2) return null;
    return { language: 'bash', displayName: 'Shell script', confidence: Math.min(0.95, 0.4 + signals * 0.1) };
  },
};

// Java
const javaDetector: Detector = {
  detect(input): DetectResult | null {
    const signals = [
      /\bpublic\s+class\b/, /\bprivate\s+\w+\s+\w+/, /\bSystem\.out\./,
      /\bimport\s+java\./, /\bvoid\s+\w+\s*\(/, /\bnew\s+\w+\s*\(/,
    ].filter(r => r.test(input)).length;
    if (signals < 2) return null;
    return { language: 'java', displayName: 'Java', confidence: Math.min(0.95, 0.4 + signals * 0.12) };
  },
};

// Ruby
const rubyDetector: Detector = {
  detect(input): DetectResult | null {
    const signals = [
      /\bdef\s+\w+/, /\bend\b/, /\bputs\s+/, /\bdo\s+\|/, /\brequire\s+['"]/, /\.each\s+do/,
    ].filter(r => r.test(input)).length;
    if (signals < 2) return null;
    return { language: 'ruby', displayName: 'Ruby', confidence: Math.min(0.9, 0.4 + signals * 0.12) };
  },
};

export const codeDetectors: Detector[] = [phpDetector, jsDetector, pythonDetector, sqlDetector, bashDetector, javaDetector, rubyDetector];
