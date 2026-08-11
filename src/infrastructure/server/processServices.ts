import type { ProcgenServices } from './procgenServices';

const PROCESS_SERVICES = Symbol.for('procgen.services');

type ProcessWithServices = typeof globalThis & {
  [PROCESS_SERVICES]?: ProcgenServices;
};

export function setProcessServices(services: ProcgenServices): void {
  (globalThis as ProcessWithServices)[PROCESS_SERVICES] = services;
}

export function processServices(): ProcgenServices {
  const services = (globalThis as ProcessWithServices)[PROCESS_SERVICES];
  if (!services) throw new Error('procgen services have not started');
  return services;
}
