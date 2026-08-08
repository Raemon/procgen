import type { HostProcess } from './heaviestHostProcesses';
import type { ServerProcessSnapshot } from './serverProcessSnapshot';

export const SERVER_LOAD_PATH = '/perf/server-load';

export interface ServerLoad {
  process: ServerProcessSnapshot;
  eventLoopLagMs: number;
  hostProcesses: HostProcess[];
  hostProcessesWithheld: boolean;
}
