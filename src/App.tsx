import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { OutputHeader } from './components/OutputHeader';
import { MetaBar } from './components/MetaBar';
import { InspectorTabs } from './components/InspectorTabs';
import { Toolbar } from './components/Toolbar';
import { Hero } from './components/Hero';
import { Skeleton } from './components/Skeleton';
import { useDecoder } from './hooks/useDecoder';
import { loadFromHash } from './lib/share';

export default function App() {
  const [input, setInput] = useState('');
  const [languageOverride, setLanguageOverride] = useState<string | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [wrap, setWrap] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<'input' | 'output'>('input');

  const { result, loading, error } = useDecoder(input, languageOverride);

  // Load shared content from URL hash on mount
  useEffect(() => {
    const shared = loadFromHash();
    if (shared) setInput(shared);
  }, []);

  // Reset selected layer when result changes
  useEffect(() => { setSelectedLayer(null); }, [result?.finalOutput]);

  const pickSample = (value: string) => {
    setInput(value);
    setMobileTab('output');
  };

  // Guard the layer access: a new result may have fewer layers than the
  // previously-selected index (the reset effect runs only after render).
  const selLayer = selectedLayer !== null ? result?.layers[selectedLayer] : undefined;
  const displayedCode = result ? (selLayer ? selLayer.output : result.finalOutput) : '';
  const displayedLang = selLayer ? 'plaintext' : (result?.format.language ?? 'plaintext');

  const hasTabs = !!result && (
    result.layers.length > 0 || result.secrets.length > 0 || result.embedded.length > 0 ||
    (result.format.explain?.length ?? 0) > 0
  );
  const hasSecrets = !!result && result.secrets.some(s => s.severity === 'high');

  const outputColumn = (
    <div className="flex flex-col min-h-0 h-full bg-[#0d1117]">
      {result ? (
        <>
          <OutputHeader
            wrap={wrap}
            onToggleWrap={() => setWrap(w => !w)}
            hasInspector={hasTabs}
            inspectorOpen={inspectorOpen}
            onToggleInspector={() => setInspectorOpen(o => !o)}
          />

          {result.truncated && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#d29922] bg-[#d29922]/10 border-b border-[#d29922]/30 shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Input exceeded 2&nbsp;MB and was truncated for analysis.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-[#f85149] bg-[#f85149]/10 border-b border-[#f85149]/30 shrink-0" role="status">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Couldn’t fully decode — showing last result. ({error})
            </div>
          )}

          {/* Inspector zone: persistent MetaBar strip + tabbed panels */}
          <div className="shrink-0 border-b border-[#30363d] bg-[#161b22]">
            <MetaBar
              result={result}
              languageOverride={languageOverride}
              onOverride={setLanguageOverride}
            />
            {hasTabs && inspectorOpen && (
              <div className="max-h-[32vh] flex flex-col border-t border-[#30363d]">
                <InspectorTabs
                  result={result}
                  selectedLayer={selectedLayer}
                  onSelectLayer={setSelectedLayer}
                />
              </div>
            )}
          </div>

          {/* Viewing-a-layer indicator (DecodeTree selection shows raw layer output) */}
          {selectedLayer !== null && result.layers[selectedLayer] && (
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] text-[#58a6ff] bg-[#388bfd1a] border-b border-[#30363d] shrink-0">
              <span>Showing raw output of layer {selectedLayer + 1} ({result.layers[selectedLayer].decoderName})</span>
              <button
                onClick={() => setSelectedLayer(null)}
                className="text-[#8b949e] hover:text-[#e6edf3] transition-colors"
              >
                back to result
              </button>
            </div>
          )}

          {/* Code zone */}
          <OutputPanel code={displayedCode} language={displayedLang} wrap={wrap} />
          <Toolbar output={result.finalOutput} input={input} />
        </>
      ) : loading ? (
        <>
          <OutputHeader
            wrap={wrap} onToggleWrap={() => setWrap(w => !w)}
            hasInspector={false} inspectorOpen={false} onToggleInspector={() => {}}
          />
          <Skeleton />
        </>
      ) : error ? (
        <div className="flex-1 grid place-items-center p-6 text-center">
          <div className="flex flex-col items-center gap-2 text-[#f85149]">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">Couldn’t decode that input.</span>
            <span className="text-xs text-[#8b949e]">{error}</span>
          </div>
        </div>
      ) : (
        <Hero onPickSample={pickSample} />
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen">
      <Header />

      {/* Mobile tab switcher */}
      <div role="tablist" aria-label="View" className="md:hidden flex shrink-0 border-b border-[#30363d] bg-[#161b22]">
        {(['input', 'output'] as const).map(tab => (
          <button
            key={tab}
            role="tab"
            id={`mo-pane-tab-${tab}`}
            aria-selected={mobileTab === tab}
            aria-controls={`mo-pane-${tab}`}
            tabIndex={mobileTab === tab ? 0 : -1}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs py-2 capitalize transition-colors border-b-2 ${
              mobileTab === tab
                ? 'border-[#58a6ff] text-[#e6edf3]'
                : 'border-transparent text-[#8b949e]'
            }`}
          >
            {tab}
            {tab === 'output' && hasSecrets && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f85149]" aria-hidden="true" />
                <span className="sr-only">high-severity secrets found</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Desktop split / mobile single-pane */}
      <div className="flex flex-1 min-h-0">
        <div
          role="tabpanel"
          id="mo-pane-input"
          aria-labelledby="mo-pane-tab-input"
          className={`${mobileTab === 'input' ? 'flex' : 'hidden'} md:flex flex-col md:w-[45%] w-full min-h-0 border-r border-[#30363d]`}
        >
          <InputPanel value={input} onChange={setInput} />
        </div>
        <div
          role="tabpanel"
          id="mo-pane-output"
          aria-labelledby="mo-pane-tab-output"
          className={`${mobileTab === 'output' ? 'flex' : 'hidden'} md:flex flex-col md:flex-1 w-full min-h-0`}
        >
          {outputColumn}
        </div>
      </div>
    </div>
  );
}
