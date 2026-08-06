import { QuestInventory } from '../../quest/questInventory';
import type { QuestPointsIndex } from '../../quest/questPointsIndex';
import { collectKeysAt, lockedDoorIdAt } from '../../quest/questRules';
import type { FacingIndex } from '../../world/facing';
import type { ActorWorld } from '../actions';
import type { AgentMode, AgentPose } from '../agentMode';

export interface AgentSession {
  id: string;
  name: string;
  mode: AgentMode;
  x: number;
  y: number;
  facing: FacingIndex;
  createdAt: number;
  lastAction: { action: string; outcome: string } | null;
  run: AutopilotRun | null;
  inventory: QuestInventory;
  blockedByDoorId: string | null;
  lastPickups: string[];
}

export interface SessionWalkWorld {
  isWalkable(x: number, y: number): boolean;
  quest: QuestPointsIndex;
}

export interface TranscriptEntry {
  seq: number;
  type: 'status' | 'thinking' | 'message' | 'tool_use' | 'tool_result' | 'error';
  text: string;
}

export type RunStatus = 'running' | 'stopped' | 'finished' | 'error';

export interface AutopilotRun {
  goal: string;
  model: string;
  status: RunStatus;
  steps: number;
  maxSteps: number;
  transcript: TranscriptEntry[];
  stopRequested: boolean;
}

export type SessionStore = Map<string, AgentSession>;

export function newSession(
  id: string,
  name: string,
  mode: AgentMode,
  spawn: { x: number; y: number },
): AgentSession {
  return {
    id,
    name,
    mode,
    x: spawn.x,
    y: spawn.y,
    facing: 0,
    createdAt: Date.now(),
    lastAction: null,
    run: null,
    inventory: new QuestInventory(),
    blockedByDoorId: null,
    lastPickups: [],
  };
}

export function sessionPose(session: AgentSession): AgentPose {
  return { x: session.x, y: session.y, facing: session.facing };
}

export function sessionActor(session: AgentSession, world: SessionWalkWorld): ActorWorld {
  return {
    pose: () => sessionPose(session),
    tryStep: (dx, dy) => tryQuestAwareStep(session, world, dx, dy),
    turn: (eighthTurns) => {
      session.facing = ((((session.facing + eighthTurns) % 8) + 8) % 8) as FacingIndex;
    },
  };
}

function tryQuestAwareStep(
  session: AgentSession,
  world: SessionWalkWorld,
  dx: number,
  dy: number,
): boolean {
  const nextX = session.x + dx;
  const nextY = session.y + dy;
  if (!world.isWalkable(nextX, nextY)) return false;
  const lockedDoorId = lockedDoorIdAt(world.quest, session.inventory, nextX, nextY);
  if (lockedDoorId !== null) {
    session.blockedByDoorId = lockedDoorId;
    return false;
  }
  session.x = nextX;
  session.y = nextY;
  session.lastPickups.push(...collectKeysAt(world.quest, session.inventory, nextX, nextY));
  return true;
}

export function appendTranscript(
  run: AutopilotRun,
  type: TranscriptEntry['type'],
  text: string,
): void {
  const seq = (run.transcript[run.transcript.length - 1]?.seq ?? 0) + 1;
  run.transcript.push({ seq, type, text });
}
