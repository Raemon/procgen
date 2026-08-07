import type { ExamplePipeline } from '../../presets/examplePipelines';
import type { WorldPreset } from '../../presets/worldPreset';
import type { TooltipContent } from '../../../frontend/tooltips/tooltipContent';

export function presetsTooltip(
  examples: ExamplePipeline[],
  saved: readonly WorldPreset[],
): TooltipContent {
  return {
    title: 'presets',
    body: 'Ready-made pipelines that replace the current one, plus your own saves. The save button keeps the whole node combo — every node, knob, wire and the seed — under a name of your choosing.',
    options: [...exampleOptions(examples), ...savedOptions(saved)],
  };
}

function exampleOptions(examples: ExamplePipeline[]): { name: string; meaning: string }[] {
  return examples.map((example) => ({ name: example.name, meaning: example.description }));
}

function savedOptions(saved: readonly WorldPreset[]): { name: string; meaning: string }[] {
  return saved.map((preset) => ({
    name: `★ ${preset.name}`,
    meaning: preset.description || 'one of your saved pipelines',
  }));
}
