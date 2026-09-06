import { Worker } from 'node:worker_threads';
import { serializedWholeWorldBuild, type BuildRequest } from '@/features/asset-library/worlds/eval/builtValues';
import type { BuildRunner } from './worldBuildQueue';

export type ProgressListener = (fraction: number, stage: string) => void;

export interface WorkerMessage {
  t: 'progress' | 'done' | 'failed';
  key: string;
  fraction?: number;
  stage?: string;
  serialized?: unknown;
  message?: string;
}

export interface WorkerJob {
  t: 'build';
  key: string;
  request: BuildRequest;
}

export function inProcessRunner(): BuildRunner {
  return {
    run: (request, onProgress) => Promise.resolve().then(() => serializedWholeWorldBuild(request, onProgress)),
  };
}

export function workerRunner(bundlePath: () => Promise<string | null>): BuildRunner {
  const fallback = inProcessRunner();
  const worker = new PersistentBuildWorker(bundlePath);
  return {
    run: async (request, onProgress) => {
      try {
        return await worker.run(request, onProgress);
      } catch (error) {
        if (!(error instanceof WorkerUnavailable)) throw error;
        console.warn(`[builds] ${error.message}; building ${request.nodeType} on the main thread`);
        return fallback.run(request, onProgress);
      }
    },
  };
}

class WorkerUnavailable extends Error {}

interface PendingJob {
  key: string;
  onProgress: ProgressListener;
  resolve(serialized: unknown): void;
  reject(error: Error): void;
}

class PersistentBuildWorker {
  private worker: Worker | null = null;
  private job: PendingJob | null = null;
  private jobs = 0;

  constructor(private readonly bundlePath: () => Promise<string | null>) {}

  async run(request: BuildRequest, onProgress: ProgressListener): Promise<unknown> {
    const path = await this.bundlePath();
    if (!path) throw new WorkerUnavailable('no build worker bundle is available');
    const worker = this.spawned(path);
    const key = `job${++this.jobs}`;
    return new Promise<unknown>((resolve, reject) => {
      this.job = { key, onProgress, resolve, reject };
      const job: WorkerJob = { t: 'build', key, request };
      worker.postMessage(job);
    });
  }

  private spawned(path: string): Worker {
    if (this.worker) return this.worker;
    const worker = new Worker(path);
    worker.on('message', (message: WorkerMessage) => this.receive(message));
    worker.on('error', (error) => this.fail(new WorkerUnavailable(`the build worker crashed: ${error.message}`)));
    worker.on('exit', (code) => {
      this.worker = null;
      this.fail(new WorkerUnavailable(`the build worker exited with code ${code}`));
    });
    worker.unref();
    this.worker = worker;
    return worker;
  }

  private receive(message: WorkerMessage): void {
    const job = this.job;
    if (!job || message.key !== job.key) return;
    if (message.t === 'progress') {
      job.onProgress(message.fraction ?? 0, message.stage ?? '');
      return;
    }
    this.job = null;
    if (message.t === 'done') job.resolve(message.serialized ?? null);
    else job.reject(new Error(message.message ?? 'the build failed'));
  }

  private fail(error: Error): void {
    const job = this.job;
    if (!job) return;
    this.job = null;
    job.reject(error);
  }
}
