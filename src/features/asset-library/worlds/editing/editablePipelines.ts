import { debounce } from '@/features/app-shell/runtime/debounce';
import type { PipelineState } from '../pipeline/pipelineState';
import { PipelineStore } from '../pipeline/pipelineStore';
import { sanitizePipeline } from '../pipeline/sanitizePipeline';
import type { RunningWorld } from '../presets/runningWorld';
import type { WorldPreset } from '../presets/worldPreset';
import type { NodeTemplate } from '@/features/asset-library/node-groups/nodeTemplate';
import type { EditedPipeline, PerformOnStore } from './editedPipeline';

const WRITE_BACK_DEBOUNCE_MS = 300;

export interface PipelineSources {
  performOn: PerformOnStore;
  runningPipeline: EditedPipeline;
  runningWorld: RunningWorld;
  worldNamed(name: string): WorldPreset | undefined;
  groupNamed(name: string): NodeTemplate | undefined;
}

export class EditablePipelines {
  private readonly documents = new Map<string, EditedPipeline>();

  constructor(private readonly sources: PipelineSources) {}

  world(name: string): EditedPipeline | null {
    if (this.sources.runningWorld.name() === name) {
      this.documents.delete(worldDocumentKey(name));
      return this.sources.runningPipeline;
    }
    const world = this.sources.worldNamed(name);
    if (!world) return this.forget(worldDocumentKey(name));
    return this.documentOf(worldDocumentKey(name), sanitizePipeline(structuredClone(world.state)), (store) =>
      this.sources.performOn(store, 'save_preset', { name }),
    );
  }

  group(name: string): EditedPipeline | null {
    const group = this.sources.groupNamed(name);
    if (!group) return this.forget(groupDocumentKey(name));
    return this.documentOf(
      groupDocumentKey(name),
      sanitizePipeline({ nodes: structuredClone(group.nodes) }),
      (store) =>
        this.sources.performOn(store, 'save_template', {
          name,
          node_ids: store.nodes().map((node) => node.id),
        }),
    );
  }

  private documentOf(
    key: string,
    openWith: PipelineState,
    writeBack: (store: PipelineStore) => void,
  ): EditedPipeline {
    const alreadyOpen = this.documents.get(key);
    if (alreadyOpen) return alreadyOpen;
    const opened = editedDocument(openWith, writeBack, this.sources.performOn);
    this.documents.set(key, opened);
    return opened;
  }

  private forget(key: string): null {
    this.documents.delete(key);
    return null;
  }
}

function editedDocument(
  state: PipelineState,
  writeBack: (store: PipelineStore) => void,
  performOn: PerformOnStore,
): EditedPipeline {
  const store = new PipelineStore(state);
  const writeBackWhenTypingStops = debounce(() => writeBack(store), WRITE_BACK_DEBOUNCE_MS);
  store.onChange(() => writeBackWhenTypingStops.schedule());
  return {
    store,
    perform: (action, params) => performOn(store, action, params),
    rendered: false,
  };
}

function worldDocumentKey(name: string): string {
  return `world:${name}`;
}

function groupDocumentKey(name: string): string {
  return `group:${name}`;
}
