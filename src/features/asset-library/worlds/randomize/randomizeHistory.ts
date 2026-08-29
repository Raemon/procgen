import type { PipelineState } from '../pipeline/pipelineState';
import type { RunningWorldRef } from '../running/runningWorld';
import { clonedState } from './clonedState';

const MAX_REMEMBERED = 30;

export interface RememberedRoll {
  state: PipelineState;
  running: RunningWorldRef | null;
}

export class RandomizeHistory {
  private readonly rolls: RememberedRoll[] = [];

  remember(state: PipelineState, running: RunningWorldRef | null = null): void {
    this.rolls.push({ state: clonedState(state), running });
    if (this.rolls.length > MAX_REMEMBERED) this.rolls.shift();
  }

  undo(): RememberedRoll | null {
    return this.rolls.pop() ?? null;
  }

  canUndo(): boolean {
    return this.rolls.length > 0;
  }
}
