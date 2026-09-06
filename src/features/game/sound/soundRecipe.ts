export interface SoundRecipe {
  roomSend: number;
  play(context: AudioContext, noise: AudioBuffer, out: AudioNode): void;
}
