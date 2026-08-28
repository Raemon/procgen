import type {
  ReadOnlyCreatureAssets,
  ReadOnlyItemAssets,
  ReadOnlyPipelineStore,
  ReadOnlyTileAssets,
  ReadOnlyWorld,
} from '@/features/app-shell/runtime/readOnlyAssets';
import type { SpeechBubbles } from '../chat/speechBubbles';
import type { LiveCreatureSource } from '../creatureSim/creatureInstance';
import type { RemotePlayers } from '../multiplayer/client/remotePlayers';
import type { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { CameraFocus } from './camera/cameraFocus';
import type { CaptureTool } from '../capture/captureTool';
import type { HoveredTile } from '../hover/hoveredTile';
import type { MarkerSource } from './markerSource';

export interface WorldViewDeps {
  world: ReadOnlyWorld;
  sampler: WorldSampler;
  evaluator: PipelineEvaluator;
  puzzles: MarkerSource;
  store: ReadOnlyPipelineStore;
  tileAssets: ReadOnlyTileAssets;
  creatures: ReadOnlyCreatureAssets;
  items: ReadOnlyItemAssets;
  sim: LiveCreatureSource;
  capture: CaptureTool;
  hoveredTile: HoveredTile;
  remotePlayers: RemotePlayers;
  cameraFocus: CameraFocus;
  speech: SpeechBubbles;
}
