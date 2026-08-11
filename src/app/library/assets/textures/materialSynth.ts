export const TEXTURE_FACES = ['top', 'side'] as const;
export type TextureFace = (typeof TEXTURE_FACES)[number];
export type Rgb = [number, number, number];

export interface MaterialSynth {
  id: string;
  faces: TextureFace[];
  colorAt: (x: number, y: number, face: TextureFace) => Rgb;
  heightAt: (x: number, y: number, face: TextureFace) => number;
}

export function sameOnEveryFace(
  id: string,
  colorAt: (x: number, y: number) => Rgb,
  heightAt: (x: number, y: number) => number,
): MaterialSynth {
  return { id, faces: ['top'], colorAt: (x, y) => colorAt(x, y), heightAt: (x, y) => heightAt(x, y) };
}
