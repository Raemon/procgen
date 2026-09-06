export interface WorldAnimation {
  advance(dtSeconds: number): void;
  dispose(): void;
}

export class WorldAnimations {
  private readonly animations: WorldAnimation[] = [];
  private readonly stops: Array<() => void> = [];

  add<A extends WorldAnimation>(animation: A): A {
    this.animations.push(animation);
    return animation;
  }

  whenDisposed(stop: () => void): void {
    this.stops.push(stop);
  }

  advance(dtSeconds: number): void {
    for (const animation of this.animations) animation.advance(dtSeconds);
  }

  dispose(): void {
    for (const stop of this.stops.splice(0)) stop();
    for (const animation of this.animations.splice(0)) animation.dispose();
  }
}
