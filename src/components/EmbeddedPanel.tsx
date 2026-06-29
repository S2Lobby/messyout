import { ArrowRight } from 'lucide-react';
import type { EmbeddedToken } from '../lib/embedded';

export function EmbeddedPanel({ tokens }: { tokens: EmbeddedToken[] }) {
  if (tokens.length === 0) return null;

  return (
    <div className="divide-y divide-[#21262d]">
      {tokens.map((t, i) => (
        <div key={i} className="px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-code text-[10px] px-1.5 py-0.5 rounded bg-[#388bfd1a] text-[#58a6ff] border border-[#1f4072] shrink-0">{t.type}</span>
            <span className="font-code text-[11px] text-[#6e7681] truncate">{t.raw}</span>
          </div>
          <div className="flex items-start gap-1.5 mt-1 text-[#8b949e]">
            <ArrowRight className="w-3 h-3 shrink-0 mt-0.5 text-[#3fb950]" />
            <span className="font-code text-[11px] break-all line-clamp-3">{t.decoded}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
