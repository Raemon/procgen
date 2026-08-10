export type WorldViewSnapshotter = (size: number, use: (dataUrl: string) => void) => void;

let snapshotter: WorldViewSnapshotter | null = null;

export function setWorldViewSnapshotter(next: WorldViewSnapshotter | null): void {
  snapshotter = next;
}

export function requestWorldViewSnapshot(size: number, use: (dataUrl: string) => void): void {
  snapshotter?.(size, use);
}
