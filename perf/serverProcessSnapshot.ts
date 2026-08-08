import { cpus, loadavg, totalmem, freemem } from 'node:os';

const BYTES_PER_MB = 1024 * 1024;
const MICROSECONDS_PER_MS = 1000;

export interface ServerProcessSnapshot {
  pid: number;
  nodeVersion: string;
  uptimeSeconds: number;
  cpuPercent: number | null;
  rssMb: number;
  heapUsedMb: number;
  heapTotalMb: number;
  externalMb: number;
  cpuCount: number;
  loadAverage: number[];
  hostMemoryUsedMb: number;
  hostMemoryTotalMb: number;
}

interface CpuSample {
  atMs: number;
  usage: NodeJS.CpuUsage;
}

let lastCpuSample: CpuSample | null = null;

export function serverProcessSnapshot(): ServerProcessSnapshot {
  const memory = process.memoryUsage();
  return {
    pid: process.pid,
    nodeVersion: process.version,
    uptimeSeconds: process.uptime(),
    cpuPercent: cpuPercentSinceLastSnapshot(),
    rssMb: memory.rss / BYTES_PER_MB,
    heapUsedMb: memory.heapUsed / BYTES_PER_MB,
    heapTotalMb: memory.heapTotal / BYTES_PER_MB,
    externalMb: memory.external / BYTES_PER_MB,
    cpuCount: cpus().length,
    loadAverage: loadavg(),
    hostMemoryUsedMb: (totalmem() - freemem()) / BYTES_PER_MB,
    hostMemoryTotalMb: totalmem() / BYTES_PER_MB,
  };
}

function cpuPercentSinceLastSnapshot(): number | null {
  const sample: CpuSample = { atMs: performance.now(), usage: process.cpuUsage() };
  const previous = lastCpuSample;
  lastCpuSample = sample;
  if (previous === null) return null;
  const elapsedMs = sample.atMs - previous.atMs;
  if (elapsedMs <= 0) return null;
  return (cpuMillisecondsBetween(previous.usage, sample.usage) / elapsedMs) * 100;
}

function cpuMillisecondsBetween(before: NodeJS.CpuUsage, after: NodeJS.CpuUsage): number {
  const userMicroseconds = after.user - before.user;
  const systemMicroseconds = after.system - before.system;
  return (userMicroseconds + systemMicroseconds) / MICROSECONDS_PER_MS;
}
