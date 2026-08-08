import { performVerb, type VerbResult } from '../../../api/agent/performVerb';
import type { ServerWorld } from '../../../api/agent/serverWorld';
import { newSession, type AgentSession } from '../../../api/agent/sessions';
import { buildObservation } from '../../../agents/observation';
import { observationText } from '../../../agents/observationText';
import type { CellPoint } from '../../../world/nearestWalkable';
import { cellKey, stepsTaken, type ExplorationTrace } from '../explorationTrace';
import type { AgentPolicy, AgentTurnView, SeededAgentPolicy } from './agentPolicy';
import type { DriverRun, WorldDriver } from './worldDriver';

export const AGENT_DRIVER_NAME = 'agent';

export function agentDriver(policy: SeededAgentPolicy): WorldDriver {
  return {
    name: `${AGENT_DRIVER_NAME}:${policy.name}`,
    explore: (run) => walkAsAnAgent(run, policy.forSeed(run.seed)),
  };
}

async function walkAsAnAgent(run: DriverRun, policy: AgentPolicy): Promise<ExplorationTrace> {
  const session = newSession('driver', 'driver', 'character', run.spawn);
  const trace = traceStartingAt(run.spawn);
  let last: VerbResult | null = null;
  while (stepsTaken(trace) < run.limits.stepBudget) {
    const chosen = await policy.decide(turnView(session, run.world, trace, last));
    if (!chosen) return trace;
    last = performVerb(session, run.world, chosen.action, chosen.params);
    recordWhereTheAgentStands(trace, session);
  }
  return trace;
}

function traceStartingAt(spawn: CellPoint): ExplorationTrace {
  return {
    spawn,
    path: [spawn],
    visited: new Set([cellKey(spawn.x, spawn.y)]),
    exhaustedRegion: false,
  };
}

function turnView(
  session: AgentSession,
  world: ServerWorld,
  trace: ExplorationTrace,
  last: VerbResult | null,
): AgentTurnView {
  const observation = buildObservation(
    world.sampler,
    world.tileAssets,
    { x: session.x, y: session.y, facing: session.facing },
    session.mode,
    session.sightRadiusTiles,
    world.puzzles,
  );
  return {
    observation,
    observationText: observationText(observation),
    actionsTaken: stepsTaken(trace),
    lastOutcome: last?.outcome ?? null,
    lastFailure: last?.failure?.meaning ?? null,
  };
}

function recordWhereTheAgentStands(trace: ExplorationTrace, session: AgentSession): void {
  const cell: CellPoint = { x: session.x, y: session.y };
  trace.path.push(cell);
  trace.visited.add(cellKey(cell.x, cell.y));
}
