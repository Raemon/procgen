import type { AssetFolders } from '@/features/asset-library/folders/assetFolders';
import type { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import type { ItemAssets } from '@/features/asset-library/items/itemAssets';
import type { CultureAssets } from '@/features/asset-library/cultures/cultureAssets';
import type { PieceAssets } from '@/features/asset-library/pieces/pieceAssets';
import type { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import type { RunningWorld } from '@/features/asset-library/worlds/running/runningWorld';
import type { WorldSeedLibrary } from '@/features/asset-library/worlds/seeds/worldSeedLibrary';
import type { WorldSeedShelf } from '@/features/asset-library/worlds/seeds/worldSeedShelf';
import type { SavedWorldLibrary } from '@/features/asset-library/worlds/saved/savedWorldLibrary';
import type { TemplateLibrary } from '@/features/asset-library/node-groups/templateLibrary';
import type { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import type { World } from '@/features/game/world';

export type ReadOnlyPipelineStore = Pick<
  PipelineStore,
  'seed' | 'daylight' | 'time' | 'nodes' | 'nodeById' | 'onChange'
>;
export type ReadOnlyTileAssets = Pick<TileAssets, 'all' | 'byId' | 'byRole' | 'idForRole' | 'onChange'>;
export type ReadOnlyPieceAssets = Pick<
  PieceAssets,
  'all' | 'byId' | 'largestFootprint' | 'onChange' | 'onPieceAdded'
>;
export type ReadOnlyCultureAssets = Pick<CultureAssets, 'all' | 'byId' | 'onChange'>;
export type ReadOnlyCreatureAssets = Pick<CreatureAssets, 'all' | 'byId' | 'onChange'>;
export type ReadOnlyItemAssets = Pick<ItemAssets, 'all' | 'byId' | 'onChange'>;
export type ReadOnlyAssetFolders = Pick<
  AssetFolders,
  'all' | 'byId' | 'inSection' | 'childrenOf' | 'folderOf' | 'keysIn' | 'stored' | 'onChange'
>;
export type ReadOnlyTemplateLibrary = Pick<
  TemplateLibrary,
  'builtIn' | 'savedTemplates' | 'all' | 'byName' | 'onChange'
>;
export type ReadOnlyWorldSeedLibrary = Pick<
  WorldSeedLibrary,
  'savedWorldSeeds' | 'byName' | 'onChange'
>;
export type ReadOnlyWorldSeedShelf = Pick<WorldSeedShelf, 'all' | 'byName' | 'onChange'>;
export type ReadOnlyRunningWorld = Pick<
  RunningWorld,
  'ref' | 'name' | 'seedName' | 'savedWorldName' | 'onChange'
>;
export type ReadOnlySavedWorldLibrary = Pick<SavedWorldLibrary, 'all' | 'byName' | 'onChange'>;
export type ReadOnlyWorld = Pick<
  World,
  'playerX' | 'playerY' | 'facing' | 'sightRadiusTiles' | 'on'
>;
