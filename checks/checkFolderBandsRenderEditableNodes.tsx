import '../procgen/nodes';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AppRuntime } from '../frontend/appRuntime';
import { AppRuntimeProvider } from '../frontend/appRuntimeContext';
import { TileAssets } from '../assets/tiles/tileAssets';
import { EditedPipelineProvider } from '../procgen/panel/editing/editedPipelineContext';
import { NodeList } from '../procgen/panel/NodeList';
import { PipelineStore } from '../procgen/pipeline/pipelineStore';
import { sanitizePipeline } from '../procgen/pipeline/sanitizePipeline';

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
