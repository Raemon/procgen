import type { CreatureLibrary } from '../creatures/creatureLibrary';
import type { CreatureSim } from '../creatures/sim/creatureSim';
import type { RemotePlayers } from '../net/remotePlayers';
import type { WorldSampler } from '../procgen/worldSampler';
import type { CaptureTool } from '../world/capture/captureTool';
import type { Tileset } from '../world/tiles/tileset';
import type { World } from '../world/world';

export interface WorldViewDeps {
  world: World;
  sampler: WorldSampler;
  tileset: Tileset;
  creatures: CreatureLibrary;
  sim: CreatureSim;
  capture: CaptureTool;
  remotePlayers: RemotePlayers;
}
