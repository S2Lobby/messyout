import { useState, useEffect, useCallback, useRef } from 'react';
import { runPipeline } from '../lib/pipeline';
import { prettify } from '../lib/prettifier';
import type { DecodeResult } from '../types';

const DEBOUNCE_MS = 300;

export function useDecoder(input: string, languageOverride: string | null) {
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Monotonic id so a slow async run (e.g. gzip) can't overwrite a newer one.
  const genRef = useRef(0);

  const run = useCallback(async (text: string, gen: number) => {
    if (!text.trim()) {
      if (gen === genRef.current) { setResult(null); setError(null); }
      return;
    }
    setLoading(true);
    try {
      const res = await runPipeline(text);
      if (languageOverride) {
        res.format = { ...res.format, language: languageOverride, displayName: languageOverride };
      }
      res.finalOutput = prettify(res.finalOutput, res.format.language);
      if (gen === genRef.current) { setResult(res); setError(null); }
    } catch (e) {
      if (gen === genRef.current) setError(e instanceof Error ? e.message : 'Failed to decode input');
    } finally {
      if (gen === genRef.current) setLoading(false);
    }
  }, [languageOverride]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const gen = ++genRef.current;
    timerRef.current = setTimeout(() => run(input, gen), DEBOUNCE_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [input, run]);

  return { result, loading, error };
}
