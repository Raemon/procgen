import { buildApiSourceIndex } from './apiSourceIndex';
import { discoverApiEndpoints } from './discoverApiEndpoints';
import { findApiConsumerCandidates, findApiConsumers } from './findApiConsumers';
import type { ApiCodeStep, ApiEndpoint } from './apiEndpointTypes';

export type {
  ApiCodeStep,
  ApiConsumer,
  ApiEndpoint,
} from './apiEndpointTypes';

let defaultCatalog: ApiEndpoint[] | null = null;

export function buildApiEndpointCatalog(root: string = process.cwd()): ApiEndpoint[] {
  if (root === process.cwd() && defaultCatalog) return defaultCatalog;
  const index = buildApiSourceIndex(root);
  const candidates = findApiConsumerCandidates(index);
  const endpoints = discoverApiEndpoints(index)
    .map((endpoint) => ({ ...endpoint, consumers: findApiConsumers(endpoint, candidates) }))
    .sort(compareEndpoints);
  if (root === process.cwd()) defaultCatalog = endpoints;
  return endpoints;
}

export function codeStepCount(step: ApiCodeStep): number {
  return 1 + step.calls.reduce((total, call) => total + codeStepCount(call), 0);
}

export function codeSymbols(step: ApiCodeStep): string[] {
  return [step.symbol, ...step.calls.flatMap(codeSymbols)];
}

function compareEndpoints(left: ApiEndpoint, right: ApiEndpoint): number {
  const pathOrder = left.path.localeCompare(right.path);
  return pathOrder === 0 ? left.method.localeCompare(right.method) : pathOrder;
}
