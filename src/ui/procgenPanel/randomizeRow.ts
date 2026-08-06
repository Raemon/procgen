import { mulberry32, type RandomStream } from '../../random/mulberry32';
import type { PipelineState } from '../../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../../procgen/pipeline/sanitizePipeline';
import { permutedNodeCombination } from '../../procgen/randomize/permuteNodeCombination';
import { permutedSliderParams } from '../../procgen/randomize/permuteSliderParams';
import type { RandomizeHistory } from '../../procgen/randomize/randomizeHistory';
import { randomWorldPipeline } from '../../procgen/randomize/randomWorldPipeline';
import type { PanelDeps } from './panelDeps';

type PipelineRoll = (rng: RandomStream, tileIds: readonly number[]) => PipelineState;

export function randomizeRow(deps: PanelDeps, history: RandomizeHistory): HTMLElement {
  const row = document.createElement('div');
  row.className = 'randomize-row';
  row.append(
    rollButton('🎲 world', 'replace the pipeline with a freshly rolled node combination', deps, history, randomWorldPipeline),
    rollButton('~ sliders', 'nudge every numeric parameter of the current nodes', deps, history, (rng) =>
      permutedSliderParams(deps.store.snapshot(), rng),
    ),
    rollButton('⇄ nodes', 'mutate the node combination: swap, add, remove or rewire a node or two', deps, history, (rng, tileIds) =>
      permutedNodeCombination(deps.store.snapshot(), rng, tileIds),
    ),
    undoButton(deps, history),
  );
  return row;
}

function rollButton(
  text: string,
  title: string,
  deps: PanelDeps,
  history: RandomizeHistory,
  roll: PipelineRoll,
): HTMLButtonElement {
  return panelButton(text, title, () => {
    history.remember(deps.store.snapshot());
    deps.store.replaceAll(sanitizePipeline(roll(freshStream(), tileIdsOf(deps))));
  });
}

function undoButton(deps: PanelDeps, history: RandomizeHistory): HTMLButtonElement {
  const button = panelButton('undo', 'restore the pipeline from before the last roll', () => {
    const previous = history.undo();
    if (previous) deps.store.replaceAll(previous);
  });
  button.disabled = !history.canUndo();
  return button;
}

function panelButton(text: string, title: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn';
  button.textContent = text;
  button.title = title;
  button.addEventListener('click', onClick);
  return button;
}

function freshStream(): RandomStream {
  return mulberry32((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
}

function tileIdsOf(deps: PanelDeps): number[] {
  return deps.tileset.all().map((tile) => tile.id);
}
