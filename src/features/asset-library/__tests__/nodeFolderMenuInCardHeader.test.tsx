import '@/features/asset-library/worlds/nodes';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EditedPipelineProvider } from '@/features/asset-library/detail/worldSeeds/editing/editedPipelineContext';
import { NodeCardHeader } from '@/features/asset-library/detail/worldSeeds/NodeCardHeader';
import { NodeNotesRows } from '@/features/asset-library/detail/worldSeeds/NodeNotesRows';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import { sanitizePipeline } from '@/features/asset-library/worlds/pipeline/sanitizePipeline';

const store = new PipelineStore(
  sanitizePipeline({
    seed: 1,
    nodes: [
      { id: 'a', type: 'terrainNoise', folder: 'terrain', params: {}, inputs: {} },
      { id: 'b', type: 'slopeField', folder: '', params: {}, inputs: { source: 'a' } },
    ],
  }),
);
const [grouped, ungrouped] = store.nodes();

report(
  'the top row of a grouped card names its folder',
  headerMarkup(grouped!).includes('aria-label="folder: terrain"'),
);
report(
  'the top row of an ungrouped card still offers the folder control',
  headerMarkup(ungrouped!).includes('aria-label="folder: ungrouped"'),
);
report(
  'the folder control is a menu button rather than a text field',
  !headerMarkup(grouped!).includes('<input type="text" list='),
);
report(
  'the notes rows no longer carry a folder field of their own',
  !render(<NodeNotesRows node={grouped!} />).includes('folder'),
);

function headerMarkup(node: Parameters<typeof NodeCardHeader>[0]['node']): string {
  return render(
    <NodeCardHeader node={node} typeTitle="type" collapsed={false} onToggleCollapsed={() => {}} />,
  );
}

function render(element: ReactElement): string {
  return renderToStaticMarkup(
    <EditedPipelineProvider pipeline={{ store, perform: () => ({ ok: true as const, summary: '' }), rendered: false }}>
      {element}
    </EditedPipelineProvider>,
  );
}

function report(name: string, held: boolean): void {
  console.log(`${held ? 'ok  ' : 'FAIL'} ${name}`);
  if (!held) process.exitCode = 1;
}
