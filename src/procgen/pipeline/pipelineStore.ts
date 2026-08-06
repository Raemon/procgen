import { defaultBindingForKind, type DisplayBinding } from '../display/displayBinding';
import { nodeTypeOf } from '../nodeRegistry';
import { outputKindOf, type ParamValue } from '../nodeType';
import { createNodeInstance, nextNodeId } from './createNodeInstance';
import { nodeIndexById, type NodeInstance, type PipelineState } from './pipelineState';
import { dropInvalidWires, isWireValid } from './wiringRules';

export type PipelineChange = 'structure' | 'values';
export type PipelineListener = (change: PipelineChange) => void;

export class PipelineStore {
  private readonly listeners = new Set<PipelineListener>();

  constructor(private state: PipelineState) {}

  snapshot(): PipelineState {
    return this.state;
  }

  seed(): number {
    return this.state.seed;
  }

  nodes(): readonly NodeInstance[] {
    return this.state.nodes;
  }

  nodeById(nodeId: string): NodeInstance | undefined {
    return this.state.nodes[nodeIndexById(this.state, nodeId)];
  }

  onChange(listener: PipelineListener): void {
    this.listeners.add(listener);
  }

  setSeed(seed: number): void {
    this.state.seed = Math.round(seed);
    this.emit('values');
  }

  replaceAll(state: PipelineState): void {
    this.state = state;
    this.emit('structure');
  }

  addNode(type: string): NodeInstance | null {
    const def = nodeTypeOf(type);
    if (!def) return null;
    const node = createNodeInstance(def, nextNodeId(this.state));
    this.state.nodes.push(node);
    this.emit('structure');
    return node;
  }

  removeNode(nodeId: string): void {
    this.state.nodes = this.state.nodes.filter((node) => node.id !== nodeId);
    this.clearWiresTo(nodeId);
    this.emit('structure');
  }

  moveNode(nodeId: string, delta: -1 | 1): void {
    const index = nodeIndexById(this.state, nodeId);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= this.state.nodes.length) return;
    const [node] = this.state.nodes.splice(index, 1);
    this.state.nodes.splice(target, 0, node!);
    dropInvalidWires(this.state);
    this.emit('structure');
  }

  setEnabled(nodeId: string, enabled: boolean): void {
    this.updateNode(nodeId, 'values', (node) => {
      node.enabled = enabled;
    });
  }

  setLabel(nodeId: string, label: string): void {
    this.updateNode(nodeId, 'values', (node) => {
      node.label = label;
    });
  }

  setComment(nodeId: string, comment: string): void {
    this.updateNode(nodeId, 'values', (node) => {
      node.comment = comment;
    });
  }

  setParam(nodeId: string, name: string, value: ParamValue): void {
    const node = this.nodeById(nodeId);
    const def = node && nodeTypeOf(node.type);
    if (!node || !def) return;
    const kindBefore = outputKindOf(def, node.params);
    node.params[name] = value;
    const kindAfter = outputKindOf(def, node.params);
    if (kindBefore === kindAfter) {
      this.emit('values');
      return;
    }
    node.display = defaultBindingForKind(kindAfter);
    dropInvalidWires(this.state);
    this.emit('structure');
  }

  wireInput(nodeId: string, inputName: string, sourceId: string | null): void {
    const node = this.nodeById(nodeId);
    const def = node && nodeTypeOf(node.type);
    const spec = def?.inputs[inputName];
    if (!node || !spec) return;
    const nodeIndex = nodeIndexById(this.state, nodeId);
    if (sourceId && !isWireValid(this.state, nodeIndex, spec, sourceId)) return;
    node.inputs[inputName] = sourceId;
    this.emit('structure');
  }

  setDisplay(nodeId: string, binding: DisplayBinding): void {
    this.updateNode(nodeId, 'structure', (node) => {
      node.display = binding;
    });
  }

  patchDisplay(nodeId: string, patch: Partial<DisplayBinding>): void {
    this.updateNode(nodeId, 'values', (node) => {
      node.display = { ...node.display, ...patch } as DisplayBinding;
    });
  }

  private clearWiresTo(removedId: string): void {
    for (const node of this.state.nodes) {
      for (const name of Object.keys(node.inputs)) {
        if (node.inputs[name] === removedId) node.inputs[name] = null;
      }
    }
  }

  private updateNode(
    nodeId: string,
    change: PipelineChange,
    mutate: (node: NodeInstance) => void,
  ): void {
    const node = this.nodeById(nodeId);
    if (!node) return;
    mutate(node);
    this.emit(change);
  }

  private emit(change: PipelineChange): void {
    for (const listener of this.listeners) listener(change);
  }
}
