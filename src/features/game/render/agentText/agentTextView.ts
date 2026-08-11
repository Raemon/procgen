import type { AgentMode } from '../../../agents/agentMode';
import {
  buildObservation,
  type AgentObservation,
  type ObservedOverlay,
} from '../../../agents/observation';
import { observationText } from '../../../agents/observationText';
import { measureWork } from '../../performance/workTimers';
import type { WorldSampler } from '@/features/asset-library/worlds/worldSampler';
import type { ReadOnlyTileAssets } from '@/features/app-shell/runtime/readOnlyAssets';
import type { ReadOnlyWorld } from '@/features/app-shell/runtime/readOnlyAssets';
import type { HoveredCell, HoveredTile } from '../../hover/hoveredTile';
import { listenForTileHover } from '../../hover/listenForTileHover';
import { monospaceCellSize, type MonospaceCellSize } from './monospaceCellSize';
import { worldCellOfObservationGridCell } from './observationGridCell';
import { textGridCellUnderPointer } from './textGridCellUnderPointer';

const AGENT_TEXT_CLASSES =
  'absolute inset-0 m-0 overflow-auto whitespace-pre p-4 font-mono text-[13px] leading-[1.15] text-emerald-100/90';

export class AgentTextView {
  private readonly pre = document.createElement('pre');
  private drawnObservation: AgentObservation | null = null;
  private cellSize: MonospaceCellSize | null = null;

  constructor(
    container: HTMLElement,
    private readonly world: ReadOnlyWorld,
    private readonly sampler: WorldSampler,
    private readonly tileAssets: ReadOnlyTileAssets,
    private readonly mode: AgentMode,
    private readonly puzzles: ObservedOverlay,
    hoveredTile: HoveredTile,
  ) {
    this.pre.className = AGENT_TEXT_CLASSES;
    container.appendChild(this.pre);
    listenForTileHover(this.pre, hoveredTile, (x, y) => this.cellAtPixel(x, y));
  }

  dispose(): void {
    this.pre.remove();
  }

  draw(): void {
    this.pre.textContent = measureWork('ascii view', () => this.textOfWhatIsDrawn());
  }

  private textOfWhatIsDrawn(): string {
    this.drawnObservation = this.currentObservation();
    return observationText(this.drawnObservation);
  }

  private cellAtPixel(offsetX: number, offsetY: number): HoveredCell | null {
    const observation = this.drawnObservation;
    const cellSize = this.measuredCellSize();
    if (!observation || !cellSize) return null;
    return worldCellOfObservationGridCell(
      observation,
      textGridCellUnderPointer(this.pre, cellSize, offsetX, offsetY),
    );
  }

  private measuredCellSize(): MonospaceCellSize | null {
    this.cellSize ??= monospaceCellSize(this.pre);
    return this.cellSize;
  }

  private currentObservation(): AgentObservation {
    const pose = { x: this.world.playerX, y: this.world.playerY, facing: this.world.facing };
    return buildObservation(
      this.sampler,
      this.tileAssets,
      pose,
      this.mode,
      this.world.sightRadiusTiles,
      this.puzzles,
    );
  }
}
