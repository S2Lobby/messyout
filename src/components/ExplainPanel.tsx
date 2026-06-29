import type { DetectResult, ExplainEntry } from '../lib/detectors/types';

export function matchedExplain(format: DetectResult, text: string): ExplainEntry[] {
  if (!format.explain) return [];
  return format.explain.filter(e =>
    e.pattern instanceof RegExp ? e.pattern.test(text) : text.includes(e.pattern)
  );
}

interface Props {
  format: DetectResult;
  text: string;
}

export function ExplainPanel({ format, text }: Props) {
  const matched = matchedExplain(format, text);
  if (matched.length === 0) return null;

  return (
    <div className="divide-y divide-[#21262d]">
      {matched.map((e, i) => (
        <div key={i} className="px-3 py-2 flex gap-3 text-xs">
          <span className="text-[#bc8cff] font-medium font-code shrink-0 min-w-[96px]">{e.label}</span>
          <span className="text-[#8b949e] leading-relaxed">{e.description}</span>
        </div>
      ))}
    </div>
  );
}
