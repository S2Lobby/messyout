import { AlertTriangle, KeyRound, Info } from 'lucide-react';
import type { Secret } from '../lib/secrets';

const SEV: Record<Secret['severity'], { color: string; Icon: typeof AlertTriangle }> = {
  high: { color: 'text-[#f85149]', Icon: AlertTriangle },
  medium: { color: 'text-[#d29922]', Icon: KeyRound },
  info: { color: 'text-[#8b949e]', Icon: Info },
};

export function SecretsPanel({ secrets }: { secrets: Secret[] }) {
  if (secrets.length === 0) return null;

  return (
    <div className="divide-y divide-[#21262d]">
      {secrets.map((s, i) => {
        const { color, Icon } = SEV[s.severity];
        return (
          <div key={i} className="px-3 py-2 flex items-start gap-2 text-xs">
            <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${color}`} />
            <div className="min-w-0 flex-1">
              <span className={`font-medium ${color}`}>{s.type}</span>
              {s.note && <span className="text-[#6e7681] ml-2">{s.note}</span>}
              <div className="font-code text-[11px] text-[#8b949e] break-all mt-0.5">{s.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
