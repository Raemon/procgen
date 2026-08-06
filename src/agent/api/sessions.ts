import type { FacingIndex } from '../../world/facing';
import type { ActionOutcome, ActorWorld } from '../actions';
import type { AgentMode, AgentPose } from '../agentMode';

export interface AgentSession {
  id: string;
  name: string;
  mode: AgentMode;
  x: number;
  y: number;
  facing: FacingIndex;
  createdAt: number;
  lastAction: { action: string; outcome: ActionOutcome } | null;
  run: AutopilotRun | null;
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
  };
}

export function sessionPose(session: AgentSession): AgentPose {
  return { x: session.x, y: session.y, facing: session.facing };
}

export function sessionActor(
  session: AgentSession,
  isWalkable: (x: number, y: number) => boolean,
): ActorWorld {
  return {
    pose: () => sessionPose(session),
    tryStep: (dx, dy) => {
      const nextX = session.x + dx;
      const nextY = session.y + dy;
      if (!isWalkable(nextX, nextY)) return false;
      session.x = nextX;
      session.y = nextY;
      return true;
    },
    turn: (eighthTurns) => {
      session.facing = ((((session.facing + eighthTurns) % 8) + 8) % 8) as FacingIndex;
    },
  };
}

export function appendTranscript(
  run: AutopilotRun,
  type: TranscriptEntry['type'],
  text: string,
): void {
  const seq = (run.transcript[run.transcript.length - 1]?.seq ?? 0) + 1;
  run.transcript.push({ seq, type, text });
}
