import { creaturesAsStoredJson } from '../../assets/creatures/creatureStorage';
import { itemsAsStoredJson } from '../../assets/items/itemStorage';
import { tilesAsStoredJson } from '../../assets/tiles/tileStorage';
import {
  assembleServerWorld,
  freshWorldState,
  type CarriedWorldState,
  type ServerWorld,
} from './serverWorld';
import { serverWorldAssetsFromStoredJson } from './serverWorldAssets';

export interface DocSource {
  read(name: string): unknown;
  stamp(): string;
}

export interface DocSink {
  write(name: string, json: unknown): void;
}

export function persistWorld(docs: DocSink, world: ServerWorld): void {
  docs.write('pipeline', world.store.snapshot());
  docs.write('tiles', tilesAsStoredJson(world.tileAssets.all()));
  docs.write('pieces', world.pieces.all());
  docs.write('cultures', world.cultures.all());
  docs.write('creatures', creaturesAsStoredJson(world.creatures.all()));
  docs.write('items', itemsAsStoredJson(world.items.all()));
  docs.write('templates', world.templates.savedTemplates());
  docs.write('worldPresets', world.worldPresets.savedPresets());
}

export function currentServerWorld(docs: DocSource, previous: ServerWorld | null): ServerWorld {
  const stamp = docs.stamp();
  if (previous && previous.stamp === stamp) return previous;
  return assembleServerWorld(
    stamp,
    serverWorldAssetsFromStoredJson((name) => docs.read(name)),
    carriedForward(previous),
  );
}

function carriedForward(previous: ServerWorld | null): CarriedWorldState {
  if (!previous) return freshWorldState();
  return {
    randomizeHistory: previous.randomizeHistory,
    takenItems: previous.takenItems,
    puzzleState: previous.puzzles.state,
  };
}
