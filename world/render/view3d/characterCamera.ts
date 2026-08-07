import * as THREE from 'three';
import { ZoomScale } from '../camera/zoomScale';
import { DEFAULT_CHARACTER_SIGHT_RADIUS_TILES } from '../../vision/characterSight';
import { easeFraction, shortestArc } from './cameraEase';

const FIELD_OF_VIEW_AT_UNIT_ZOOM_DEG = 70;
const WIDEST_FIELD_OF_VIEW_DEG = 95;
const NARROWEST_FIELD_OF_VIEW_DEG = 40;
const MIN_MAGNIFICATION = FIELD_OF_VIEW_AT_UNIT_ZOOM_DEG / WIDEST_FIELD_OF_VIEW_DEG;
const MAX_MAGNIFICATION = FIELD_OF_VIEW_AT_UNIT_ZOOM_DEG / NARROWEST_FIELD_OF_VIEW_DEG;
const DOWNWARD_PITCH_DEG = 12;
const NEAR_PLANE = 0.05;
const TURN_SMOOTHING_RATE = 12;
const WALK_SMOOTHING_RATE = 14;
const EYE_HEIGHT = 1.1;

export class CharacterCamera {
  readonly camera = new THREE.PerspectiveCamera(
    FIELD_OF_VIEW_AT_UNIT_ZOOM_DEG,
    1,
    NEAR_PLANE,
    DEFAULT_CHARACTER_SIGHT_RADIUS_TILES,
  );

  private readonly zoom = new ZoomScale(1, MIN_MAGNIFICATION, MAX_MAGNIFICATION);
  private yaw = 0;
  private eyeX = 0;
  private eyeY = 0;
  private eyeElevation = 0;
  private snapOnNextUpdate = true;

  zoomByWheelPixels(wheelPixelsY: number): void {
    this.zoom.applyWheelPixels(wheelPixelsY);
  }

  snapOnNextFrame(): void {
    this.snapOnNextUpdate = true;
  }

  setSightRadiusTiles(sightRadiusTiles: number): void {
    if (this.camera.far === sightRadiusTiles) return;
    this.camera.far = sightRadiusTiles;
    this.camera.updateProjectionMatrix();
  }

  setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  focusPoint(): { x: number; y: number } {
    return { x: this.eyeX, y: this.eyeY };
  }

  update(
    dtSeconds: number,
    targetX: number,
    targetY: number,
    targetElevation: number,
    facingYaw: number,
  ): void {
    if (this.snapOnNextUpdate) this.snapTo(targetX, targetY, targetElevation, facingYaw);
    else this.easeToward(dtSeconds, targetX, targetY, targetElevation, facingYaw);
    this.applyFieldOfView();
    this.lookAlongFacing();
  }

  private snapTo(
    targetX: number,
    targetY: number,
    targetElevation: number,
    facingYaw: number,
  ): void {
    this.eyeX = targetX;
    this.eyeY = targetY;
    this.eyeElevation = targetElevation;
    this.yaw = facingYaw;
    this.snapOnNextUpdate = false;
  }

  private easeToward(
    dtSeconds: number,
    targetX: number,
    targetY: number,
    targetElevation: number,
    facingYaw: number,
  ): void {
    const walkStep = easeFraction(WALK_SMOOTHING_RATE, dtSeconds);
    this.eyeX += (targetX - this.eyeX) * walkStep;
    this.eyeY += (targetY - this.eyeY) * walkStep;
    this.eyeElevation += (targetElevation - this.eyeElevation) * walkStep;
    this.yaw += shortestArc(this.yaw, facingYaw) * easeFraction(TURN_SMOOTHING_RATE, dtSeconds);
  }

  private applyFieldOfView(): void {
    const fieldOfView = FIELD_OF_VIEW_AT_UNIT_ZOOM_DEG / this.zoom.current();
    if (this.camera.fov === fieldOfView) return;
    this.camera.fov = fieldOfView;
    this.camera.updateProjectionMatrix();
  }

  private lookAlongFacing(): void {
    const eyeHeight = this.eyeElevation + EYE_HEIGHT;
    this.camera.position.set(this.eyeX + 0.5, eyeHeight, this.eyeY + 0.5);
    const pitch = (DOWNWARD_PITCH_DEG * Math.PI) / 180;
    const aheadDistance = Math.cos(pitch);
    this.camera.lookAt(
      this.camera.position.x + Math.sin(this.yaw) * aheadDistance,
      eyeHeight - Math.sin(pitch),
      this.camera.position.z - Math.cos(this.yaw) * aheadDistance,
    );
  }
}
