import type {
  ReadOnlyCreatureLibrary,
  ReadOnlyTileset,
  ReadOnlyWorld,
} from '../app/readOnlyLibraries';
import type { CreatureSim } from '../creatures/sim/creatureSim';
import type { WorldSampler } from '../procgen/worldSampler';
import type { CaptureTool } from '../world/capture/captureTool';

export interface WorldViewDeps {
  world: ReadOnlyWorld;
  sampler: WorldSampler;
  tileset: ReadOnlyTileset;
  creatures: ReadOnlyCreatureLibrary;
  sim: CreatureSim;
  capture: CaptureTool;
}
