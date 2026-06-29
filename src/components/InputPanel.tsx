import { useRef, useCallback } from 'react';
import { Eraser } from 'lucide-react';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function InputPanel({ value, onChange }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string ?? '');
    reader.readAsText(file);
  }, [onChange]);

  return (
    <div
      className="flex flex-col h-full min-h-0 transition-colors focus-within:bg-[#0d1117]"
      onDrop={onDrop}
      onDragOver={e => e.preventDefault()}
    >
      <div className="flex items-center justify-between px-3 h-9 shrink-0 border-b border-[#30363d] bg-[#161b22]">
        <span className="text-[11px] font-medium text-[#8b949e] uppercase tracking-wider">Input</span>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#6e7681] tabular-nums">{value.length} chars</span>
          {value && (
            <button
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 text-[11px] text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            >
              <Eraser className="w-3 h-3" />
              clear
            </button>
          )}
        </div>
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={"Paste messy output here…\n\nLFI / SSRF / XXE responses, base64, JWT,\nURL-encoded PHP, XML, nginx.conf — anything.\n\nOr drop a file."}
        className="font-code flex-1 w-full bg-transparent text-[#e6edf3] text-[13px] p-3 outline-none placeholder-[#6e7681] leading-relaxed"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}
