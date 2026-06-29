import type { Detector, DetectResult } from './types';

// JSON (+ JSONL / NDJSON)
const jsonDetector: Detector = {
  detect(input): DetectResult | null {
    const t = input.trim();
    if ((t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))) {
      try { JSON.parse(t); return { language: 'json', displayName: 'JSON', confidence: 0.99 }; }
      catch { /* fall through to JSONL */ }
    }
    // JSON Lines / NDJSON: ≥2 lines that each parse as a JSON object (logs, jq -c).
    const lines = t.split(/\r?\n/).filter(Boolean);
    if (lines.length >= 2) {
      const ok = lines.filter(l => {
        const s = l.trim();
        if (!s.startsWith('{')) return false;
        try { JSON.parse(s); return true; } catch { return false; }
      }).length;
      if (ok >= 2 && ok / lines.length > 0.7) {
        return { language: 'json', displayName: 'JSON Lines (NDJSON)', confidence: 0.95 };
      }
    }
    return null;
  },
};

// XML / HTML
const xmlDetector: Detector = {
  detect(input): DetectResult | null {
    const t = input.trim();
    const hasDecl = t.startsWith('<?xml');
    const hasHtmlTag = /<html[\s>]/i.test(t);
    const hasXmlTags = (t.match(/<[a-zA-Z][^>]*>/g) || []).length >= 2;
    if (!hasXmlTags) return null;
    if (hasHtmlTag) return { language: 'html', displayName: 'HTML', confidence: 0.97 };
    if (hasDecl) return { language: 'xml', displayName: 'XML', confidence: 0.98 };
    return { language: 'xml', displayName: 'XML', confidence: 0.8 };
  },
};

// YAML
const yamlDetector: Detector = {
  detect(input): DetectResult | null {
    const signals = [
      /^---$/m, /^\w[\w\s]*:\s+\S/m, /^\s+- \w/m, /^#.+$/m,
      /:\s+\|$/m, /:\s+>$/m,
    ].filter(r => r.test(input)).length;
    if (signals < 2) return null;
    // Make sure it's not something that looks like YAML but is actually another format
    if (/^</.test(input.trim()) || /\{/.test(input.slice(0, 20))) return null;
    return { language: 'yaml', displayName: 'YAML', confidence: Math.min(0.9, 0.5 + signals * 0.1) };
  },
};

// INI / config
const iniDetector: Detector = {
  detect(input): DetectResult | null {
    const signals = [
      /^\[[\w\s]+\]$/m,
      /^\w+\s*=\s*.+$/m,
      /^;\s*.+$/m,
    ].filter(r => r.test(input)).length;
    if (signals < 2) return null;
    return { language: 'ini', displayName: 'INI config', confidence: Math.min(0.85, 0.4 + signals * 0.15) };
  },
};

// SSH / PEM
const pemDetector: Detector = {
  detect(input): DetectResult | null {
    if (/-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/.test(input)) {
      return { language: 'plaintext', displayName: 'Private Key (PEM)', confidence: 0.99 };
    }
    if (/-----BEGIN\s+CERTIFICATE-----/.test(input)) {
      return { language: 'plaintext', displayName: 'X.509 Certificate', confidence: 0.99 };
    }
    if (/-----BEGIN\s+PUBLIC\s+KEY-----/.test(input)) {
      return { language: 'plaintext', displayName: 'Public Key (PEM)', confidence: 0.99 };
    }
    if (/ssh-(rsa|ed25519|ecdsa)\s+AAAA/.test(input)) {
      return { language: 'plaintext', displayName: 'SSH Public Key', confidence: 0.99 };
    }
    return null;
  },
};

// HTTP Response
const httpResponseDetector: Detector = {
  detect(input): DetectResult | null {
    if (!/^HTTP\/[12][\.\d]*\s+\d{3}/.test(input.trim())) return null;
    return {
      language: 'http',
      displayName: 'HTTP Response',
      confidence: 0.99,
      special: 'http',
      explain: [
        { pattern: /Content-Type/, label: 'Content-Type', description: 'MIME type of the response body' },
        { pattern: /Set-Cookie/, label: 'Set-Cookie', description: 'Instructs client to store a cookie' },
        { pattern: /Location/, label: 'Location', description: 'Redirect target URL' },
        { pattern: /X-Frame-Options/, label: 'X-Frame-Options', description: 'Prevents clickjacking by controlling iframe embedding' },
        { pattern: /Content-Security-Policy/, label: 'CSP', description: 'Controls which resources the browser is allowed to load' },
      ],
    };
  },
};

// HTTP Request
const httpRequestDetector: Detector = {
  detect(input): DetectResult | null {
    if (!/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE|CONNECT)\s+\S+\s+HTTP\/[12]/.test(input.trim())) return null;
    return {
      language: 'http',
      displayName: 'HTTP Request',
      confidence: 0.99,
      special: 'http',
      explain: [
        { pattern: /^Host:/im, label: 'Host', description: 'Target virtual host — key for vhost routing / SSRF' },
        { pattern: /Authorization:/i, label: 'Authorization', description: 'Auth credentials (Basic/Bearer) — decode in the Secrets panel' },
        { pattern: /Cookie:/i, label: 'Cookie', description: 'Session/state sent by the client' },
        { pattern: /Content-Type:/i, label: 'Content-Type', description: 'Body encoding of the request' },
      ],
    };
  },
};

// Set-Cookie header
const cookieDetector: Detector = {
  detect(input): DetectResult | null {
    if (!/Set-Cookie:/i.test(input) && !/^[\w\-]+=.+;\s*(Path|Domain|Expires|HttpOnly|Secure|SameSite)/i.test(input)) return null;
    return {
      language: 'plaintext',
      displayName: 'Cookie',
      confidence: 0.95,
      special: 'cookie',
      explain: [
        { pattern: /HttpOnly/, label: 'HttpOnly', description: 'Cookie not accessible via JavaScript (XSS protection)' },
        { pattern: /Secure/, label: 'Secure', description: 'Cookie only sent over HTTPS' },
        { pattern: /SameSite=Strict/, label: 'SameSite=Strict', description: 'Cookie not sent in cross-site requests (CSRF protection)' },
        { pattern: /SameSite=Lax/, label: 'SameSite=Lax', description: 'Cookie sent in top-level navigations only' },
        { pattern: /SameSite=None/, label: 'SameSite=None', description: 'Cookie sent in all contexts (requires Secure)' },
      ],
    };
  },
};

// URL — including SSRF-relevant schemes
const SSRF_SCHEMES = /^(file|gopher|dict|ldap|ftp|tftp|jar|netdoc):/i;
const urlDetector: Detector = {
  detect(input): DetectResult | null {
    const t = input.trim();
    if (/\s/.test(t)) return null;
    const isHttp = /^https?:\/\//.test(t);
    const isSsrf = SSRF_SCHEMES.test(t);
    if (!isHttp && !isSsrf) return null;
    if (isSsrf) {
      return {
        language: 'plaintext',
        displayName: 'URL (SSRF scheme)',
        confidence: 0.97,
        special: 'url',
        explain: [
          { pattern: /^file:/i, label: 'file://', description: 'Reads a local file — classic SSRF file disclosure' },
          { pattern: /^gopher:/i, label: 'gopher://', description: 'Arbitrary TCP payloads — SSRF to internal services (Redis, SMTP…)' },
          { pattern: /^dict:/i, label: 'dict://', description: 'DICT protocol — SSRF port probing / service interaction' },
          { pattern: /^ldap:/i, label: 'ldap://', description: 'LDAP — SSRF / JNDI injection vector' },
        ],
      };
    }
    try { new URL(t); return { language: 'plaintext', displayName: 'URL', confidence: 0.9, special: 'url' }; }
    catch { return null; }
  },
};

// Docker/K8s
const dockerDetector: Detector = {
  detect(input): DetectResult | null {
    const signals = [
      /^FROM\s+\S+/m, /^RUN\s+/m, /^ENTRYPOINT\s+/m, /^CMD\s+/m, /^EXPOSE\s+\d+/m, /^ENV\s+\w+/m,
    ].filter(r => r.test(input)).length;
    if (signals >= 2) return { language: 'dockerfile', displayName: 'Dockerfile', confidence: Math.min(0.97, 0.5 + signals * 0.1) };

    const k8s = [/^apiVersion:\s+/m, /^kind:\s+(Deployment|Service|Pod|ConfigMap)/m, /^\s+containers:/m].filter(r => r.test(input)).length;
    if (k8s >= 2) return { language: 'yaml', displayName: 'Kubernetes manifest', confidence: Math.min(0.95, 0.5 + k8s * 0.15) };
    return null;
  },
};

// Crontab
const crontabDetector: Detector = {
  detect(input): DetectResult | null {
    // Cron schedule field: a 1-2 digit value/list/range/step or '*'. Capping at
    // 2 digits (valid cron ranges are 0-59) means a plain numeric table like
    // `1234 5678 9012 3456 7890 cmd` (ps/netstat output) won't match.
    const F = String.raw`(?:\*(?:\/\d{1,2})?|\d{1,2}(?:[,\-\/]\d{1,2})*)`;
    const CRON_LINE = new RegExp(String.raw`^${F}\s+${F}\s+${F}\s+${F}\s+${F}\s+\S`, 'm');
    // System crontab (/etc/crontab, /etc/cron.d): 5 fields + a USER + command.
    const CRON6 = new RegExp(String.raw`^${F}\s+${F}\s+${F}\s+${F}\s+${F}\s+([a-z_][a-z0-9_-]*)\s+\S`, 'm');
    const MACRO = /^@(reboot|yearly|annually|monthly|weekly|daily|midnight|hourly)\s+\S/m;
    if (!MACRO.test(input) && !CRON_LINE.test(input)) return null;
    const isSystem = CRON6.test(input);
    return {
      language: 'plaintext',
      displayName: isSystem ? 'Crontab (system — has user field)' : 'Crontab',
      confidence: 0.95,
      explain: [
        { pattern: isSystem ? CRON6 : CRON_LINE, label: 'Cron format', description: isSystem
            ? 'min hour dom month dow USER command — commands run AS that user (root cron = privesc target)'
            : 'minute hour day-of-month month day-of-week command' },
        { pattern: /\*/, label: '*', description: 'Wildcard — every value' },
        { pattern: /\@reboot/, label: '@reboot', description: 'Run once at system startup — persistence mechanism' },
        { pattern: /\broot\b/, label: 'root', description: 'Command runs as root — a writable script here is privesc' },
      ],
    };
  },
};

// Cloud metadata / AWS IAM
const cloudDetector: Detector = {
  detect(input): DetectResult | null {
    if (/169\.254\.169\.254/.test(input)) return { language: 'plaintext', displayName: 'Cloud Metadata (SSRF)', confidence: 0.98 };
    if (/AKIA[0-9A-Z]{16}/.test(input)) return { language: 'plaintext', displayName: 'AWS Access Key', confidence: 0.99 };
    if (/"InstanceProfileArn":|"RoleArn":/.test(input)) return { language: 'json', displayName: 'AWS IAM metadata', confidence: 0.95 };
    return null;
  },
};

export const dataDetectors: Detector[] = [
  pemDetector,
  cloudDetector,
  httpResponseDetector,
  httpRequestDetector,
  cookieDetector,
  urlDetector,
  jsonDetector,
  xmlDetector,
  yamlDetector,
  iniDetector,
  dockerDetector,
  crontabDetector,
];
