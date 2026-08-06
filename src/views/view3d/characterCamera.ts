import * as THREE from 'three';
import { ZoomScale } from '../camera/zoomScale';
import { easeFraction, shortestArc } from './cameraEase';

const FIELD_OF_VIEW_DEG = 60;
const PITCH_DEG = 28;
const DISTANCE_AT_UNIT_ZOOM = 9;
const CLOSEST_DISTANCE = 2.5;
const FARTHEST_DISTANCE = 40;
const MIN_MAGNIFICATION = DISTANCE_AT_UNIT_ZOOM / FARTHEST_DISTANCE;
const MAX_MAGNIFICATION = DISTANCE_AT_UNIT_ZOOM / CLOSEST_DISTANCE;
const TURN_SMOOTHING_RATE = 12;
const FOLLOW_SMOOTHING_RATE = 10;
const EYE_HEIGHT = 1.1;

export class CharacterCamera {
  readonly camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW_DEG, 1, 0.1, 600);

  private readonly zoom = new ZoomScale(1, MIN_MAGNIFICATION, MAX_MAGNIFICATION);
  private yaw = 0;
  private followX = 0;
  private followY = 0;
  private snapOnNextUpdate = true;

  zoomByWheelPixels(wheelPixelsY: number): void {
    this.zoom.applyWheelPixels(wheelPixelsY);
  }

  snapOnNextFrame(): void {
    this.snapOnNextUpdate = true;
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  focusPoint(): { x: number; y: number } {
    return { x: this.followX, y: this.followY };
  }

  visibleGroundRadiusTiles(): number {
    return this.distance() * 2;
  }

  update(
    dtSeconds: number,
    targetX: number,
    targetY: number,
    targetElevation: number,
    facingYaw: number,
  ): void {
    if (this.snapOnNextUpdate) this.snapTo(targetX, targetY, facingYaw);
    else this.easeToward(dtSeconds, targetX, targetY, facingYaw);
    this.placeBehindPlayer(targetElevation);
  }

  private snapTo(targetX: number, targetY: number, facingYaw: number): void {
    this.followX = targetX;
    this.followY = targetY;
    this.yaw = facingYaw;
    this.snapOnNextUpdate = false;
  }

  private easeToward(dtSeconds: number, targetX: number, targetY: number, facingYaw: number): void {
    const followStep = easeFraction(FOLLOW_SMOOTHING_RATE, dtSeconds);
    this.followX += (targetX - this.followX) * followStep;
    this.followY += (targetY - this.followY) * followStep;
    this.yaw += shortestArc(this.yaw, facingYaw) * easeFraction(TURN_SMOOTHING_RATE, dtSeconds);
  }

  private placeBehindPlayer(targetElevation: number): void {
    const distance = this.distance();
    const pitch = (PITCH_DEG * Math.PI) / 180;
    const back = distance * Math.cos(pitch);
    const up = distance * Math.sin(pitch);
    const centerX = this.followX + 0.5;
    const centerZ = this.followY + 0.5;
    const eyeY = targetElevation + EYE_HEIGHT;
    this.camera.position.set(
      centerX - Math.sin(this.yaw) * back,
      eyeY + up,
      centerZ + Math.cos(this.yaw) * back,
    );
    this.camera.lookAt(centerX, eyeY, centerZ);
  }

  private distance(): number {
    return DISTANCE_AT_UNIT_ZOOM / this.zoom.current();
  }
}
