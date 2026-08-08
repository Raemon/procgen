const BYTES_PER_MB = 1024 * 1024;

export interface BrowserMemory {
  usedHeapMb: number;
  totalHeapMb: number;
  heapLimitMb: number;
}

interface ChromeMemoryReadout {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export function browserMemory(): BrowserMemory | null {
  const readout = (performance as { memory?: ChromeMemoryReadout }).memory;
  if (!readout) return null;
  return {
    usedHeapMb: readout.usedJSHeapSize / BYTES_PER_MB,
    totalHeapMb: readout.totalJSHeapSize / BYTES_PER_MB,
    heapLimitMb: readout.jsHeapSizeLimit / BYTES_PER_MB,
  };
}
