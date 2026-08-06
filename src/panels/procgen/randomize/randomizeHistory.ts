import type { PipelineState } from '../../../procgen/pipeline/pipelineState';
import { clonedState } from './clonedState';

const MAX_REMEMBERED = 30;

export class RandomizeHistory {
  private readonly states: PipelineState[] = [];

  remember(state: PipelineState): void {
    this.states.push(clonedState(state));
    if (this.states.length > MAX_REMEMBERED) this.states.shift();
  }

  undo(): PipelineState | null {
    return this.states.pop() ?? null;
  }

  canUndo(): boolean {
    return this.states.length > 0;
  }
}
