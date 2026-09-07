export interface SoundShape {
  volume: number;
  roomSize: number;
  effort: number;
  seconds: number;
}

export const PLAIN_SOUND: SoundShape = { volume: 1, roomSize: 0.4, effort: 0, seconds: 0.15 };

export function soundShapeOf(parts: Partial<SoundShape>): SoundShape {
  return { ...PLAIN_SOUND, ...parts };
}

export interface SoundRecipe {
  roomSend: number;
  play(context: AudioContext, noise: AudioBuffer, out: AudioNode, shape: SoundShape): void;
}
