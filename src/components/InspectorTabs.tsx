import { useMemo, useState, useEffect, useRef } from 'react';
import { Layers, KeyRound, Boxes, Lightbulb } from 'lucide-react';
import { DecodeTree } from './DecodeTree';
import { SecretsPanel } from './SecretsPanel';
import { EmbeddedPanel } from './EmbeddedPanel';
import { ExplainPanel, matchedExplain } from './ExplainPanel';
import type { DecodeResult } from '../types';

type TabId = 'layers' | 'secrets' | 'embedded' | 'explain';

interface Props {
  result: DecodeResult;
  selectedLayer: number | null;
  onSelectLayer: (idx: number | null) => void;
}

export function InspectorTabs({ result, selectedLayer, onSelectLayer }: Props) {
  const explainCount = useMemo(
    () => matchedExplain(result.format, result.finalOutput).length,
    [result.format, result.finalOutput]
  );

  const tabs = useMemo(() => {
    const hasHigh = result.secrets.some(s => s.severity === 'high');
    return [
      { id: 'layers' as const, label: 'Layers', Icon: Layers, count: result.layers.length, danger: false },
      { id: 'secrets' as const, label: 'Secrets', Icon: KeyRound, count: result.secrets.length, danger: hasHigh },
      { id: 'embedded' as const, label: 'Embedded', Icon: Boxes, count: result.embedded.length, danger: false },
      { id: 'explain' as const, label: 'Explain', Icon: Lightbulb, count: explainCount, danger: false },
    ].filter(t => t.count > 0);
  }, [result, explainCount]);

  const secretsFirst: TabId | null = tabs.length === 0
    ? null
    : (tabs.find(t => t.id === 'secrets')?.id ?? tabs[0].id);

  const [active, setActive] = useState<TabId | null>(secretsFirst);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Only reset the active tab when the current selection no longer exists
  // (e.g. the panel emptied on a new decode) — never stomp a valid user choice.
  useEffect(() => {
    const stillThere = active && tabs.some(t => t.id === active);
    if (!stillThere) setActive(secretsFirst);
  }, [tabs, active, secretsFirst]);

  if (tabs.length === 0) return null;
  const current = (active && tabs.some(t => t.id === active) ? active : tabs[0].id) as TabId;

  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = -1;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setActive(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  const single = tabs.length === 1;

  return (
    <div className="flex flex-col min-h-0">
      <div
        role="tablist"
        aria-label="Inspector"
        className="flex items-stretch px-2 border-b border-[#21262d] shrink-0 overflow-x-auto"
      >
        {tabs.map((t, i) => {
          const on = current === t.id;
          return (
            <button
              key={t.id}
              ref={el => { tabRefs.current[i] = el; }}
              role="tab"
              id={`mo-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`mo-panel-${t.id}`}
              tabIndex={single ? 0 : (on ? 0 : -1)}
              onClick={() => setActive(t.id)}
              onKeyDown={e => onKeyDown(e, i)}
              className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-2 border-b-2 -mb-px whitespace-nowrap transition-colors active:opacity-80 ${
                on ? 'border-[#58a6ff] text-[#e6edf3]' : 'border-transparent text-[#8b949e] hover:text-[#e6edf3]'
              } ${single ? 'cursor-default' : ''}`}
            >
              <t.Icon className="w-3.5 h-3.5" />
              {t.label}
              <span className={`tabular-nums text-[10px] leading-none px-1.5 py-0.5 rounded-full min-w-[16px] text-center ${
                t.danger ? 'bg-[#f85149]/15 text-[#f85149]' : 'bg-[#30363d] text-[#8b949e]'
              }`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <div
        key={current}
        role="tabpanel"
        id={`mo-panel-${current}`}
        aria-labelledby={`mo-tab-${current}`}
        className="overflow-auto min-h-0 mo-fade-in"
      >
        {current === 'layers' && (
          <DecodeTree layers={result.layers} selected={selectedLayer} onSelect={onSelectLayer} />
        )}
        {current === 'secrets' && <SecretsPanel secrets={result.secrets} />}
        {current === 'embedded' && <EmbeddedPanel tokens={result.embedded} />}
        {current === 'explain' && <ExplainPanel format={result.format} text={result.finalOutput} />}
      </div>
    </div>
  );
}
