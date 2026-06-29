import { WrapText, PanelTopClose, PanelTopOpen } from 'lucide-react';

interface Props {
  wrap: boolean;
  onToggleWrap: () => void;
  hasInspector: boolean;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
}

export function OutputHeader({ wrap, onToggleWrap, hasInspector, inspectorOpen, onToggleInspector }: Props) {
  const btn = (active: boolean) =>
    `inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-md border transition-colors ${
      active
        ? 'border-[#58a6ff]/50 text-[#58a6ff] bg-[#388bfd1a]'
        : 'border-transparent text-[#8b949e] hover:text-[#e6edf3] hover:border-[#30363d]'
    }`;

  return (
    <div className="flex items-center justify-between px-3 h-9 shrink-0 border-b border-[#30363d] bg-[#161b22]">
      <span className="text-[11px] font-medium text-[#8b949e] uppercase tracking-wider">Output</span>
      <div className="flex items-center gap-1.5">
        <button className={btn(wrap)} onClick={onToggleWrap} title="Toggle word wrap">
          <WrapText className="w-3.5 h-3.5" />
          Wrap
        </button>
        {hasInspector && (
          <button className={btn(false)} onClick={onToggleInspector} title="Toggle inspector">
            {inspectorOpen ? <PanelTopClose className="w-3.5 h-3.5" /> : <PanelTopOpen className="w-3.5 h-3.5" />}
            Inspector
          </button>
        )}
      </div>
    </div>
  );
}
