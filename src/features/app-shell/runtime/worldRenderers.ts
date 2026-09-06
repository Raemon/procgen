export type WorldRedraw = 'world' | 'shared-state';

export interface WorldRenderer {
  redraw(change: WorldRedraw): void;
  recenterOnPlayer(): void;
}

export class WorldRenderers {
  private readonly renderers = new Set<WorldRenderer>();

  add(renderer: WorldRenderer): () => void {
    this.renderers.add(renderer);
    return () => this.renderers.delete(renderer);
  }

  redrawAll(change: WorldRedraw): void {
    for (const renderer of this.renderers) renderer.redraw(change);
  }

  recenterAll(): void {
    for (const renderer of this.renderers) renderer.recenterOnPlayer();
  }
}
