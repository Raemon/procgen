import type * as THREE from 'three';
import { CharacterCamera } from './characterCamera';
import { FollowCamera } from './followCamera';
import { TopDownCamera } from './topDownCamera';

export type CameraStyle = 'god' | 'character' | 'topdown';

export interface RigTarget {
  x: number;
  y: number;
  groundElevation: number;
  eyeElevation: number;
  facingYaw: number;
}

export class CameraRig {
  readonly follow = new FollowCamera();
  readonly character = new CharacterCamera();
  readonly topDown = new TopDownCamera();

  private seenThrough: CameraStyle = 'god';

  get style(): CameraStyle {
    return this.seenThrough;
  }

  get camera(): THREE.PerspectiveCamera {
    if (this.seenThrough === 'god') return this.follow.camera;
    return this.seenThrough === 'topdown' ? this.topDown.camera : this.character.camera;
  }

  lookThrough(style: CameraStyle): void {
    this.seenThrough = style;
    this.character.levelLook();
    this.character.snapOnNextFrame();
    this.follow.snapToFocusOnNextUpdate();
    this.topDown.snapToFocusOnNextUpdate();
  }

  lookBy(step: -1 | 1): void {
    if (this.seenThrough === 'character') this.character.lookBy(step);
  }

  yaw(facingYaw: number): number {
    if (this.seenThrough === 'god') return this.follow.yaw();
    return this.seenThrough === 'topdown' ? 0 : facingYaw;
  }

  focusPoint(): { x: number; y: number } {
    if (this.seenThrough === 'god') return this.follow.focusPoint();
    return this.seenThrough === 'topdown' ? this.topDown.focusPoint() : this.character.focusPoint();
  }

  update(dtSeconds: number, target: RigTarget): void {
    if (this.seenThrough === 'topdown') {
      this.topDown.update(dtSeconds, target.x, target.y, target.groundElevation);
      return;
    }
    if (this.seenThrough === 'god') {
      this.follow.update(dtSeconds, target.x, target.y, target.facingYaw, target.groundElevation);
      return;
    }
    this.character.update(dtSeconds, target.x, target.y, target.eyeElevation, target.facingYaw);
  }

  zoomByWheelPixels(wheelPixelsY: number): void {
    if (this.seenThrough === 'god') this.follow.zoomByWheelPixels(wheelPixelsY);
    else if (this.seenThrough === 'topdown') this.topDown.zoomByWheelPixels(wheelPixelsY);
    else this.character.zoomByWheelPixels(wheelPixelsY);
  }

  panByDragPixels(dxPixels: number, dyPixels: number): void {
    if (this.seenThrough === 'topdown') this.topDown.panByDragPixels(dxPixels, dyPixels);
    else if (this.seenThrough === 'god') this.follow.panByDragPixels(dxPixels, dyPixels);
  }

  visibleGroundRadiusTiles(groundElevation: number, sightRadiusTiles: number): number {
    if (this.seenThrough === 'god') return this.follow.visibleGroundRadiusTiles(groundElevation);
    if (this.seenThrough === 'character') return sightRadiusTiles;
    return Math.max(sightRadiusTiles, this.topDown.visibleGroundRadiusTiles());
  }

  setViewportSize(cssWidth: number, cssHeight: number): void {
    this.follow.setViewportSize(cssWidth, cssHeight);
    this.topDown.setViewportSize(cssWidth, cssHeight);
    this.character.setAspect(cssWidth / cssHeight);
  }
}
