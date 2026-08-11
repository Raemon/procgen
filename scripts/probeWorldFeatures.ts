import '@/features/asset-library/worlds/nodes';
import '@/features/asset-library/worlds/features';
import { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator';
import type { Feature } from '@/features/asset-library/worlds/features/feature';
import { featuresInRect } from '@/features/asset-library/worlds/features/featuresInRect';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';
import { examplePipelines, type ExamplePipeline } from '@/features/asset-library/worlds/presets/examplePipelines';
import type { WorldRect } from '@/features/asset-library/worlds/values/pointsInRect';

const HALF_SPAN = 128;
const SURVEY_RECT: WorldRect = {
  minX: -HALF_SPAN,
  minY: -HALF_SPAN,
  maxX: HALF_SPAN - 1,
  maxY: HALF_SPAN - 1,
};
const ROWS_SHOWN = 10;

for (const preset of examplePipelines()) reportPreset(preset);

function reportPreset(preset: ExamplePipeline): void {
  const features = featuresOfPreset(preset);
  console.log(`\n== ${preset.name}: ${features.length} features in the ${HALF_SPAN * 2}-tile survey ==`);
  console.log(headerRow());
  for (const feature of features.slice(0, ROWS_SHOWN)) console.log(rowOf(feature));
  if (features.length > ROWS_SHOWN) console.log(`  … ${features.length - ROWS_SHOWN} more`);
  reportNodeCounts(features);
}

function featuresOfPreset(preset: ExamplePipeline): Feature[] {
  const store = new PipelineStore(sanitizePipeline(preset.state));
  return featuresInRect(store, new PipelineEvaluator(store), SURVEY_RECT);
}

function headerRow(): string {
  return columns(['key', 'category', 'label', 'rank', 'x,y', 'extent', 'parent', 'links']);
}

function rowOf(feature: Feature): string {
  return columns([
    feature.key,
    feature.category,
    feature.label,
    `${feature.rank}`,
    `${feature.x},${feature.y}`,
    feature.extent ? `${feature.extent.width}x${feature.extent.height}` : '-',
    feature.parentKey ?? '-',
    feature.linkKeys.join(' ') || '-',
  ]);
}

function columns(cells: string[]): string {
  const widths = [26, 12, 14, 5, 12, 8, 22, 8];
  return `  ${cells.map((cell, index) => cell.padEnd(widths[index] ?? 8)).join(' ')}`;
}

function reportNodeCounts(features: Feature[]): void {
  const counts = new Map<string, number>();
  for (const feature of features) {
    const name = `${feature.nodeLabel} (${feature.nodeId})`;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  for (const [name, count] of counts) console.log(`  ${name}: ${count}`);
}
