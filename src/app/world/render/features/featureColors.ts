const FALLBACK_PALETTE: readonly string[] = [
  '#7bb0ff',
  '#6fd3a3',
  '#e8a2c8',
  '#c9b8ff',
  '#8fd0d6',
  '#d9c078',
];

const CATEGORY_COLORS: Readonly<Record<string, string>> = {
  landmark: '#f2c14e',
  settlement: '#e08a5e',
  examples: '#7bc86f',
  water: '#5aa7e0',
  terrain: '#b0977a',
  biome: '#8cbf5f',
  maze: '#b78bd6',
  custom: '#d6d68b',
};

export function colorOfCategory(category: string): string {
  return CATEGORY_COLORS[category] ?? FALLBACK_PALETTE[categoryHash(category) % FALLBACK_PALETTE.length]!;
}

function categoryHash(category: string): number {
  let hash = 7;
  for (const char of category) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash;
}
