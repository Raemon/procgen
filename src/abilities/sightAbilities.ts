import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  characterViewSize,
  clampSightRadiusTiles,
  sightCostMultiplier,
} from '../world/vision/characterSight';
import { abilityFailed, abilitySucceeded } from './ability';
import { readInt } from './abilityParams';
import { registerAbility } from './abilityRegistry';

registerAbility({
  action: 'set_sight_radius',
  mode: 'character',
  group: 'senses',
  humanControl: 'the sight slider on the character view toolbar',
  description:
    `Set how far you see, in tiles, from ${MIN_CHARACTER_SIGHT_RADIUS_TILES} to ` +
    `${MAX_CHARACTER_SIGHT_RADIUS_TILES} (default ${DEFAULT_CHARACTER_SIGHT_RADIUS_TILES}). ` +
    'A wider radius pushes the fog out and grows the observation grid, so you can plan around ' +
    'terrain you would otherwise have to walk into; it costs you a grid that grows with the ' +
    'square of the radius, and a 2.5D view that must draw everything inside it. Narrow it again ' +
    'when you no longer need the range.',
  params: {
    radius_tiles: {
      kind: 'int',
      help: `how far you see, in tiles (${MIN_CHARACTER_SIGHT_RADIUS_TILES}-${MAX_CHARACTER_SIGHT_RADIUS_TILES}; out-of-range values are clamped)`,
    },
  },
  example: { action: 'set_sight_radius', radius_tiles: 24 },
  changesWorld: false,
  apply: (context, params) => {
    const read = readInt(params, 'radius_tiles');
    if (!read.ok) return read.failure;
    if (!Number.isFinite(read.value)) {
      return abilityFailed('invalid_value', "'radius_tiles' takes a whole number of tiles");
    }
    const radius = clampSightRadiusTiles(read.value);
    context.actor.setSightRadiusTiles(radius);
    return abilitySucceeded(summaryFor(radius, read.value));
  },
});

function summaryFor(radius: number, asked: number): string {
  const clamped =
    radius === asked
      ? ''
      : ` (${asked} was out of range, clamped to ${MIN_CHARACTER_SIGHT_RADIUS_TILES}-${MAX_CHARACTER_SIGHT_RADIUS_TILES})`;
  const size = characterViewSize(radius);
  const cost = sightCostMultiplier(radius).toFixed(1);
  return `sight radius ${radius} tiles${clamped}: a ${size}x${size} grid, ~${cost}x the tiles of the default ${DEFAULT_CHARACTER_SIGHT_RADIUS_TILES}`;
}
