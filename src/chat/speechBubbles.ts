import { speechBubbleLifetimeMs } from './speechBubbleLifetime';

const MAX_LINES_PER_SPEAKER = 3;

interface SpeechLine {
  text: string;
  expiresAt: number;
}

export class SpeechBubbles {
  private readonly linesBySpeaker = new Map<number, SpeechLine[]>();

  add(entityId: number, text: string): void {
    const lines = this.linesBySpeaker.get(entityId) ?? [];
    lines.push({ text, expiresAt: Date.now() + speechBubbleLifetimeMs(text) });
    this.linesBySpeaker.set(entityId, lines.slice(-MAX_LINES_PER_SPEAKER));
  }

  linesFor(entityId: number): string[] {
    const lines = this.expireStaleLines(entityId);
    return lines.map((line) => line.text);
  }

  speakerIds(): number[] {
    return [...this.linesBySpeaker.keys()];
  }

  retainSpeakers(liveIds: Set<number>): void {
    for (const id of this.speakerIds()) if (!liveIds.has(id)) this.linesBySpeaker.delete(id);
  }

  clear(): void {
    this.linesBySpeaker.clear();
  }

  private expireStaleLines(entityId: number): SpeechLine[] {
    const lines = this.linesBySpeaker.get(entityId);
    if (!lines) return [];
    const now = Date.now();
    const live = lines.filter((line) => line.expiresAt > now);
    if (live.length === 0) this.linesBySpeaker.delete(entityId);
    else if (live.length !== lines.length) this.linesBySpeaker.set(entityId, live);
    return live;
  }
}
