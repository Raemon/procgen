import type { CreatureLibrary } from '../creatures/creatureLibrary';
import type { ItemLibrary } from '../items/itemLibrary';
import type { PrefabLibrary } from '../prefabs/prefabLibrary';
import type { PipelineStore } from '../procgen/pipeline/pipelineStore';
import type { WorldPresetLibrary } from '../procgen/presets/worldPresetLibrary';
import type { TemplateLibrary } from '../procgen/templates/templateLibrary';
import type { Tileset } from '../world/tiles/tileset';
import type { World } from '../world/world';

export type ReadOnlyPipelineStore = Pick<
  PipelineStore,
  'seed' | 'daylight' | 'nodes' | 'nodeById' | 'onChange'
>;
export type ReadOnlyTileset = Pick<Tileset, 'all' | 'byId' | 'byRole' | 'idForRole' | 'onChange'>;
export type ReadOnlyPrefabLibrary = Pick<
  PrefabLibrary,
  'all' | 'byId' | 'largestFootprint' | 'onChange' | 'onPrefabAdded'
>;
export type ReadOnlyCreatureLibrary = Pick<CreatureLibrary, 'all' | 'byId' | 'onChange'>;
export type ReadOnlyItemLibrary = Pick<ItemLibrary, 'all' | 'byId' | 'onChange'>;
export type ReadOnlyTemplateLibrary = Pick<
  TemplateLibrary,
  'builtIn' | 'savedTemplates' | 'all' | 'byName' | 'onChange'
>;
export type ReadOnlyWorldPresetLibrary = Pick<
  WorldPresetLibrary,
  'savedPresets' | 'byName' | 'onChange'
>;
export type ReadOnlyWorld = Pick<
  World,
  'playerX' | 'playerY' | 'facing' | 'sightRadiusTiles' | 'on'
>;
