import { useEffect, useRef, useState } from 'react';
import { shootGenomeWorld } from '@/features/game/capture/genomeWorldShot';
import { shotKeyOf, WorldShotQueue, type WorldShot } from '@/features/game/capture/worldShotQueue';
import type { WorldGenome } from '../selfPlay/worldGenome';

export const SHOT_SIZE = { width: 480, height: 320 };

let queue: WorldShotQueue | null = null;

export function worldShotQueue(): WorldShotQueue {
  queue ??= new WorldShotQueue((genome) => shootGenomeWorld(genome, SHOT_SIZE));
  return queue;
}

export function useWorldShot(genome: WorldGenome | null): WorldShot | null {
  const [shot, setShot] = useState<WorldShot | null>(null);
  const latest = useRef(genome);
  latest.current = genome;
  const key = genome === null ? null : shotKeyOf(genome);
  useEffect(() => {
    const wanted = latest.current;
    if (wanted === null) return;
    const shots = worldShotQueue();
    setShot(shots.request(wanted));
    return shots.subscribe(() => setShot(shots.shotOf(wanted)));
  }, [key]);
  return shot;
}

export function reshootWorld(genome: WorldGenome): void {
  worldShotQueue().reshoot(genome);
}
