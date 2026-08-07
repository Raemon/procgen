import * as THREE from 'three';

const BUBBLE_CLASSES =
  'pointer-events-none absolute max-w-[220px] -translate-x-1/2 -translate-y-full rounded-md border border-btn-edge bg-tip/90 px-2 py-1 text-center text-[11px] leading-snug text-ink shadow-[0_4px_14px_rgba(0,0,0,0.55)]';
const OVERLAY_CLASSES = 'pointer-events-none absolute inset-0 overflow-hidden';
const PINNED_CLASSES = `${BUBBLE_CLASSES} left-1/2 bottom-14 translate-y-0`;

export interface SpeechBubbleAnchor {
  speakerId: number;
  lines: string[];
  worldPoint: THREE.Vector3;
}

export class SpeechBubbleLabels {
  private readonly overlay = document.createElement('div');
  private readonly bubbles = new Map<number, HTMLDivElement>();
  private readonly pinned = document.createElement('div');
  private readonly projected = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.overlay.className = OVERLAY_CLASSES;
    this.pinned.className = PINNED_CLASSES;
    this.pinned.style.whiteSpace = 'pre-line';
    this.pinned.hidden = true;
    this.overlay.appendChild(this.pinned);
    container.appendChild(this.overlay);
  }

  dispose(): void {
    this.overlay.remove();
    this.bubbles.clear();
  }

  showAnchored(anchors: SpeechBubbleAnchor[], camera: THREE.Camera): void {
    const live = new Set<number>();
    for (const anchor of anchors) {
      live.add(anchor.speakerId);
      this.placeBubble(anchor, camera);
    }
    for (const [speakerId, bubble] of this.bubbles) {
      if (live.has(speakerId)) continue;
      bubble.remove();
      this.bubbles.delete(speakerId);
    }
  }

  showPinned(lines: string[]): void {
    this.pinned.hidden = lines.length === 0;
    if (lines.length > 0) writeLines(this.pinned, lines);
  }

  private placeBubble(anchor: SpeechBubbleAnchor, camera: THREE.Camera): void {
    const bubble = this.bubbles.get(anchor.speakerId) ?? this.addBubble(anchor.speakerId);
    writeLines(bubble, anchor.lines);
    this.projected.copy(anchor.worldPoint).project(camera);
    const onScreen = this.projected.z < 1 && Math.abs(this.projected.x) < 1.5;
    bubble.hidden = !onScreen;
    if (!onScreen) return;
    bubble.style.left = `${((this.projected.x + 1) / 2) * 100}%`;
    bubble.style.top = `${((1 - this.projected.y) / 2) * 100}%`;
  }

  private addBubble(speakerId: number): HTMLDivElement {
    const bubble = document.createElement('div');
    bubble.className = BUBBLE_CLASSES;
    bubble.style.whiteSpace = 'pre-line';
    this.overlay.appendChild(bubble);
    this.bubbles.set(speakerId, bubble);
    return bubble;
  }
}

function writeLines(bubble: HTMLElement, lines: string[]): void {
  const text = lines.join('\n');
  if (bubble.textContent !== text) bubble.textContent = text;
}
