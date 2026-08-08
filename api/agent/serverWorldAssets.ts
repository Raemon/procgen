import { CreatureAssets } from '../../assets/creatures/creatureAssets';
import { creaturesFromStoredJson } from '../../assets/creatures/creatureStorage';
import { ItemAssets } from '../../assets/items/itemAssets';
import { itemsFromStoredJson } from '../../assets/items/itemStorage';
import { CultureAssets } from '../../assets/cultures/cultureAssets';
import { culturesFromStoredJson } from '../../assets/cultures/cultureStorage';
import { PieceAssets } from '../../assets/pieces/pieceAssets';
import { piecesFromStoredJson } from '../../assets/pieces/pieceStorage';
import { TileAssets } from '../../assets/tiles/tileAssets';
import { tilesFromStoredJson } from '../../assets/tiles/tileStorage';
import { PipelineEvaluator } from '../../procgen/eval/evaluator';
import { PipelineStore } from '../../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../../procgen/pipeline/sanitizePipeline';
import { WorldPresetLibrary } from '../../procgen/presets/worldPresetLibrary';
import { sanitizeWorldPresets } from '../../procgen/presets/worldPreset';
import { TemplateLibrary } from '../../procgen/templates/templateLibrary';
import { sanitizeTemplates } from '../../procgen/templates/nodeTemplate';

export type StoredWorldJson = (name: string) => unknown;

export interface ServerWorldAssets {
  store: PipelineStore;
  evaluator: PipelineEvaluator;
  tileAssets: TileAssets;
  pieces: PieceAssets;
  cultures: CultureAssets;
  creatures: CreatureAssets;
  items: ItemAssets;
  templates: TemplateLibrary;
  worldPresets: WorldPresetLibrary;
}

export function serverWorldAssetsFromStoredJson(read: StoredWorldJson): ServerWorldAssets {
  const store = new PipelineStore(sanitizePipeline(read('pipeline')));
  return {
    store,
    evaluator: new PipelineEvaluator(store),
    tileAssets: new TileAssets(tilesFromStoredJson(read('tiles')) ?? undefined),
    pieces: new PieceAssets(piecesFromStoredJson(read('pieces')) ?? undefined),
    cultures: new CultureAssets(culturesFromStoredJson(read('cultures')) ?? undefined),
    creatures: new CreatureAssets(creaturesFromStoredJson(read('creatures')) ?? undefined),
    items: new ItemAssets(itemsFromStoredJson(read('items')) ?? undefined),
    templates: new TemplateLibrary(sanitizeTemplates(read('templates'))),
    worldPresets: new WorldPresetLibrary(sanitizeWorldPresets(read('worldPresets'))),
  };
}
