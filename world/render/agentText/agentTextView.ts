import type { AgentMode } from '../../../agents/agentMode';
import { buildObservation } from '../../../agents/observation';
import { observationText } from '../../../agents/observationText';
import type { WorldSampler } from '../../../procgen/worldSampler';
import type { ReadOnlyTileAssets } from '../../../frontend/readOnlyAssets';
import type { ReadOnlyWorld } from '../../../frontend/readOnlyAssets';
import type { MarkerSource } from '../markerSource';

const AGENT_TEXT_CLASSES =
  'absolute inset-0 m-0 overflow-auto whitespace-pre p-4 font-mono text-[13px] leading-[1.15] text-emerald-100/90';

export class AgentTextView {
  private readonly pre = document.createElement('pre');

  constructor(
    container: HTMLElement,
    private readonly world: ReadOnlyWorld,
    private readonly sampler: WorldSampler,
    private readonly tileAssets: ReadOnlyTileAssets,
    private readonly mode: AgentMode,
    private readonly puzzles: MarkerSource,
  ) {
    this.pre.className = AGENT_TEXT_CLASSES;
    container.appendChild(this.pre);
  }

  dispose(): void {
    this.pre.remove();
  }

  draw(): void {
    const pose = { x: this.world.playerX, y: this.world.playerY, facing: this.world.facing };
    this.pre.textContent = observationText(
      buildObservation(
        this.sampler,
        this.tileAssets,
        pose,
        this.mode,
        this.world.sightRadiusTiles,
        this.puzzles,
      ),
    );
  }
}
