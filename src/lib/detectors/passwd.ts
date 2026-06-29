import type { Detector, DetectResult } from './types';

// username:x:uid:gid:comment:home:shell
const PASSWD_LINE = /^[a-z_][a-z0-9_-]*:[x*!]?:\d+:\d+:[^:]*:\/[^:]*:\/[^\s]*/m;
const SHADOW_LINE = /^[a-z_][a-z0-9_-]*:\$[0-9a-z]+\$[^\s:]+:\d+:\d+:/m;

export const passwdDetector: Detector = {
  detect(input): DetectResult | null {
    if (SHADOW_LINE.test(input)) {
      const lines = input.trim().split('\n').filter(l => SHADOW_LINE.test(l));
      if (lines.length < 1) return null;
      return {
        language: 'plaintext',
        displayName: '/etc/shadow',
        confidence: 0.97,
        special: 'shadow',
        explain: [
          { pattern: /.*/, label: 'Format', description: 'username : hashed_password : last_changed : min_days : max_days : warn_days : inactive : expire' },
          { pattern: /\$6\$/, label: '$6$', description: 'SHA-512 hash (most common on Linux)' },
          { pattern: /\$y\$/, label: '$y$', description: 'yescrypt hash (modern Debian/Fedora)' },
          { pattern: /\$1\$/, label: '$1$', description: 'MD5 hash (weak, legacy)' },
        ],
      };
    }
    if (PASSWD_LINE.test(input)) {
      return {
        language: 'plaintext',
        displayName: '/etc/passwd',
        confidence: 0.97,
        special: 'passwd',
        explain: [
          { pattern: /.*/, label: 'Format', description: 'username : password_placeholder : UID : GID : comment : home_dir : shell' },
          { pattern: /:[x]:/, label: 'x', description: 'Password stored in /etc/shadow (not here)' },
          { pattern: /\/bin\/bash/, label: '/bin/bash', description: 'Login shell — user can log in interactively' },
          { pattern: /\/usr\/sbin\/nologin|\/bin\/false/, label: 'nologin', description: 'Service account — cannot log in interactively' },
        ],
      };
    }
    return null;
  },
};
