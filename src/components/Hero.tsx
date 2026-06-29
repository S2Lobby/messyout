import { ShieldCheck, ClipboardPaste, Wand2, FileCheck2 } from 'lucide-react';
import { SAMPLES } from '../lib/samples';

interface Props {
  onPickSample: (value: string) => void;
}

export function Hero({ onPickSample }: Props) {
  return (
    <div className="flex-1 grid place-items-center p-6 overflow-auto">
      <div className="w-full max-w-lg text-center flex flex-col items-center gap-5 mo-fade-in">
        <div>
          <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">
            Paste the mess. Get clean output.
          </h1>
          <p className="mt-2 text-sm text-[#8b949e] leading-relaxed">
            Auto-decodes base64, URL, JWT, gzip, hex & more —
            then prettifies, highlights, and identifies what it is.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs text-[#3fb950] bg-[#3fb950]/10 border border-[#3fb950]/20 rounded-full px-3 py-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Nothing leaves your browser
        </span>

        <div className="w-full">
          <div className="text-[11px] font-medium text-[#6e7681] uppercase tracking-wider mb-2">
            Try a sample
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SAMPLES.map(s => (
              <button
                key={s.label}
                onClick={() => onPickSample(s.value)}
                className="group text-left rounded-md border border-[#30363d] bg-[#0d1117] hover:border-[#58a6ff]/50 hover:bg-[#161b22] px-3 py-2 transition-colors"
              >
                <div className="text-xs font-medium text-[#e6edf3] group-hover:text-[#58a6ff]">{s.label}</div>
                <div className="text-[10px] text-[#6e7681]">{s.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#6e7681] pt-1">
          <span className="inline-flex items-center gap-1"><ClipboardPaste className="w-3 h-3" /> Paste</span>
          <span className="text-[#484f58]">→</span>
          <span className="inline-flex items-center gap-1"><Wand2 className="w-3 h-3" /> Decode</span>
          <span className="text-[#484f58]">→</span>
          <span className="inline-flex items-center gap-1"><FileCheck2 className="w-3 h-3" /> Read</span>
        </div>
      </div>
    </div>
  );
}
