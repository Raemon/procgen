import type { AgentMode } from '../../agent/agentMode';
import { buildObservation } from '../../agent/observation';
import { observationText } from '../../agent/observationText';
import type { WorldSampler } from '../../procgen/worldSampler';
import type { ReadOnlyTileset } from '../../app/readOnlyLibraries';
import type { ReadOnlyWorld } from '../../app/readOnlyLibraries';

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
      buildObservation(this.sampler, this.tileset, pose, this.mode, this.world.sightRadiusTiles),
    );
  }
}
