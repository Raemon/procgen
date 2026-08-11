import { execFile } from 'node:child_process';

const PROCESSES_LISTED = 8;
const LISTING_TIMEOUT_MS = 1500;

export interface HostProcess {
  pid: number;
  cpuPercent: number;
  memoryPercent: number;
  command: string;
}

export function heaviestHostProcesses(): Promise<HostProcess[]> {
  return new Promise((resolve) => {
    execFile(
      'ps',
      ['-eo', 'pid=,pcpu=,pmem=,comm='],
      { timeout: LISTING_TIMEOUT_MS },
      (error, stdout) => resolve(error ? [] : parseHeaviestProcessListing(stdout)),
    );
  });
}

export function parseHeaviestProcessListing(listing: string): HostProcess[] {
  return listing
    .split('\n')
    .map(parseProcessLine)
    .filter((entry): entry is HostProcess => entry !== null)
    .sort((a, b) => b.cpuPercent - a.cpuPercent)
    .slice(0, PROCESSES_LISTED);
}

function parseProcessLine(line: string): HostProcess | null {
  const fields = line.trim().split(/\s+/);
  if (fields.length < 4) return null;
  const [pid, cpuPercent, memoryPercent, ...command] = fields;
  if (!Number.isFinite(Number(pid)) || !Number.isFinite(Number(cpuPercent))) return null;
  return {
    pid: Number(pid),
    cpuPercent: Number(cpuPercent),
    memoryPercent: Number(memoryPercent),
    command: command.join(' '),
  };
}
