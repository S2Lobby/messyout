export interface HashInfo {
  name: string;        // e.g. "MD5"
  candidates: string[]; // possible algorithms
  hashcat?: string;     // hashcat mode(s)
  john?: string;        // john format
}

// Prefixed (crypt) formats — unambiguous.
const PREFIXED: { re: RegExp; info: HashInfo }[] = [
  { re: /^\$1\$/,            info: { name: 'md5crypt', candidates: ['MD5 crypt'], hashcat: '500', john: 'md5crypt' } },
  { re: /^\$2[abxy]\$/,      info: { name: 'bcrypt', candidates: ['bcrypt (Blowfish)'], hashcat: '3200', john: 'bcrypt' } },
  { re: /^\$5\$/,            info: { name: 'sha256crypt', candidates: ['SHA-256 crypt'], hashcat: '7400', john: 'sha256crypt' } },
  { re: /^\$6\$/,            info: { name: 'sha512crypt', candidates: ['SHA-512 crypt'], hashcat: '1800', john: 'sha512crypt' } },
  { re: /^\$y\$/,            info: { name: 'yescrypt', candidates: ['yescrypt'], hashcat: '—', john: '—' } },
  { re: /^\$7\$/,            info: { name: 'scrypt', candidates: ['scrypt'], hashcat: '8900' } },
  { re: /^\$argon2(id|i|d)\$/, info: { name: 'argon2', candidates: ['Argon2'], hashcat: '—' } },
  { re: /^\$pbkdf2-sha(1|256|512)\$/, info: { name: 'PBKDF2', candidates: ['PBKDF2'], hashcat: '10900' } },
  { re: /^\$krb5/,           info: { name: 'Kerberos', candidates: ['Kerberos 5'], hashcat: '13100/18200' } },
  { re: /^\$NT\$/i,          info: { name: 'NTLM', candidates: ['NTLM'], hashcat: '1000' } },
];

// Bare hex by length (ambiguous — list candidates).
const HEX_BY_LEN: Record<number, HashInfo> = {
  32: { name: 'MD5 / NTLM', candidates: ['MD5', 'NTLM', 'MD4', 'LM (half)'], hashcat: '0 / 1000', john: 'raw-md5 / nt' },
  40: { name: 'SHA-1', candidates: ['SHA-1', 'MySQL4.1+ (with *)', 'RIPEMD-160'], hashcat: '100', john: 'raw-sha1' },
  56: { name: 'SHA-224', candidates: ['SHA-224', 'SHA3-224'], hashcat: '1300' },
  64: { name: 'SHA-256', candidates: ['SHA-256', 'SHA3-256', 'BLAKE2s'], hashcat: '1400', john: 'raw-sha256' },
  96: { name: 'SHA-384', candidates: ['SHA-384', 'SHA3-384'], hashcat: '10800' },
  128: { name: 'SHA-512', candidates: ['SHA-512', 'SHA3-512', 'Whirlpool'], hashcat: '1700', john: 'raw-sha512' },
};

export function identifyHash(input: string): HashInfo | null {
  const t = input.trim();
  if (/\s/.test(t)) return null; // single token only

  for (const { re, info } of PREFIXED) {
    if (re.test(t)) return info;
  }

  // Windows secretsdump line: user:rid:lmhash:nthash:::
  if (/^[^:]+:\d+:[0-9a-fA-F]{32}:[0-9a-fA-F]{32}:::/.test(t)) {
    return { name: 'NTLM (secretsdump)', candidates: ['LM:NT hash pair'], hashcat: '1000', john: 'nt' };
  }

  if (/^\*?[0-9a-fA-F]+$/.test(t)) {
    const hex = t.replace(/^\*/, '');
    const info = HEX_BY_LEN[hex.length];
    if (info) {
      // MySQL 4.1+ uses a leading '*' on a 40-char hex.
      if (t.startsWith('*') && hex.length === 40) {
        return { name: 'MySQL 4.1+', candidates: ['MySQL 4.1+ SHA1(SHA1())'], hashcat: '300' };
      }
      return info;
    }
  }

  return null;
}
