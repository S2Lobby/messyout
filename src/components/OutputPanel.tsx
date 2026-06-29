import { Highlight, themes } from 'prism-react-renderer';

// Map our detector languages to Prism-supported languages
const LANG_MAP: Record<string, string> = {
  nginx: 'nginx',
  apacheconf: 'apacheconf',
  dockerfile: 'docker',
  http: 'http',
  ini: 'ini',
  yaml: 'yaml',
  php: 'php',
  javascript: 'javascript',
  python: 'python',
  sql: 'sql',
  bash: 'bash',
  java: 'java',
  ruby: 'ruby',
  json: 'json',
  xml: 'markup',
  html: 'markup',
  plaintext: 'plaintext',
};

interface Props {
  code: string;
  language: string;
  wrap: boolean;
}

export function OutputPanel({ code, language, wrap }: Props) {
  const prismLang = LANG_MAP[language] ?? 'plaintext';

  return (
    <div className="flex-1 overflow-auto bg-[#0d1117]">
      <Highlight theme={themes.vsDark} code={code} language={prismLang}>
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="text-[13px] py-3 m-0 min-h-full leading-relaxed mo-fade-in"
            style={{ ...style, background: 'transparent' }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} className="table-row group">
                <span className="table-cell text-right pr-3 pl-3 select-none text-[#6e7681] text-[11px] w-12 min-w-12 tabular-nums border-r border-[#21262d] group-hover:text-[#8b949e]">
                  {i + 1}
                </span>
                <span className={`table-cell pl-3 pr-4 ${wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'}`}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}
