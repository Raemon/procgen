import type { ExamplePipeline } from './examplePipelines';
import type { TooltipContent } from '../../../ui/tooltips/tooltipContent';

export function examplesTooltip(examples: ExamplePipeline[]): TooltipContent {
  return {
    title: 'examples',
    body: 'Ready-made pipelines that replace the current one. Each node in them carries a note explaining why it is set up that way.',
    options: examples.map((example) => ({ name: example.name, meaning: example.description })),
  };
}
