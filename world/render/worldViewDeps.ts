import type {
  ReadOnlyCreatureLibrary,
  ReadOnlyItemLibrary,
  ReadOnlyPipelineStore,
  ReadOnlyTileset,
  ReadOnlyWorld,
} from '../../frontend/readOnlyLibraries';
import type { SpeechBubbles } from '../chat/speechBubbles';
import type { CreatureSim } from '../creatureSim/creatureSim';
import type { RemotePlayers } from '../../multiplayer/client/remotePlayers';
import type { WorldSampler } from '../../procgen/worldSampler';
import type { CaptureTool } from '../capture/captureTool';
import type { MarkerSource } from './markerSource';

export interface WorldViewDeps {
  world: ReadOnlyWorld;
  sampler: WorldSampler;
  puzzles: MarkerSource;
  store: ReadOnlyPipelineStore;
  tileset: ReadOnlyTileset;
  creatures: ReadOnlyCreatureLibrary;
  items: ReadOnlyItemLibrary;
  sim: CreatureSim;
  capture: CaptureTool;
  remotePlayers: RemotePlayers;
  speech: SpeechBubbles;
}
