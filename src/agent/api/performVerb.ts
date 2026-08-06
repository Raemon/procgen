import { applyAction } from '../actions';
import { verbByAction } from '../controls';
import { applyEditAction } from '../editActions';
import { failureByCode } from '../failures';
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
  const verb = verbByAction(session.mode, action);
  const result = verb ? perform(session, world, verb.group, action, params) : unknownAction(action, session);
  session.lastAction = { action, outcome: result.outcome };
  return result;
}

function perform(
  session: AgentSession,
  world: ServerWorld,
  group: 'movement' | 'editing',
  action: string,
  params: Record<string, unknown>,
): VerbResult {
  if (group === 'movement') return moveVerb(session, world, action);
  const edit = applyEditAction(world.store, world.tileset, action, params);
  if (edit.ok) return { outcome: 'edited', summary: edit.summary, failure: null, changedPipeline: true };
  return { outcome: 'failed', summary: null, failure: verbFailure(edit.code, edit.hint), changedPipeline: false };
}

function moveVerb(session: AgentSession, world: ServerWorld, action: string): VerbResult {
  const outcome = applyAction(sessionActor(session, world.isWalkable), session.mode, action);
  return {
    outcome,
    summary: null,
    failure: outcome === 'blocked' ? verbFailure('blocked', null) : null,
    changedPipeline: false,
  };
}

function unknownAction(action: string, session: AgentSession): VerbResult {
  return {
    outcome: 'unknown_action',
    summary: null,
    failure: verbFailure('unknown_action', `'${action}' is not a ${session.mode}-mode verb`),
    changedPipeline: false,
  };
}

function verbFailure(code: string, hint: string | null): VerbFailure {
  const spec = failureByCode(code);
  return {
    code,
    meaning: spec?.meaning ?? code,
    recovery: spec?.recovery ?? 'See GET /api/v1/docs.',
    hint,
  };
}
