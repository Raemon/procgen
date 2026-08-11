import { pieceFromWorldRegion, regionSize, type WorldRegion } from '@/features/asset-library/pieces/captureRegionAsPiece';
import { withCenteredAnchor } from '@/features/asset-library/pieces/pieceDef';
import {
  commandSucceeded,
  type CommandContext,
  type CommandResult,
} from '@/features/app-shell/runtime/commands/command';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';
import { readInt, readText } from '@/features/app-shell/runtime/commands/commandParams';

const { define, commands: captureCommands } = createCommandCollection();
export { captureCommands };

define({
  action: 'capture_region',
  mode: 'god',
  group: 'world',
  humanControl: 'game view: the capture button, then drag a rectangle',
  description: 'Lift a rectangle of the running world into a new Asset Library piece.',
  params: {
    min_x: { kind: 'int', help: 'west edge of the rectangle, in world tiles' },
    min_y: { kind: 'int', help: 'north edge of the rectangle, in world tiles' },
    max_x: { kind: 'int', help: 'east edge of the rectangle, in world tiles' },
    max_y: { kind: 'int', help: 'south edge of the rectangle, in world tiles' },
    name: { kind: 'text', help: 'a name for the captured piece', optional: true },
  },
  example: { action: 'capture_region', min_x: -4, min_y: -4, max_x: 4, max_y: 4 },
  changesWorld: true,
  apply: captureRegion,
});

function captureRegion(context: CommandContext, params: Record<string, unknown>): CommandResult {
  const region = regionFrom(params);
  if (!region.ok) return region.failure;
  const name = readText(params, 'name');
  const captured = pieceFromWorldRegion(
    context.regionSampler,
    region.value,
    name.ok ? name.value : capturedName(region.value),
  );
  const added = context.pieces.insert(withCenteredAnchor({ ...captured, id: 0 }));
  const { width, depth } = regionSize(region.value);
  return commandSucceeded(`captured ${width}×${depth} into piece ${added.id} ('${added.name}')`);
}

type RegionRead = { ok: true; value: WorldRegion } | { ok: false; failure: CommandResult };

function regionFrom(params: Record<string, unknown>): RegionRead {
  const minX = readInt(params, 'min_x');
  if (!minX.ok) return minX;
  const minY = readInt(params, 'min_y');
  if (!minY.ok) return minY;
  const maxX = readInt(params, 'max_x');
  if (!maxX.ok) return maxX;
  const maxY = readInt(params, 'max_y');
  if (!maxY.ok) return maxY;
  return {
    ok: true,
    value: {
      minX: Math.min(minX.value, maxX.value),
      minY: Math.min(minY.value, maxY.value),
      maxX: Math.max(minX.value, maxX.value),
      maxY: Math.max(minY.value, maxY.value),
    },
  };
}

function capturedName(region: WorldRegion): string {
  return `capture ${region.minX},${region.minY}`;
}
