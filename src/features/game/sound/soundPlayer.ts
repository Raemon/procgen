import { audioGraphOf, type AudioGraph } from './audioGraph';
import { soundRecipesOf, type SoundCue } from './soundCues';
import { soundShapeOf, type SoundShape } from './soundRecipe';

export interface SoundPlayer {
  play(cue: SoundCue, shape?: Partial<SoundShape>): void;
  dispose(): void;
}

const SILENT_PLAYER: SoundPlayer = { play: () => undefined, dispose: () => undefined };

const UNLOCKING_GESTURES = ['keydown', 'pointerdown'] as const;

const WIDE_ROOM_WASH = 1.25;

export function createSoundPlayer(isOn: () => boolean = () => true): SoundPlayer {
  if (typeof AudioContext === 'undefined') return SILENT_PLAYER;
  const recipes = soundRecipesOf();
  let graph: AudioGraph | null = null;
  let disposed = false;
  const ready = (): AudioGraph => {
    graph ??= audioGraphOf(new AudioContext());
    if (graph.context.state === 'suspended') void graph.context.resume();
    return graph;
  };
  const unlock = (): void => {
    if (!disposed && isOn()) ready();
  };
  for (const gesture of UNLOCKING_GESTURES) window.addEventListener(gesture, unlock);
  return {
    play: (cue, parts = {}) => {
      if (disposed) return;
      const audio = ready();
      if (audio.context.state !== 'running') return;
      const recipe = recipes[cue];
      const shape = soundShapeOf(parts);
      recipe.play(audio.context, audio.noise, cueChannel(audio, shape, recipe.roomSend), shape);
    },
    dispose: () => {
      disposed = true;
      for (const gesture of UNLOCKING_GESTURES) window.removeEventListener(gesture, unlock);
      void graph?.context.close();
      graph = null;
    },
  };
}

function cueChannel(audio: AudioGraph, shape: SoundShape, roomSend: number): GainNode {
  const out = audio.context.createGain();
  out.gain.value = Math.max(0, Math.min(1, shape.volume));
  out.connect(audio.master);
  const size = Math.max(0, Math.min(1, shape.roomSize));
  out.connect(sendInto(audio, audio.closeRoom, roomSend * (1 - size)));
  out.connect(sendInto(audio, audio.wideRoom, roomSend * size * WIDE_ROOM_WASH));
  return out;
}

function sendInto(audio: AudioGraph, room: ConvolverNode, amount: number): GainNode {
  const send = audio.context.createGain();
  send.gain.value = amount;
  send.connect(room);
  return send;
}
