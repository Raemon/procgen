import * as THREE from 'three';
import { frameIndexAt } from '../../creatures/character/characterBillboard';

export interface FaceArtFrameTextures {
  map: THREE.Texture;
  normalMap: THREE.Texture | null;
}

interface PlayingFaceArt {
  material: THREE.MeshLambertMaterial;
  frames: FaceArtFrameTextures[];
  frameMs: number;
  shownFrame: number;
}

const playing = new Map<THREE.Material, PlayingFaceArt>();

export function playFaceArtFrames(
  material: THREE.MeshLambertMaterial,
  frames: FaceArtFrameTextures[],
  frameMs: number,
): void {
  material.userData.faceArtFrames = frames;
  if (frames.length > 1) playing.set(material, { material, frames, frameMs, shownFrame: 0 });
}

export function stopFaceArtAnimation(material: THREE.Material): void {
  playing.delete(material);
}

export function faceArtFramesOf(material: THREE.Material): FaceArtFrameTextures[] | null {
  const frames = material.userData?.faceArtFrames;
  return Array.isArray(frames) ? (frames as FaceArtFrameTextures[]) : null;
}

export function advanceFaceArtAnimations(seconds: number): void {
  for (const animation of playing.values()) showFrameAtTime(animation, seconds);
}

function showFrameAtTime(animation: PlayingFaceArt, seconds: number): void {
  const wanted = frameIndexAt(animation.frames.length, 1000 / animation.frameMs, seconds);
  if (wanted !== animation.shownFrame) showFrame(animation, wanted);
}

function showFrame(animation: PlayingFaceArt, index: number): void {
  const frame = animation.frames[index]!;
  animation.shownFrame = index;
  animation.material.map = frame.map;
  animation.material.normalMap = frame.normalMap;
}
