import '../../abilities/index';
import { performAbility } from '../../abilities/performAbility';
import { abilityFor } from '../../abilities/abilityRegistry';
import { failureByCode } from '../../agents/failures';
import type { ServerWorld } from './serverWorld';
import { sessionActor, type AgentSession } from './sessions';

export interface VerbFailure {
  code: string;
  meaning: string;
  recovery: string;
  hint: string | null;
}

export interface VerbResult {
  outcome: string;
  summary: string | null;
  failure: VerbFailure | null;
  changedPipeline: boolean;
}

export function performVerb(
  session: AgentSession,
  world: ServerWorld,
  action: string,
  params: Record<string, unknown>,
): VerbResult {
  const result = performAbility(
    {
      store: world.store,
      tileAssets: world.tileAssets,
      pieces: world.pieces,
      cultures: world.cultures,
      creatures: world.creatures,
      items: world.items,
      templates: world.templates,
      worldPresets: world.worldPresets,
      randomizeHistory: world.randomizeHistory,
      regionSampler: world.sampler,
      groundItems: world.groundItems,
      puzzles: world.puzzles,
      actor: sessionActor(session, world.stepRules),
    },
    session.mode,
    action,
    params,
  );
  const outcome = outcomeOf(action, session.mode, result.ok);
  session.lastAction = { action, outcome };
  return {
    outcome,
    summary: result.ok ? result.summary : null,
    failure: result.ok ? null : verbFailure(result.code, result.hint),
    changedPipeline: result.ok && (abilityFor(session.mode, action)?.changesWorld ?? false),
  };
}

function outcomeOf(action: string, mode: AgentSessionMode, ok: boolean): string {
  if (!ok) return 'failed';
  const spec = abilityFor(mode, action);
  if (spec?.changesWorld) return 'edited';
  return spec?.group === 'senses' ? 'sensed' : 'moved';
}

type AgentSessionMode = AgentSession['mode'];

function verbFailure(code: string, hint: string | null): VerbFailure {
  const spec = failureByCode(code);
  return {
    code,
    meaning: spec?.meaning ?? code,
    recovery: spec?.recovery ?? 'See GET /api/v1/docs.',
    hint,
  };
}
