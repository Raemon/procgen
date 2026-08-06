import { RandomizeHistory } from '../../procgen/randomize/randomizeHistory';
import { addNodeMenu } from './addNodeMenu';
import { nodeCard, refreshCardError } from './nodeCard';
import type { PanelDeps } from './panelDeps';
import { presetsRow } from './presetsRow';
import { randomizeRow } from './randomizeRow';
import { worldSeedRow } from './worldSeedRow';

export class ProcgenPanel {
  private readonly randomizeHistory = new RandomizeHistory();

  constructor(
    private readonly container: HTMLElement,
    private readonly deps: PanelDeps,
  ) {
    this.render();
    deps.store.onChange((change) => {
      if (change === 'structure') this.render();
    });
    deps.tileset.onChange(() => this.render());
  }

  render(): void {
    this.container.innerHTML = '';
    this.container.append(
      panelTitle(),
      worldSeedRow(this.deps.store.seed(), (seed) => this.deps.store.setSeed(seed)),
      presetsRow(this.deps.store),
      randomizeRow(this.deps, this.randomizeHistory),
      this.nodeList(),
      addNodeMenu((type) => this.deps.store.addNode(type)),
      pipelineHint(),
    );
  }

  refreshErrors(): void {
    for (const card of this.container.querySelectorAll<HTMLElement>('.node-card')) {
      const nodeId = card.dataset.nodeId;
      if (nodeId) refreshCardError(card, this.deps.evaluator.errorFor(nodeId));
    }
  }

  private nodeList(): HTMLElement {
    const list = document.createElement('div');
    list.className = 'pipeline-nodes';
    for (const node of this.deps.store.nodes()) list.appendChild(nodeCard(this.deps, node));
    if (this.deps.store.nodes().length === 0) list.appendChild(emptyPipelineNote());
    return list;
  }
}

function panelTitle(): HTMLElement {
  const title = document.createElement('h2');
  title.textContent = 'procgen';
  return title;
}

function emptyPipelineNote(): HTMLElement {
  const note = document.createElement('p');
  note.className = 'hint';
  note.textContent = 'Blank world. Add a node to start generating, or load an example.';
  return note;
}

function pipelineHint(): HTMLElement {
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent =
    'Nodes run top to bottom. Wire inputs (←) to earlier nodes. Display maps a node into the world: tile layers stack in list order, elevation shapes the 2.5D ground, markers draw tagged points.';
  return hint;
}
