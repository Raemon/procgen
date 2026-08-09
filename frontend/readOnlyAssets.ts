import type { CreatureAssets } from '../assets/creatures/creatureAssets';
import type { ItemAssets } from '../assets/items/itemAssets';
import type { CultureAssets } from '../assets/cultures/cultureAssets';
import type { PieceAssets } from '../assets/pieces/pieceAssets';
import type { PipelineStore } from '../procgen/pipeline/pipelineStore';
import type { RunningWorld } from '../procgen/presets/runningWorld';
import type { WorldPresetLibrary } from '../procgen/presets/worldPresetLibrary';
import type { WorldShelf } from '../procgen/presets/worldShelf';
import type { TemplateLibrary } from '../procgen/templates/templateLibrary';
import type { TileAssets } from '../assets/tiles/tileAssets';
import type { World } from '../world/world';

export type ReadOnlyPipelineStore = Pick<
  PipelineStore,
  'seed' | 'daylight' | 'nodes' | 'nodeById' | 'onChange'
>;
export type ReadOnlyTileAssets = Pick<TileAssets, 'all' | 'byId' | 'byRole' | 'idForRole' | 'onChange'>;
export type ReadOnlyPieceAssets = Pick<
  PieceAssets,
  'all' | 'byId' | 'largestFootprint' | 'onChange' | 'onPieceAdded'
>;
export type ReadOnlyCultureAssets = Pick<CultureAssets, 'all' | 'byId' | 'onChange'>;
export type ReadOnlyCreatureAssets = Pick<CreatureAssets, 'all' | 'byId' | 'onChange'>;
export type ReadOnlyItemAssets = Pick<ItemAssets, 'all' | 'byId' | 'onChange'>;
export type ReadOnlyTemplateLibrary = Pick<
  TemplateLibrary,
  'builtIn' | 'savedTemplates' | 'all' | 'byName' | 'onChange'
>;
export type ReadOnlyWorldPresetLibrary = Pick<
  WorldPresetLibrary,
  'savedPresets' | 'byName' | 'onChange'
>;
export type ReadOnlyWorldShelf = Pick<WorldShelf, 'all' | 'byName' | 'onChange'>;
export type ReadOnlyRunningWorld = Pick<RunningWorld, 'name' | 'onChange'>;
export type ReadOnlyWorld = Pick<
  World,
  'playerX' | 'playerY' | 'facing' | 'sightRadiusTiles' | 'on'
>;
