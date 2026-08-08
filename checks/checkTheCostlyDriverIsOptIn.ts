import { driverFromEnvironment } from '../tools/explore/drivers/driverFromEnvironment';
import { explorerWalkDriver } from '../tools/explore/drivers/explorerWalkDriver';
import type { CheckReporter } from './checkReporter';

export function checkTheCostlyDriverIsOptIn(check: CheckReporter): void {
  check(
    'the explorer walk is what an unasked-for driver gives you, so nothing reaches for an API key by default',
    driverFromEnvironment({}) === explorerWalkDriver,
  );
  check(
    'asking for the llm policy without a key fails saying which key is missing, rather than doing nothing',
    complaintFrom({ WORLD_DRIVER: 'agent', AGENT_POLICY: 'llm' }).includes('ANTHROPIC_API_KEY'),
  );
  check(
    'a driver name nothing answers to fails naming the drivers there are, rather than quietly walking anyway',
    complaintFrom({ WORLD_DRIVER: 'wander' }).includes('explorer'),
  );
}

function complaintFrom(env: Record<string, string>): string {
  try {
    driverFromEnvironment(env);
    return '';
  } catch (error) {
    return String(error);
  }
}
