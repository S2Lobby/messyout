import type { Detector, DetectResult } from './types';

const SIGNALS = [
  /<VirtualHost/,
  /\bDocumentRoot\b/,
  /\bServerName\b/,
  /\bAllowOverride\b/,
  /\bRewriteRule\b/,
  /\bProxyPass\b/,
  /\bSSLCertificateFile\b/,
  /\bOptions\s+(Indexes|FollowSymLinks|ExecCGI)/,
];

export const apacheDetector: Detector = {
  detect(input): DetectResult | null {
    const hits = SIGNALS.filter(r => r.test(input)).length;
    if (hits < 2) return null;
    return {
      language: 'apacheconf',
      displayName: 'Apache config',
      confidence: Math.min(0.99, 0.5 + hits * 0.1),
      explain: [
        { pattern: /DocumentRoot\s+(\S+)/, label: 'DocumentRoot', description: 'Root directory for web files served by this virtual host' },
        { pattern: /ServerName\s+(\S+)/, label: 'ServerName', description: 'Hostname this virtual host responds to' },
        { pattern: /AllowOverride\s+(\S+)/, label: 'AllowOverride', description: 'Controls which .htaccess directives are allowed' },
        { pattern: /RewriteRule/, label: 'RewriteRule', description: 'URL rewriting rule (mod_rewrite)' },
      ],
    };
  },
};
