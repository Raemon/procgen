import type { Marker, WorldSampler } from '../procgen/worldSampler';
import { EMPTY_TILE } from '../procgen/values/chunkValues';
import type { ReadOnlyTileAssets } from '../frontend/readOnlyAssets';
import { isWithinCharacterSight } from '../world/vision/characterSight';
import type { AgentMode, AgentPose } from './agentMode';

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
  return (
    mode === 'god' ||
    isWithinCharacterSight(pose.facing, x - pose.x, y - pose.y, sightRadiusTiles)
  );
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
  if (!agentCanSee(mode, pose, sightRadiusTiles, x, y)) return unseenTile(sightRadiusTiles);
  const marker = markers.get(`${x},${y}`);
  if (marker) return { glyph: marker.glyph, meaning: marker.tag, walkable: null };
  return observedGroundAt(sampler, tileAssets, x, y);
}

export function unseenTile(sightRadiusTiles: number): ObservedTile {
  return {
    glyph: BLANK_GLYPH,
    meaning: `unseen: behind you, or past your ${sightRadiusTiles}-tile sight radius (fog)`,
    walkable: null,
  };
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
