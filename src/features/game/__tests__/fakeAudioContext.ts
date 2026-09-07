export type ParamChange = 'set' | 'linear' | 'exponential';

export interface ParamEvent {
  param: string;
  change: ParamChange;
  value: number;
  at: number;
}

export type FakeNodeKind =
  | 'gain'
  | 'oscillator'
  | 'buffer-source'
  | 'filter'
  | 'convolver'
  | 'destination';

export interface FakeNode {
  id: number;
  kind: FakeNodeKind;
  shape: string;
  startedAt: number | null;
  stoppedAt: number | null;
  events: ParamEvent[];
  settings: Record<string, number>;
  outputs: FakeNode[];
  paramOutputs: string[];
}

export interface AudioRecording {
  context: AudioContext;
  nodes: FakeNode[];
  advanceTo(seconds: number): void;
}

interface FakeParam {
  owner: FakeNode;
  name: string;
  value: number;
  setValueAtTime(value: number, at: number): FakeParam;
  linearRampToValueAtTime(value: number, at: number): FakeParam;
  exponentialRampToValueAtTime(value: number, at: number): FakeParam;
}

export function recordingAudioContext(sampleRate = 48000): AudioRecording {
  const nodes: FakeNode[] = [];
  let currentTime = 0;
  const add = (kind: FakeNodeKind): FakeNode => {
    const node: FakeNode = {
      id: nodes.length,
      kind,
      shape: '',
      startedAt: null,
      stoppedAt: null,
      events: [],
      settings: {},
      outputs: [],
      paramOutputs: [],
    };
    nodes.push(node);
    return node;
  };
  const destination = add('destination');
  const context = {
    get currentTime() {
      return currentTime;
    },
    sampleRate,
    state: 'running' as AudioContextState,
    destination: nodeFace(destination),
    resume: () => Promise.resolve(),
    close: () => Promise.resolve(),
    createGain: () => gainFace(add('gain')),
    createOscillator: () => oscillatorFace(add('oscillator')),
    createBufferSource: () => bufferSourceFace(add('buffer-source')),
    createBiquadFilter: () => filterFace(add('filter')),
    createConvolver: () => convolverFace(add('convolver')),
    createBuffer: (channels: number, length: number) => bufferOf(channels, length, sampleRate),
  };
  return {
    context: context as unknown as AudioContext,
    nodes,
    advanceTo: (seconds) => {
      currentTime = seconds;
    },
  };
}

export function nodesOfKind(recording: AudioRecording, kind: FakeNodeKind): FakeNode[] {
  return recording.nodes.filter((node) => node.kind === kind);
}

export function scheduledValues(recording: AudioRecording): number[] {
  return recording.nodes.flatMap((node) => node.events.map((event) => event.value));
}

export function reachableFrom(node: FakeNode): FakeNode[] {
  const seen = new Set<FakeNode>();
  const walk = (one: FakeNode): void => {
    if (seen.has(one)) return;
    seen.add(one);
    for (const next of one.outputs) walk(next);
  };
  walk(node);
  return [...seen];
}

export function loudestPeakOf(node: FakeNode): number {
  return Math.max(0, ...node.events.filter((event) => event.param === 'gain').map((event) => event.value));
}

function bufferOf(channels: number, length: number, sampleRate: number): AudioBuffer {
  const data = Array.from({ length: channels }, () => new Float32Array(length));
  return {
    numberOfChannels: channels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: (channel: number) => data[channel]!,
  } as unknown as AudioBuffer;
}

function paramFace(owner: FakeNode, name: string): FakeParam {
  const record = (change: ParamChange, value: number, at: number): FakeParam => {
    owner.events.push({ param: name, change, value, at });
    owner.settings[name] = value;
    return param;
  };
  const param = {
    owner,
    name,
    setValueAtTime: (value: number, at: number) => record('set', value, at),
    linearRampToValueAtTime: (value: number, at: number) => record('linear', value, at),
    exponentialRampToValueAtTime: (value: number, at: number) => record('exponential', value, at),
  } as FakeParam;
  Object.defineProperty(param, 'value', {
    get: () => owner.settings[name] ?? 0,
    set: (value: number) => {
      owner.settings[name] = value;
    },
  });
  return param;
}

function isParam(target: unknown): target is FakeParam {
  return typeof target === 'object' && target !== null && 'owner' in target && 'name' in target;
}

function nodeFace(node: FakeNode): Record<string, unknown> {
  return {
    node,
    connect: (target: unknown) => {
      if (isParam(target)) {
        node.paramOutputs.push(target.name);
        node.outputs.push(target.owner);
        return target;
      }
      const other = (target as { node: FakeNode }).node;
      node.outputs.push(other);
      return target;
    },
    disconnect: () => undefined,
  };
}

function gainFace(node: FakeNode): Record<string, unknown> {
  return { ...nodeFace(node), gain: paramFace(node, 'gain') };
}

function playableFace(node: FakeNode): Record<string, unknown> {
  return {
    ...nodeFace(node),
    start: (at: number) => {
      node.startedAt = at;
    },
    stop: (at: number) => {
      node.stoppedAt = at;
    },
  };
}

function oscillatorFace(node: FakeNode): Record<string, unknown> {
  const face = { ...playableFace(node), frequency: paramFace(node, 'frequency') };
  Object.defineProperty(face, 'type', {
    set: (wave: string) => {
      node.shape = wave;
    },
    get: () => node.shape,
  });
  return face;
}

function bufferSourceFace(node: FakeNode): Record<string, unknown> {
  return { ...playableFace(node), buffer: null, loop: false };
}

function filterFace(node: FakeNode): Record<string, unknown> {
  const face = { ...nodeFace(node), frequency: paramFace(node, 'frequency'), Q: paramFace(node, 'Q') };
  Object.defineProperty(face, 'type', {
    set: (kind: string) => {
      node.shape = kind;
    },
    get: () => node.shape,
  });
  return face;
}

function convolverFace(node: FakeNode): Record<string, unknown> {
  return { ...nodeFace(node), buffer: null, normalize: true };
}
