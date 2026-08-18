import type { ReadOnlyWorld } from '@/features/app-shell/runtime/readOnlyAssets';
import type { EntityKind } from './protocol';
import type { RemotePlayers } from './remotePlayers';

export interface CharacterListing {
  id: number;
  name: string;
  kind: EntityKind;
  x: number;
  y: number;
  isSelf: boolean;
}

export function charactersInPlay(
  world: ReadOnlyWorld,
  remote: RemotePlayers,
): CharacterListing[] {
  const listings: CharacterListing[] = [
    {
      id: remote.selfId,
      name: 'you',
      kind: 'player',
      x: world.playerX,
      y: world.playerY,
      isSelf: true,
    },
  ];
  for (const entity of remote.others()) {
    listings.push({
      id: entity.id,
      name: entity.name,
      kind: entity.kind,
      x: entity.x,
      y: entity.y,
      isSelf: false,
    });
  }
  return listings;
}

export function characterWithId(
  world: ReadOnlyWorld,
  remote: RemotePlayers,
  id: number,
): CharacterListing | null {
  return charactersInPlay(world, remote).find((listing) => listing.id === id) ?? null;
}

export function characterNamed(
  world: ReadOnlyWorld,
  remote: RemotePlayers,
  name: string,
): CharacterListing | null {
  return charactersInPlay(world, remote).find((listing) => listing.name === name) ?? null;
}

export function tilesBetween(from: CharacterListing, to: CharacterListing): number {
  return Math.round(Math.hypot(to.x - from.x, to.y - from.y));
}
