export function shannonEntropy(text: string): number {
  if (!text) return 0;
  // Iterate by code point and count by code point so probabilities sum to 1
  // (astral chars are 2 UTF-16 units — using text.length would understate it).
  const chars = [...text];
  const freq: Record<string, number> = {};
  for (const ch of chars) freq[ch] = (freq[ch] ?? 0) + 1;
  const n = chars.length;
  return -Object.values(freq).reduce((sum, count) => {
    const p = count / n;
    return sum + p * Math.log2(p);
  }, 0);
}

export function entropyLabel(e: number): 'Low' | 'Medium' | 'High' | 'Very High' {
  if (e < 3) return 'Low';
  if (e < 5) return 'Medium';
  if (e < 7) return 'High';
  return 'Very High';
}
