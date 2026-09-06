import type { Marker, WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import { EMPTY_TILE } from '@/features/asset-library/worlds/values/chunkValues';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import { isWithinCharacterSight, isWithinSightRadius } from '@/features/game/vision/characterSight';
import { seesAllAround, seesTheWholeWindow, type AgentMode, type AgentPose } from './agentMode';

export const SELF_GLYPH = '@';
export const BLANK_GLYPH = ' ';
export const UNKNOWN_TILE_GLYPH = '?';

export interface ObservedTile {
  glyph: string;
  meaning: string;
  walkable: boolean | null;
}

export function agentCanSee(
  mode: AgentMode,
  pose: AgentPose,
  sightRadiusTiles: number,
  x: number,
  y: number,
): boolean {
  if (x === pose.x && y === pose.y) return true;
  if (seesTheWholeWindow(mode)) return true;
  if (seesAllAround(mode)) return isWithinSightRadius(x - pose.x, y - pose.y, sightRadiusTiles);
  return isWithinCharacterSight(pose.facing, x - pose.x, y - pose.y, sightRadiusTiles);
}

export function observedTileAt(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  markers: Map<string, Marker>,
  pose: AgentPose,
  mode: AgentMode,
  sightRadiusTiles: number,
  x: number,
  y: number,
): ObservedTile {
  if (x === pose.x && y === pose.y) return { glyph: SELF_GLYPH, meaning: 'you', walkable: null };
  if (!agentCanSee(mode, pose, sightRadiusTiles, x, y)) return unseenTile(mode, sightRadiusTiles);
  const marker = markers.get(`${x},${y}`);
  if (marker) return { glyph: marker.glyph, meaning: marker.tag, walkable: null };
  return observedGroundAt(sampler, tileAssets, x, y);
}

export function unseenTile(mode: AgentMode, sightRadiusTiles: number): ObservedTile {
  return { glyph: BLANK_GLYPH, meaning: `unseen: ${whyItIsUnseen(mode, sightRadiusTiles)}`, walkable: null };
}

export function whyItIsUnseen(mode: AgentMode, sightRadiusTiles: number): string {
  if (seesAllAround(mode)) {
    return `past your ${sightRadiusTiles}-tile sight radius, or behind tall ground, a wall or a ridge above you`;
  }
  return `behind you, past your ${sightRadiusTiles}-tile sight radius (fog), or hidden behind tall ground or a ridge above you`;
}

export function rememberedGroundAt(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  x: number,
  y: number,
): ObservedTile {
  const ground = observedGroundAt(sampler, tileAssets, x, y);
  if (ground.glyph === BLANK_GLYPH) return ground;
  return { ...ground, meaning: `${ground.meaning} (remembered, not in sight now)` };
}

function observedGroundAt(
  sampler: WorldSampler,
  tileAssets: ReadOnlyTileAssets,
  x: number,
  y: number,
): ObservedTile {
  const tileId = sampler.tileAt(x, y);
  if (tileId === EMPTY_TILE) {
    return { glyph: BLANK_GLYPH, meaning: 'nothing generated here', walkable: null };
  }
  const tile = tileAssets.byId(tileId);
  if (!tile) return { glyph: UNKNOWN_TILE_GLYPH, meaning: 'unrecognized tile', walkable: null };
  return { glyph: tile.symbol, meaning: tile.name, walkable: tile.walkable };
}
