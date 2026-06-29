import type { Detector, DetectResult } from './types';

const SIGNALS = [
  /\bserver\s*\{/,
  /\blocation\s+[^\{]+\{/,
  /\bproxy_pass\s+/,
  /\blisten\s+\d+/,
  /\broot\s+\//,
  /\bfastcgi_pass\s+/,
  /\bupstream\s+\w+\s*\{/,
  /\bworker_processes\b/,
  /\binclude\s+.*\.conf/,
];

export const nginxDetector: Detector = {
  detect(input): DetectResult | null {
    const hits = SIGNALS.filter(r => r.test(input)).length;
    if (hits < 2) return null;
    return {
      language: 'nginx',
      displayName: 'nginx config',
      confidence: Math.min(0.99, 0.5 + hits * 0.08),
      explain: [
        { pattern: /proxy_pass/, label: 'proxy_pass', description: 'Forwards requests to a backend server (reverse proxy target)' },
        { pattern: /listen\s+(\d+)/, label: 'listen', description: 'Port nginx listens on' },
        { pattern: /root\s+(\S+)/, label: 'root', description: 'Document root — where static files are served from' },
        { pattern: /fastcgi_pass/, label: 'fastcgi_pass', description: 'Passes requests to PHP-FPM or other FastCGI backend' },
      ],
    };
  },
};
