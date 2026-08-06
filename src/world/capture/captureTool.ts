import type { WorldRegion } from '../../prefabs/captureRegionAsPrefab';

export interface CaptureCell {
  x: number;
  y: number;
}

export type CaptureCommit = (region: WorldRegion) => void;

export class CaptureTool {
  private active = false;
  private anchor: CaptureCell | null = null;
  private cursor: CaptureCell | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(private readonly commit: CaptureCommit) {}

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
    this.anchor = null;
    this.cursor = null;
    this.notify();
  }

  begin(cell: CaptureCell): void {
    if (!this.active) return;
    this.anchor = cell;
    this.cursor = cell;
    this.notify();
  }

  extendTo(cell: CaptureCell): void {
    if (!this.anchor) return;
    this.cursor = cell;
    this.notify();
  }

  finish(): void {
    const region = this.selectedRegion();
    this.anchor = null;
    this.cursor = null;
    if (region) this.commit(region);
    this.notify();
  }

  cancel(): void {
    this.anchor = null;
    this.cursor = null;
    this.notify();
  }

  selectedRegion(): WorldRegion | null {
    if (!this.anchor || !this.cursor) return null;
    return {
      minX: Math.min(this.anchor.x, this.cursor.x),
      minY: Math.min(this.anchor.y, this.cursor.y),
      maxX: Math.max(this.anchor.x, this.cursor.x),
      maxY: Math.max(this.anchor.y, this.cursor.y),
    };
  }

  onChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}
