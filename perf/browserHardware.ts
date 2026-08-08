export interface BrowserHardware {
  cpuCores: number | null;
  deviceMemoryGb: number | null;
}

export function browserHardware(): BrowserHardware {
  const readout = navigator as { hardwareConcurrency?: number; deviceMemory?: number };
  return {
    cpuCores: readout.hardwareConcurrency ?? null,
    deviceMemoryGb: readout.deviceMemory ?? null,
  };
}
