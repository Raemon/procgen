import type {
  ReadOnlyCreatureLibrary,
  ReadOnlyItemLibrary,
  ReadOnlyPipelineStore,
  ReadOnlyTileset,
  ReadOnlyWorld,
} from '../app/readOnlyLibraries';
import type { SpeechBubbles } from '../chat/speechBubbles';
import type { CreatureSim } from '../creatures/sim/creatureSim';
import type { RemotePlayers } from '../net/remotePlayers';
import type { WorldSampler } from '../procgen/worldSampler';
import type { CaptureTool } from '../world/capture/captureTool';

export interface WorldViewDeps {
  world: ReadOnlyWorld;
  sampler: WorldSampler;
  store: ReadOnlyPipelineStore;
  tileset: ReadOnlyTileset;
  creatures: ReadOnlyCreatureLibrary;
  items: ReadOnlyItemLibrary;
  sim: CreatureSim;
  capture: CaptureTool;
  remotePlayers: RemotePlayers;
  speech: SpeechBubbles;
}
