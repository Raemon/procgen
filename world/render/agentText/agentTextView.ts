import type { AgentMode } from '../../../agents/agentMode';
import { buildObservation, type ObservedOverlay } from '../../../agents/observation';
import { observationText } from '../../../agents/observationText';
import { measureWork } from '../../../perf/workTimers';
import type { WorldSampler } from '../../../procgen/worldSampler';
import type { ReadOnlyTileset } from '../../../frontend/readOnlyLibraries';
import type { ReadOnlyWorld } from '../../../frontend/readOnlyLibraries';

const AGENT_TEXT_CLASSES =
  'absolute inset-0 m-0 overflow-auto whitespace-pre p-4 font-mono text-[13px] leading-[1.15] text-emerald-100/90';

export class AgentTextView {
  private readonly pre = document.createElement('pre');

  constructor(
    container: HTMLElement,
    private readonly world: ReadOnlyWorld,
    private readonly sampler: WorldSampler,
    private readonly tileset: ReadOnlyTileset,
    private readonly mode: AgentMode,
    private readonly puzzles: ObservedOverlay,
  ) {
    this.pre.className = AGENT_TEXT_CLASSES;
    container.appendChild(this.pre);
  }

  dispose(): void {
    this.pre.remove();
  }

  draw(): void {
    this.pre.textContent = measureWork('ascii view', () => this.observationLines());
  }

  private observationLines(): string {
    const pose = { x: this.world.playerX, y: this.world.playerY, facing: this.world.facing };
    return observationText(
      buildObservation(
        this.sampler,
        this.tileset,
        pose,
        this.mode,
        this.world.sightRadiusTiles,
        this.puzzles,
      ),
    );
  }
}
