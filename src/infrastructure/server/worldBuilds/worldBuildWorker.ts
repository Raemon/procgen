import { parentPort } from 'node:worker_threads';
import '@/features/asset-library/worlds/nodes';
import { serializedWholeWorldBuild } from '@/features/asset-library/worlds/eval/builtValues';
import type { WorkerJob, WorkerMessage } from './buildRunners';

const port = parentPort;

if (port) {
  port.on('message', (job: WorkerJob) => {
    if (job.t !== 'build') return;
    const reply = (message: WorkerMessage) => port.postMessage(message);
    try {
      const serialized = serializedWholeWorldBuild(job.request, (fraction, stage) =>
        reply({ t: 'progress', key: job.key, fraction, stage }),
      );
      reply({ t: 'done', key: job.key, serialized });
    } catch (error) {
      reply({ t: 'failed', key: job.key, message: error instanceof Error ? error.message : String(error) });
    }
  });
}
