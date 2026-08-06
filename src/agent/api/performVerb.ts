import { keyTagFor } from '../../quest/questTags';
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
  const edit = applyEditAction(
    { store: world.store, tileset: world.tileset, prefabs: world.prefabs, creatures: world.creatures },
    action,
    params,
  );
  if (edit.ok) return { outcome: 'edited', summary: edit.summary, failure: null, changedPipeline: true };
  return { outcome: 'failed', summary: null, failure: verbFailure(edit.code, edit.hint), changedPipeline: false };
}

function moveVerb(session: AgentSession, world: ServerWorld, action: string): VerbResult {
  session.blockedByDoorId = null;
  session.lastPickups = [];
  const outcome = applyAction(sessionActor(session, world), session.mode, action);
  if (outcome === 'blocked' && session.blockedByDoorId !== null) {
    return lockedDoorResult(session.blockedByDoorId);
  }
  return {
    outcome,
    summary: pickupSummary(session),
    failure: outcome === 'blocked' ? verbFailure('blocked', null) : null,
    changedPipeline: false,
  };
}

function lockedDoorResult(doorId: string): VerbResult {
  return {
    outcome: 'locked_door',
    summary: null,
    failure: verbFailure(
      'locked_door',
      `door:${doorId} opens for whoever holds ${keyTagFor(doorId)} — find that key marker and step onto it`,
    ),
    changedPipeline: false,
  };
}

function pickupSummary(session: AgentSession): string | null {
  if (session.lastPickups.length === 0) return null;
  return `picked up ${session.lastPickups.map(keyTagFor).join(', ')}`;
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
