export type FeatureVisibilityState = 'shown' | 'faded' | 'hidden';

export const FADED_OPACITY = 0.2;

const NEXT_STATE: Record<FeatureVisibilityState, FeatureVisibilityState> = {
  shown: 'faded',
  faded: 'hidden',
  hidden: 'shown',
};

export class FeatureVisibility {
  private readonly states = new Map<string, FeatureVisibilityState>();

  stateOf(nodeId: string): FeatureVisibilityState {
    return this.states.get(nodeId) ?? 'shown';
  }

  cycle(nodeId: string): FeatureVisibilityState {
    const next = NEXT_STATE[this.stateOf(nodeId)];
    this.states.set(nodeId, next);
    return next;
  }

  isHidden(nodeId: string): boolean {
    return this.stateOf(nodeId) === 'hidden';
  }

  opacityOf(nodeId: string): number {
    return this.stateOf(nodeId) === 'faded' ? FADED_OPACITY : 1;
  }
}
