import { useState } from 'react';
import { Copy, Check, Download, Share2 } from 'lucide-react';
import { getShareUrl } from '../lib/share';

interface Props {
  output: string;
  input: string;
}

export function Toolbar({ output, input }: Props) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const writeClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for non-secure contexts / embedded webviews.
      try {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch { return false; }
    }
  };

  const copy = async () => {
    if (await writeClipboard(output)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const exportTxt = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'messyout.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    const url = getShareUrl(input);
    if (url.length > 8000) return; // too large for a usable link
    if (await writeClipboard(url)) {
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    }
  };

  const base = "inline-flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors active:opacity-80";
  const idle = "border-[#30363d] text-[#e6edf3] hover:bg-[#21262d] hover:border-[#484f58]";
  const ok = "border-[#3fb950]/50 text-[#3fb950] bg-[#3fb950]/10";

  return (
    <div className="flex gap-2 px-3 py-2 border-t border-[#30363d] bg-[#161b22] shrink-0">
      <button className={`${base} ${copied ? ok : idle}`} onClick={copy}>
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button className={`${base} ${idle}`} onClick={exportTxt}>
        <Download className="w-3.5 h-3.5" />
        Export
      </button>
      <button className={`${base} ${shared ? ok : idle}`} onClick={share}>
        {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
        {shared ? 'Link copied' : 'Share'}
      </button>
    </div>
  );
}
