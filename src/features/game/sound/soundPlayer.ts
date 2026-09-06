import { audioGraphOf, type AudioGraph } from './audioGraph';
import { soundRecipesOf, type SoundCue } from './soundCues';

export interface SoundPlayer {
  play(cue: SoundCue, volume?: number): void;
  dispose(): void;
}

const SILENT_PLAYER: SoundPlayer = { play: () => undefined, dispose: () => undefined };

const UNLOCKING_GESTURES = ['keydown', 'pointerdown'] as const;

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
    play: (cue, volume = 1) => {
      if (disposed) return;
      const audio = ready();
      if (audio.context.state !== 'running') return;
      const recipe = recipes[cue];
      const out = audio.context.createGain();
      out.gain.value = Math.max(0, Math.min(1, volume));
      out.connect(audio.master);
      const send = audio.context.createGain();
      send.gain.value = recipe.roomSend;
      out.connect(send);
      send.connect(audio.room);
      recipe.play(audio.context, audio.noise, out);
    },
    dispose: () => {
      disposed = true;
      for (const gesture of UNLOCKING_GESTURES) window.removeEventListener(gesture, unlock);
      void graph?.context.close();
      graph = null;
    },
  };
}
