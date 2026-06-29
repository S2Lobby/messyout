export function prettify(text: string, language: string): string {
  if (language === 'json') {
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch { return text; }
  }
  if (language === 'xml' || language === 'html') {
    return prettifyXml(text);
  }
  return text;
}

function prettifyXml(xml: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const err = doc.querySelector('parsererror');
    if (err) return xml;
    return serializeNode(doc.documentElement, 0);
  } catch { return xml; }
}

function serializeNode(node: Node, depth: number): string {
  const indent = '  '.repeat(depth);
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim() ?? '';
    return text ? `${indent}${text}` : '';
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';
  const el = node as Element;
  const tag = el.tagName;
  const attrs = Array.from(el.attributes).map(a => ` ${a.name}="${a.value}"`).join('');
  const children = Array.from(el.childNodes)
    .map(c => serializeNode(c, depth + 1))
    .filter(Boolean);
  if (children.length === 0) return `${indent}<${tag}${attrs}/>`;
  if (children.length === 1 && !children[0].includes('\n')) {
    return `${indent}<${tag}${attrs}>${children[0].trim()}</${tag}>`;
  }
  return `${indent}<${tag}${attrs}>\n${children.join('\n')}\n${indent}</${tag}>`;
}
