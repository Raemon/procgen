import type * as THREE from 'three';
import type { ReadOnlyWorld } from '@/features/app-shell/runtime/readOnlyAssets';
import type { CharacterMotion } from '@/features/asset-library/characters/characterFrame';
import { facingYawRadians } from '../../facing';
import type { LightSource } from '../../light/lightEmission';
import type { CameraView } from './cameraView';
import { EasedPoint } from './easedPoint';
import { JumpArc } from './jumpArc';
import { PlayerCharacterMesh } from './playerCharacterMesh';

const STILL_ENOUGH_TILES = 0.05;

export interface PlayerPresenceDeps {
  world: ReadOnlyWorld;
  surfaceAt(x: number, y: number): number;
}

export class PlayerPresence {
  readonly eased: EasedPoint;
  private readonly mesh: PlayerCharacterMesh;
  private readonly jumpArc = new JumpArc();
  private readonly stopWatchingJumps: () => void;

  constructor(private readonly deps: PlayerPresenceDeps) {
    this.eased = new EasedPoint(deps.world.playerX, deps.world.playerY);
    this.mesh = new PlayerCharacterMesh();
    this.stopWatchingJumps = deps.world.on('player-jumped', () => this.jumpArc.launch(this.groundUnderPlayer()));
  }

  get object(): THREE.Group {
    return this.mesh.object;
  }

  get position(): THREE.Vector3 {
    return this.mesh.position;
  }

  set visible(visible: boolean) {
    this.mesh.visible = visible;
  }

  advance(dtSeconds: number): void {
    this.jumpArc.advance(dtSeconds);
    this.moveTowardTile(dtSeconds);
  }

  place(view: CameraView): void {
    this.mesh.standAt(
      {
        x: this.eased.x + 0.5,
        y: this.eased.y + 0.5,
        elevation: this.elevation(),
        motion: this.motion(),
      },
      view,
    );
  }

  lightSource(): LightSource {
    return this.mesh.lightSource();
  }

  elevation(): number {
    if (this.jumpArc.airborne()) return this.jumpArc.elevationOver(this.groundUnderPlayer());
    return this.deps.surfaceAt(Math.round(this.eased.x), Math.round(this.eased.y));
  }

  dispose(): void {
    this.stopWatchingJumps();
    this.mesh.dispose();
  }

  private moveTowardTile(dtSeconds: number): void {
    const { playerX, playerY } = this.deps.world;
    if (this.jumpArc.airborne()) {
      this.eased.glideTo(playerX, playerY, dtSeconds, this.jumpArc.secondsRemaining());
      return;
    }
    this.eased.approach(playerX, playerY, dtSeconds);
  }

  private groundUnderPlayer(): number {
    return this.deps.surfaceAt(this.deps.world.playerX, this.deps.world.playerY);
  }

  private motion(): CharacterMotion {
    const stepsAway = Math.hypot(this.deps.world.playerX - this.eased.x, this.deps.world.playerY - this.eased.y);
    return {
      heading: facingYawRadians(this.deps.world.facing),
      moving: stepsAway > STILL_ENOUGH_TILES,
    };
  }
}
