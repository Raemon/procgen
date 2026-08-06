import { useAppRuntime } from '../../../app/appRuntimeContext';
import type { AppRuntime } from '../../../app/appRuntime';
import type { PipelineState } from '../../../procgen/pipeline/pipelineState';
import { sanitizePipeline } from '../../../procgen/pipeline/sanitizePipeline';
import { permutedNodeCombination } from './permuteNodeCombination';
import { permutedSliderParams } from './permuteSliderParams';
import type { RandomizeHistory } from './randomizeHistory';
import { randomWorldPipeline } from './recipes/randomWorldPipeline';
import { mulberry32, type RandomStream } from '../../../random/mulberry32';
import { Button } from '../../../ui/controls/Button';

type PipelineRoll = (rng: RandomStream, tileIds: readonly number[]) => PipelineState;

export function RandomizeRow({ history }: { history: RandomizeHistory }) {
  const runtime = useAppRuntime();
  const roll = (rollPipeline: PipelineRoll) => () => applyRoll(runtime, history, rollPipeline);
  return (
    <div className="mb-2 flex gap-1.5">
      <RollButton
        title="replace the pipeline with a freshly rolled node combination"
        onClick={roll(randomWorldPipeline)}
      >
        🎲 world
      </RollButton>
      <RollButton
        title="nudge every numeric parameter of the current nodes"
        onClick={roll((rng) => permutedSliderParams(runtime.store.snapshot(), rng))}
      >
        ~ sliders
      </RollButton>
      <RollButton
        title="mutate the node combination: swap, add, remove or rewire a node or two"
        onClick={roll((rng, tileIds) =>
          permutedNodeCombination(runtime.store.snapshot(), rng, tileIds),
        )}
      >
        ⇄ nodes
      </RollButton>
      <RollButton
        title="restore the pipeline from before the last roll"
        disabled={!history.canUndo()}
        onClick={() => undoRoll(runtime, history)}
      >
        undo
      </RollButton>
    </div>
  );
}

function RollButton({
  title,
  disabled,
  onClick,
  children,
}: {
  title: string;
  disabled?: boolean;
  onClick(): void;
  children: string;
}) {
  return (
    <Button className="flex-1 whitespace-nowrap" title={title} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}

function applyRoll(runtime: AppRuntime, history: RandomizeHistory, roll: PipelineRoll): void {
  history.remember(runtime.store.snapshot());
  runtime.store.replaceAll(sanitizePipeline(roll(freshStream(), tileIdsOf(runtime))));
}

function undoRoll(runtime: AppRuntime, history: RandomizeHistory): void {
  const previous = history.undo();
  if (previous) runtime.store.replaceAll(previous);
}

function freshStream(): RandomStream {
  return mulberry32((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
}

function tileIdsOf(runtime: AppRuntime): number[] {
  return runtime.tileset.all().map((tile) => tile.id);
}
