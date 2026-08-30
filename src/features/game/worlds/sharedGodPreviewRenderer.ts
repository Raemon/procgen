import * as THREE from 'three';
import type { SeedWorldGodView } from './seedWorldGodView';

let shared: SharedGodPreviewRenderer | null = null;
let users = 0;

export function acquireSharedGodPreviewRenderer(): SharedGodPreviewRenderer {
  shared ??= new SharedGodPreviewRenderer();
  users += 1;
  return shared;
}

export function releaseSharedGodPreviewRenderer(): void {
  users -= 1;
  if (users > 0 || !shared) return;
  shared.dispose();
  shared = null;
}

const PAINTS_AFTER_A_CHANGE = 90;

export class SharedGodPreviewRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly views = new Set<SeedWorldGodView>();
  private frame = 0;
  private looping = false;
  private paintsLeft = 0;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.left = '-9999px';
    this.renderer.domElement.style.top = '0';
    document.body.appendChild(this.renderer.domElement);
  }

  add(view: SeedWorldGodView): void {
    this.views.add(view);
    this.requestPaint();
  }

  remove(view: SeedWorldGodView): void {
    this.views.delete(view);
    if (this.views.size === 0) this.stop();
    releaseSharedGodPreviewRenderer();
  }

  requestPaint(): void {
    this.paintsLeft = PAINTS_AFTER_A_CHANGE;
    if (this.looping) return;
    this.looping = true;
    this.frame = requestAnimationFrame(() => this.tick());
  }

  dispose(): void {
    this.stop();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private tick(): void {
    for (const view of this.views) {
      view.streamFrame();
      view.paintTo(this.renderer);
    }
    if (this.paintsLeft > 0 || [...this.views].some((view) => view.stillStreaming())) {
      this.paintsLeft = Math.max(0, this.paintsLeft - 1);
      this.frame = requestAnimationFrame(() => this.tick());
      return;
    }
    this.looping = false;
  }

  private stop(): void {
    this.looping = false;
    cancelAnimationFrame(this.frame);
  }
}
