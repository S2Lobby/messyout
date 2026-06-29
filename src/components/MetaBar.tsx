import { ArrowRight, FileCode2, Activity, ChevronsUpDown } from 'lucide-react';
import type { DecodeResult } from '../types';

const LANGUAGES = [
  'plaintext', 'json', 'xml', 'html', 'php', 'javascript', 'python',
  'sql', 'bash', 'java', 'ruby', 'yaml', 'ini', 'nginx', 'apacheconf',
  'dockerfile', 'http',
];

const ENTROPY_COLORS: Record<string, string> = {
  'Low': 'bg-[#3fb950]',
  'Medium': 'bg-[#d29922]',
  'High': 'bg-[#f85149]',
  'Very High': 'bg-[#bc8cff]',
};

interface Props {
  result: DecodeResult;
  languageOverride: string | null;
  onOverride: (lang: string | null) => void;
}

export function MetaBar({ result, languageOverride, onOverride }: Props) {
  const { format, entropy, entropyLabel, encodingsFound } = result;
  const displayLang = languageOverride ?? format.displayName;
  const conf = Math.round(format.confidence * 100);
  const entropyPct = Math.min(100, (entropy / 8) * 100);

  return (
    <div className="px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* Format selector */}
      <div className="flex items-center gap-1.5">
        <FileCode2 className="w-3.5 h-3.5 text-[#8b949e]" />
        <div className="relative flex items-center">
          <select
            value={languageOverride ?? ''}
            onChange={e => onOverride(e.target.value || null)}
            aria-label="Output format"
            className="appearance-none text-xs bg-[#0d1117] border border-[#30363d] text-[#e6edf3] rounded-md pl-2 pr-7 py-1 outline-none hover:border-[#484f58] transition-colors cursor-pointer"
          >
            <option value="">
              {languageOverride ? `Auto-detect (${format.displayName} · ${conf}%)` : `${displayLang} · ${conf}%`}
            </option>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <ChevronsUpDown className="w-3 h-3 text-[#6e7681] absolute right-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Encoding chain */}
      {encodingsFound.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {encodingsFound.map((enc, i) => (
            <span key={enc} className="flex items-center gap-1.5">
              <span className="font-code text-[11px] bg-[#388bfd1a] text-[#58a6ff] px-2 py-0.5 rounded-full border border-[#1f4072]">{enc}</span>
              {i < encodingsFound.length - 1 && <ArrowRight className="w-3 h-3 text-[#6e7681]" />}
            </span>
          ))}
        </div>
      )}

      {/* Entropy — drops to its own full line on narrow widths instead of floating */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto sm:ml-auto">
        <Activity className="w-3.5 h-3.5 text-[#8b949e]" />
        <div className="w-24 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${ENTROPY_COLORS[entropyLabel]}`}
            style={{ width: `${entropyPct}%` }}
          />
        </div>
        <span className="text-[11px] text-[#8b949e] tabular-nums">{entropy.toFixed(1)} · {entropyLabel}</span>
      </div>
    </div>
  );
}
