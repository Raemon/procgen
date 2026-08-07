import * as THREE from 'three';
import type { ReadOnlyCreatureLibrary } from '../../app/readOnlyLibraries';
import type { CharacterMotion } from '../../creatures/character/characterFrame';
import { playerCharacterDef } from '../../creatures/playerCharacter';
import type { CameraView } from './cameraView';
import { characterQuadMesh, dressCharacterQuad } from './characterQuad';
import type { CharacterSpriteTextures } from './characterSpriteTextures';
import { createPlayerCapsule } from './daylitScene';
import { disposeMeshResources } from './disposeMeshResources';

const CAPSULE_CENTER_HEIGHT = 0.55;

export interface PlayerStance {
  x: number;
  y: number;
  elevation: number;
  motion: CharacterMotion;
}

export class PlayerCharacterMesh {
  readonly object = new THREE.Group();

  private readonly quad = characterQuadMesh();
  private readonly capsule: THREE.Mesh;

  constructor(
    private readonly creatures: ReadOnlyCreatureLibrary,
    private readonly sprites: CharacterSpriteTextures,
    private readonly tint?: number,
  ) {
    this.capsule = createPlayerCapsule(tint);
    this.object.add(this.quad, this.capsule);
  }

  dispose(): void {
    this.object.removeFromParent();
    disposeMeshResources(this.quad, { keepMaterials: true });
    disposeMeshResources(this.capsule);
  }

  set visible(visible: boolean) {
    this.object.visible = visible;
  }

  get position(): THREE.Vector3 {
    return this.object.position;
  }

  standAt(stance: PlayerStance, view: CameraView): void {
    const def = playerCharacterDef(this.creatures);
    const dressed =
      def !== null &&
      dressCharacterQuad(this.quad, {
        sprites: this.sprites,
        def,
        motion: stance.motion,
        view,
        tint: this.tint,
      });
    this.quad.visible = dressed;
    this.capsule.visible = !dressed;
    const height = dressed ? def!.size / 2 : CAPSULE_CENTER_HEIGHT;
    this.object.position.set(stance.x, stance.elevation + height, stance.y);
  }
}
