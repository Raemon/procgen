export function formatMs(value: number): string {
  return `${value.toFixed(value < 10 ? 1 : 0)} ms`;
}

export function formatMb(value: number): string {
  return `${value.toFixed(value < 100 ? 1 : 0)} MB`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(value < 10 ? 1 : 0)}%`;
}

export function formatCount(value: number): string {
  return value >= 10000 ? `${Math.round(value / 1000)}k` : String(Math.round(value));
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
