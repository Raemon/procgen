import * as THREE from 'three';
import type { CharacterMotion } from '@/features/asset-library/characters/characterFrame';
import { disposeMeshResources } from './disposeMeshResources';
import { LANTERN_INK, lanternParts, type LanternParts } from './lanternCubeParts';

const IDLE_BOB = 0.03;
const STEP_BOB = 0.055;
const IDLE_RATE = 2.1;
const STEP_RATE = 7.4;
const LEAN_INTO_MOTION = 0.17;
const LEAN_RATE = 9;
const TURN_RATE = 14;
const SWAY = 0.06;
const LONGEST_STEP_SECONDS = 0.1;

export class LanternCube {
  readonly object = new THREE.Group();

  private readonly parts: LanternParts;
  private readonly glowIntensities: number[];
  private lean = 0;
  private yaw: number | null = null;
  private lastSeconds = 0;

  constructor(ink: number = LANTERN_INK) {
    this.parts = lanternParts(ink);
    this.object.rotation.order = 'YXZ';
    this.object.add(...this.parts.meshes);
    this.glowIntensities = glowingMaterials(this.parts).map(
      (material) => material.emissiveIntensity,
    );
  }

  dispose(): void {
    for (const mesh of this.parts.meshes) {
      this.object.remove(mesh);
      disposeMeshResources(mesh);
    }
    this.object.removeFromParent();
  }

  pose(motion: CharacterMotion, seconds: number): void {
    const step = Math.min(LONGEST_STEP_SECONDS, Math.max(0, seconds - this.lastSeconds));
    this.lastSeconds = seconds;
    this.turnToward(-motion.heading, step);
    this.leanInto(motion.moving, step);
    this.bob(motion.moving, seconds);
    this.flicker(seconds);
  }

  private turnToward(wanted: number, step: number): void {
    if (this.yaw === null) this.yaw = wanted;
    else this.yaw += shortestTurn(this.yaw, wanted) * Math.min(1, step * TURN_RATE);
    this.object.rotation.y = this.yaw;
  }

  private leanInto(moving: boolean, step: number): void {
    const wanted = moving ? LEAN_INTO_MOTION : 0;
    this.lean += (wanted - this.lean) * Math.min(1, step * LEAN_RATE);
    this.object.rotation.x = -this.lean;
  }

  private bob(moving: boolean, seconds: number): void {
    const rate = moving ? STEP_RATE : IDLE_RATE;
    const height = moving ? STEP_BOB : IDLE_BOB;
    this.object.position.y = Math.sin(seconds * rate) * height;
    this.object.rotation.z = Math.sin(seconds * rate * 0.5) * SWAY * (moving ? 1 : 0.35);
  }

  private flicker(seconds: number): void {
    const wobble =
      1 + Math.sin(seconds * 11.3) * 0.08 + Math.sin(seconds * 19.7 + 1.7) * 0.045;
    glowingMaterials(this.parts).forEach((material, index) => {
      material.emissiveIntensity = this.glowIntensities[index]! * wobble;
    });
  }
}

function glowingMaterials(parts: LanternParts): THREE.MeshLambertMaterial[] {
  return [parts.core, parts.glass, parts.lens].map(
    (mesh) => mesh.material as THREE.MeshLambertMaterial,
  );
}

function shortestTurn(from: number, to: number): number {
  const turn = (to - from) % (Math.PI * 2);
  if (turn > Math.PI) return turn - Math.PI * 2;
  if (turn < -Math.PI) return turn + Math.PI * 2;
  return turn;
}
