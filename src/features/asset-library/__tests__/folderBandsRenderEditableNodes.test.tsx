import '@/features/asset-library/worlds/nodes';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AppRuntime } from '@/features/app-shell/runtime/appRuntime';
import { AppRuntimeProvider } from '@/features/app-shell/runtime/appRuntimeContext';
import { TileAssets } from '@/features/asset-library/tiles/tileAssets';
import { EditedPipelineProvider } from '@/features/asset-library/detail/worlds/editing/editedPipelineContext';
import { NodeList } from '@/features/asset-library/detail/worlds/NodeList';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';

const markup = renderToStaticMarkup(
  <AppRuntimeProvider runtime={runtimeShowingTilesAlone()}>
    <EditedPipelineProvider pipeline={pipelineOfOneFolderBand()}>
      <NodeList />
    </EditedPipelineProvider>
  </AppRuntimeProvider>,
);

report('a folder band draws a card for every node it holds', countOf(markup, 'data-node-id=') === 2);
report(
  'each card inside the band carries its own editable label',
  countOf(markup, 'aria-label="node label"') === 2,
);
report(
  'each card inside the band carries its knobs and its enabled toggle',
  countOf(markup, 'aria-label="enabled"') === 2 && markup.includes('type="range"'),
);
report(
  'the band itself is drawn around them, with its name editable',
  countOf(markup, 'aria-label="folder name"') === 1,
);

function pipelineOfOneFolderBand() {
  const store = new PipelineStore(
    sanitizePipeline({
      seed: 1,
      nodes: [
        { id: 'a', type: 'terrainNoise', folder: 'terrain', params: {}, inputs: {} },
        { id: 'b', type: 'slopeField', folder: 'terrain', params: {}, inputs: { source: 'a' } },
      ],
    }),
  );
  return { store, perform: () => ({ ok: true as const, summary: '' }), rendered: false };
}

function runtimeShowingTilesAlone(): AppRuntime {
  return { tileAssets: new TileAssets() } as unknown as AppRuntime;
}

function countOf(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function report(name: string, held: boolean): void {
  console.log(`${held ? 'ok  ' : 'FAIL'} ${name}`);
  if (!held) process.exitCode = 1;
}
