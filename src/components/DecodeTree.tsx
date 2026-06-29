import { ChevronRight, CheckCircle2 } from 'lucide-react';
import type { Layer } from '../types';

interface Props {
  layers: Layer[];
  selected: number | null;
  onSelect: (idx: number | null) => void;
}

export function DecodeTree({ layers, selected, onSelect }: Props) {
  if (layers.length === 0) return null;

  const rowBase = "w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors";
  const rowSel = "bg-[#388bfd1a] text-[#58a6ff] border-l-2 border-[#58a6ff]";
  const rowIdle = "border-l-2 border-transparent hover:bg-[#1c2128] text-[#e6edf3]";

  return (
    <div className="divide-y divide-[#21262d]">
      {layers.map((layer, i) => (
        <button
          key={i}
          onClick={() => onSelect(selected === i ? null : i)}
          className={`${rowBase} ${selected === i ? rowSel : rowIdle}`}
        >
          <span className="text-[#6e7681] w-4 shrink-0 tabular-nums text-right">{i + 1}</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#3fb950] shrink-0" />
          <span className="font-medium">{layer.decoderName}</span>
          <span className="text-[#8b949e] ml-auto shrink-0 tabular-nums font-code text-[11px]">
            {layer.input.length} → {layer.output.length}
          </span>
        </button>
      ))}
      <button
        onClick={() => onSelect(null)}
        className={`${rowBase} ${selected === null ? rowSel : rowIdle}`}
      >
        <CheckCircle2 className="w-4 h-4 text-[#3fb950] shrink-0" />
        <span className="font-medium">Result</span>
      </button>
    </div>
  );
}
