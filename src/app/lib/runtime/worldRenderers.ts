export interface WorldRenderer {
  redraw(): void;
  recenterOnPlayer(): void;
}

export class WorldRenderers {
  private readonly renderers = new Set<WorldRenderer>();

  add(renderer: WorldRenderer): () => void {
    this.renderers.add(renderer);
    return () => this.renderers.delete(renderer);
  }

  redrawAll(): void {
    for (const renderer of this.renderers) renderer.redraw();
  }

  recenterAll(): void {
    for (const renderer of this.renderers) renderer.recenterOnPlayer();
  }
}
