import type { Detector, DetectResult } from './types';

// impacket secretsdump / pwdump / NTDS / SAM output — the bread and butter of
// AD-focused work (CWES). hashes.ts handles a single line; this classifies the
// whole dump, counts accounts, and flags the crack-ready tells.
const PWDUMP = /^[^:\s]+:\d+:[0-9a-fA-F]{32}:[0-9a-fA-F]{32}:::/m;
const KRB = /^[^:\s]+:aes(?:128|256)-cts-hmac-sha1-96:[0-9a-f]+/m;
const CLEAR = /^[^:\s]+:(?:CLEARTEXT|plain_password_hex):/mi;
const EMPTY_LM = 'aad3b435b51404eeaad3b435b51404ee';

export const secretsdumpDetector: Detector = {
  detect(input): DetectResult | null {
    const rows = (input.match(/^[^:\s]+:\d+:[0-9a-fA-F]{32}:[0-9a-fA-F]{32}:::/gm) || []).length;
    if (rows < 1 && !KRB.test(input) && !CLEAR.test(input)) return null;
    const conf = rows >= 2 ? 0.97 : (PWDUMP.test(input) ? 0.9 : 0.85);
    return {
      language: 'plaintext',
      displayName: rows ? `secretsdump / NTLM dump (${rows} accounts)` : 'secretsdump (Kerberos/cleartext)',
      confidence: conf,
      explain: [
        { pattern: PWDUMP, label: 'user:rid:LM:NT:::', description: 'pwdump format — pass the NT hash (4th field): crackmapexec / impacket -hashes :NT' },
        { pattern: new RegExp(EMPTY_LM), label: 'empty LM', description: 'aad3b4…404ee = no LM hash stored (normal on modern Windows)' },
        { pattern: KRB, label: 'aes256-cts', description: 'Kerberos key — usable for Pass-the-Key / Silver tickets' },
        { pattern: CLEAR, label: 'CLEARTEXT', description: 'Reversible-encryption / WDigest cleartext password recovered' },
        { pattern: /\$krb5tgs\$/, label: '$krb5tgs$', description: 'Kerberoastable TGS hash — hashcat -m 13100' },
        { pattern: /\$krb5asrep\$/, label: '$krb5asrep$', description: 'AS-REP roast hash — hashcat -m 18200' },
      ],
    };
  },
};
