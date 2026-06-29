import type { Decoder } from './types';

// Linux TCP connection states (hex → name), from include/net/tcp_states.h
const STATES: Record<string, string> = {
  '01': 'ESTABLISHED', '02': 'SYN_SENT', '03': 'SYN_RECV', '04': 'FIN_WAIT1',
  '05': 'FIN_WAIT2', '06': 'TIME_WAIT', '07': 'CLOSE', '08': 'CLOSE_WAIT',
  '09': 'LAST_ACK', '0A': 'LISTEN', '0B': 'CLOSING', '0C': 'NEW_SYN_RECV',
};

// sl: local(8 or 32 hex):port rem(...):port st ...
const LINE = /^\s*\d+:\s+([0-9A-Fa-f]{8}(?:[0-9A-Fa-f]{24})?):([0-9A-Fa-f]{4})\s+([0-9A-Fa-f]{8}(?:[0-9A-Fa-f]{24})?):([0-9A-Fa-f]{4})\s+([0-9A-Fa-f]{2})/;

function ipv4(hex: string): string {
  // Stored little-endian: reverse the 4 bytes.
  return hex.match(/../g)!.map(h => parseInt(h, 16)).reverse().join('.');
}

function ipv6(hex: string): string {
  // Four little-endian 32-bit words → 16 bytes → 8 colon groups.
  const bytes: number[] = [];
  for (const w of hex.match(/.{8}/g)!) {
    bytes.push(...w.match(/../g)!.map(h => parseInt(h, 16)).reverse());
  }
  const g: number[] = [];
  for (let i = 0; i < 16; i += 2) g.push((bytes[i] << 8) | bytes[i + 1]);

  // IPv4-mapped (::ffff:a.b.c.d). The deprecated IPv4-compatible form (g[5]===0)
  // is intentionally NOT special-cased — it would turn ::1 into ::0.0.0.1.
  if (g.slice(0, 5).every(x => x === 0) && g[5] === 0xffff) {
    return `::ffff:${bytes[12]}.${bytes[13]}.${bytes[14]}.${bytes[15]}`;
  }

  // Collapse the longest run of zero groups to "::".
  const hexg = g.map(x => x.toString(16));
  let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
  for (let i = 0; i < 8; i++) {
    if (g[i] === 0) {
      if (curStart < 0) curStart = i;
      curLen++;
      if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
    } else { curStart = -1; curLen = 0; }
  }
  if (bestLen < 2) return hexg.join(':');
  return `${hexg.slice(0, bestStart).join(':')}::${hexg.slice(bestStart + bestLen).join(':')}`;
}

function addr(hex: string, port: string): string {
  const ip = hex.length === 8 ? ipv4(hex) : `[${ipv6(hex)}]`;
  return `${ip}:${parseInt(port, 16)}`;
}

export const procNetDecoder: Decoder = {
  name: '/proc/net',
  detect(input) {
    return input.split('\n').some(l => LINE.test(l)) ? 0.92 : 0;
  },
  decode(input) {
    const rows: string[] = [];
    for (const line of input.split('\n')) {
      const m = line.match(LINE);
      if (!m) continue;
      const [, lhex, lport, rhex, rport, st] = m;
      const state = STATES[st.toUpperCase()] ?? `0x${st}`;
      rows.push(`${state.padEnd(12)} ${addr(lhex, lport).padEnd(24)} -> ${addr(rhex, rport)}`);
    }
    if (rows.length === 0) return input;
    return `${'State'.padEnd(12)} ${'Local'.padEnd(24)} -> Remote\n${rows.join('\n')}`;
  },
};
