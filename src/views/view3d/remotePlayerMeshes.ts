import type * as THREE from 'three';
import type { ReadOnlyCreatureLibrary } from '../../app/readOnlyLibraries';
import type { CharacterMotion } from '../../creatures/character/characterFrame';
import type { RemoteEntity, RemotePlayers } from '../../net/remotePlayers';
import type { WorldSampler } from '../../procgen/worldSampler';
import { facingYawRadians, type FacingIndex } from '../../world/facing';
import type { CameraView } from './cameraView';
import type { CharacterSpriteAssets } from './characterSpriteAssets';
import { EasedPoint } from './easedPoint';
import { PlayerCharacterMesh } from './playerCharacterMesh';

const PLAYER_HUES = [0x6ad8ff, 0x8dff6a, 0xff8d6a, 0xd86aff, 0xffe36a, 0x6affc8];
const AGENT_HUE = 0xff6ad8;
const HUE_WASH = 0.68;
const ANIMATION_SPREAD_SECONDS = 3;

export class RemotePlayerMeshes {
  private readonly characters = new Map<number, PlayerCharacterMesh>();
  private readonly easedPositions = new Map<number, EasedPoint>();

  constructor(
    private readonly root: THREE.Group,
    private readonly creatures: ReadOnlyCreatureLibrary,
    private readonly sampler: WorldSampler,
    private readonly sprites: CharacterSpriteAssets,
  ) {}

  dispose(): void {
    for (const id of [...this.characters.keys()]) this.dropCharacter(id);
  }

  forgetSprites(): void {
    for (const id of [...this.characters.keys()]) this.dropCharacter(id);
  }

  syncTo(remote: RemotePlayers, dtSeconds: number, view: CameraView): void {
    const live = new Set<number>();
    for (const entity of remote.others()) {
      live.add(entity.id);
      this.placeCharacter(entity, dtSeconds, view);
    }
    for (const id of [...this.characters.keys()]) if (!live.has(id)) this.dropCharacter(id);
  }

  headPointOf(entityId: number): THREE.Vector3 | null {
    return this.characters.get(entityId)?.position ?? null;
  }

  private placeCharacter(entity: RemoteEntity, dtSeconds: number, view: CameraView): void {
    const character = this.characters.get(entity.id) ?? this.addCharacter(entity);
    const eased = this.easedPositions.get(entity.id) ?? this.addEasedPosition(entity);
    eased.approach(entity.x, entity.y, dtSeconds);
    character.standAt(
      {
        x: eased.x + 0.5,
        y: eased.y + 0.5,
        elevation: this.sampler.elevationAt(Math.round(eased.x), Math.round(eased.y)),
        motion: motionOf(entity),
      },
      { yaw: view.yaw, seconds: view.seconds + spreadOf(entity.id) },
    );
  }

  private addEasedPosition(entity: RemoteEntity): EasedPoint {
    const eased = new EasedPoint(entity.x, entity.y);
    this.easedPositions.set(entity.id, eased);
    return eased;
  }

  private addCharacter(entity: RemoteEntity): PlayerCharacterMesh {
    const character = new PlayerCharacterMesh(this.creatures, this.sprites, hueFor(entity));
    this.root.add(character.object);
    this.characters.set(entity.id, character);
    return character;
  }

  private dropCharacter(id: number): void {
    this.characters.get(id)?.dispose();
    this.characters.delete(id);
    this.easedPositions.delete(id);
  }
}

function motionOf(entity: RemoteEntity): CharacterMotion {
  const stepping = entity.moveDir >= 0;
  return {
    heading: facingYawRadians((stepping ? entity.moveDir : entity.facing) as FacingIndex),
    moving: stepping,
  };
}

function spreadOf(entityId: number): number {
  return ((entityId * 7919) % 1000) / 1000 * ANIMATION_SPREAD_SECONDS;
}

function hueFor(entity: RemoteEntity): number {
  const hue = entity.kind === 'agent' ? AGENT_HUE : PLAYER_HUES[entity.id % PLAYER_HUES.length]!;
  return washedTowardWhite(hue, HUE_WASH);
}

function washedTowardWhite(hue: number, amount: number): number {
  const channel = (shift: number) => {
    const value = (hue >> shift) & 255;
    return Math.round(value + (255 - value) * amount) << shift;
  };
  return channel(16) | channel(8) | channel(0);
}
