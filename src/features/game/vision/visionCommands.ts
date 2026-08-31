import {
  DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  MAX_CHARACTER_SIGHT_RADIUS_TILES,
  MIN_CHARACTER_SIGHT_RADIUS_TILES,
  characterViewSize,
  clampSightRadiusTiles,
  sightCostMultiplier,
} from '@/features/game/vision/characterSight';
import { commandFailed, commandSucceeded } from '@/features/app-shell/runtime/commands/command';
import { readInt } from '@/features/app-shell/runtime/commands/commandParams';
import {
  DEFAULT_GOD_VIEW_SIZE_TILES,
  MAX_GOD_VIEW_SIZE_TILES,
  MIN_GOD_VIEW_SIZE_TILES,
  clampGodViewSizeTiles,
  godViewCostMultiplier,
} from '@/features/game/vision/godViewSize';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';

const { define: registerCommand, commands: visionCommands } = createCommandCollection();
export { visionCommands };



registerCommand({
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
      return commandFailed('invalid_value', "'radius_tiles' takes a whole number of tiles");
    }
    const radius = clampSightRadiusTiles(read.value);
    context.actor.setSightRadiusTiles(radius);
    return commandSucceeded(summaryFor(radius, read.value));
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

registerCommand({
  action: 'set_view_size',
  mode: 'god',
  group: 'senses',
  humanControl: 'the mouse wheel over the agent god view',
  description:
    `Set how much of the world one look hands you, as the width of the square window in tiles, from ` +
    `${MIN_GOD_VIEW_SIZE_TILES} to ${MAX_GOD_VIEW_SIZE_TILES} (default ${DEFAULT_GOD_VIEW_SIZE_TILES}). ` +
    'God mode sees every generated tile in the window, so this is your zoom: widen it to survey a ' +
    'region before you edit it, narrow it to read the tiles around you closely. Even sizes are ' +
    'rounded up to keep you at the center, and the tiles you must read grow with the square of the ' +
    'width, so a wide window costs an autopilot run tokens on every turn.',
  params: {
    view_size_tiles: {
      kind: 'int',
      help: `how wide the window is, in tiles (${MIN_GOD_VIEW_SIZE_TILES}-${MAX_GOD_VIEW_SIZE_TILES}; even sizes round to odd, out-of-range values are clamped)`,
    },
  },
  example: { action: 'set_view_size', view_size_tiles: 65 },
  changesWorld: false,
  apply: (context, params) => {
    const read = readInt(params, 'view_size_tiles');
    if (!read.ok) return read.failure;
    if (!Number.isFinite(read.value)) {
      return commandFailed('invalid_value', "'view_size_tiles' takes a whole number of tiles");
    }
    const size = clampGodViewSizeTiles(read.value);
    context.actor.setGodViewSizeTiles(size);
    return commandSucceeded(viewSizeSummaryFor(size, read.value));
  },
});

function viewSizeSummaryFor(size: number, asked: number): string {
  const clamped =
    size === asked
      ? ''
      : ` (${asked} became ${size}: sizes are odd and clamped to ${MIN_GOD_VIEW_SIZE_TILES}-${MAX_GOD_VIEW_SIZE_TILES})`;
  const cost = godViewCostMultiplier(size).toFixed(1);
  return `view size ${size} tiles${clamped}: a ${size}x${size} grid, ~${cost}x the tiles of the default ${DEFAULT_GOD_VIEW_SIZE_TILES}`;
}
