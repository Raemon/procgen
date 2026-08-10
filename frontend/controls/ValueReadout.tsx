export function ValueReadout({ value }: { value: number }) {
  return <span className="min-w-[34px] text-right text-[11px]">{formatNumber(value)}</span>;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(value < 0.2 ? 3 : 2);
}
