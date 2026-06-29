export interface Secret {
  type: string;
  value: string;
  severity: 'high' | 'medium' | 'info';
  note?: string;
}

interface Rule {
  type: string;
  re: RegExp;
  severity: Secret['severity'];
  note?: string;
}

const RULES: Rule[] = [
  { type: 'AWS Access Key', re: /\bAKIA[0-9A-Z]{16}\b/g, severity: 'high' },
  { type: 'AWS Temp Key (STS)', re: /\bASIA[0-9A-Z]{16}\b/g, severity: 'high' },
  { type: 'AWS Secret Key', re: /\baws_secret_access_key\s*[=:]\s*["']?([A-Za-z0-9/+]{40})["']?/gi, severity: 'high' },
  { type: 'GitHub Token', re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, severity: 'high' },
  { type: 'GitHub Fine-grained PAT', re: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g, severity: 'high' },
  { type: 'Slack Token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, severity: 'high' },
  { type: 'Google API Key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, severity: 'high' },
  { type: 'Stripe Secret Key', re: /\bsk_(live|test)_[0-9A-Za-z]{16,}\b/g, severity: 'high' },
  { type: 'OpenAI API Key', re: /\bsk-[A-Za-z0-9]{20}T3BlbkFJ[A-Za-z0-9]{20}\b/g, severity: 'high' },
  { type: 'Private Key', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g, severity: 'high' },
  { type: 'Slack Webhook', re: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+/g, severity: 'medium' },
  { type: 'JWT', re: /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]*\b/g, severity: 'medium' },
  { type: 'Bearer Token', re: /\bBearer\s+([A-Za-z0-9._~+/-]{12,}=*)/g, severity: 'medium' },
  { type: 'Generic API key/secret', re: /\b(?:api[_-]?key|secret|passwd|password|token)\s*[=:]\s*["']?([^\s"']{8,})["']?/gi, severity: 'medium' },
  { type: 'Cloud metadata IP', re: /\b169\.254\.169\.254\b/g, severity: 'medium', note: 'SSRF target — cloud instance metadata' },
];

function truncate(s: string, n = 60): string {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

// Obvious non-secrets that the broad "Generic" rule would otherwise flag.
const PLACEHOLDER = /^(?:changeme|change_me|password|passwd|secret|redacted|example|sample|placeholder|null|none|empty|test|xxx+|\*+|<.*>|\$\{.*\}|\.\.\.)$/i;

export function scanSecrets(text: string): Secret[] {
  const found: Secret[] = [];
  const seen = new Set<string>();

  // High-severity rules are listed first, so the 50-result cap never lets a
  // flood of low-severity "Generic" matches crowd out an AWS/GitHub key.
  for (const rule of RULES) {
    rule.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.re.exec(text)) !== null) {
      const value = m[0];
      const captured = m[1];
      // For the generic rule, skip obvious placeholders (captured group 1).
      if (rule.severity !== 'high' && captured && PLACEHOLDER.test(captured)) continue;
      // A "Bearer eyJ..." is a JWT — already reported by the JWT rule above.
      if (rule.type === 'Bearer Token' && captured && captured.startsWith('eyJ')) continue;
      const key = rule.type + '|' + value;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ type: rule.type, value: truncate(value), severity: rule.severity, note: rule.note });
      if (found.length >= 50) return found;
    }
  }

  // Decode HTTP Basic auth credentials inline.
  const basic = /\bBasic\s+([A-Za-z0-9+/]{8,}={0,2})/g;
  let bm: RegExpExecArray | null;
  while ((bm = basic.exec(text)) !== null) {
    try {
      const decoded = atob(bm[1]);
      if (!/^[\x20-\x7e]+:/.test(decoded)) continue;
      const key = 'HTTP Basic auth|' + decoded;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ type: 'HTTP Basic auth', value: truncate(decoded), severity: 'high', note: 'base64 user:pass' });
      if (found.length >= 50) break;
    } catch { /* not valid base64 */ }
  }

  return found;
}
