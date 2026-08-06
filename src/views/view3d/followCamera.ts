import * as THREE from 'three';
import { PanOffset } from '../camera/panOffset';
import { ZoomScale } from '../camera/zoomScale';

const TURN_SMOOTHING_RATE = 14;
const FOCUS_SMOOTHING_RATE = 10;
const PITCH_DEG = 52;
const FIELD_OF_VIEW_DEG = 50;
const DISTANCE_AT_UNIT_ZOOM = 16;
const MIN_MAGNIFICATION = 16 / 4000;
const MAX_MAGNIFICATION = 16 / 1.5;
const QUARTER_TURN = Math.PI / 2;
const TAU = Math.PI * 2;

export interface FocusPoint {
  x: number;
  y: number;
}

export class FollowCamera {
  readonly camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW_DEG, 1, 0.1, 20000);

  private readonly zoom = new ZoomScale(1, MIN_MAGNIFICATION, MAX_MAGNIFICATION);
  private readonly pan = new PanOffset();
  private quadrant = 0;
  private yaw = 0;
  private yawTarget = 0;
  private followX = 0;
  private followY = 0;
  private viewportHeightPx = 1;
  private snapOnNextUpdate = true;

  yawQuadrant(): number {
    return this.quadrant;
  }

  rotate(direction: -1 | 1): void {
    this.quadrant = (((this.quadrant + direction) % 4) + 4) % 4;
    this.yawTarget = this.quadrant * QUARTER_TURN;
  }

  zoomByWheelPixels(wheelPixelsY: number): void {
    this.zoom.applyWheelPixels(wheelPixelsY);
  }

  panByDragPixels(dxPixels: number, dyPixels: number): void {
    const acrossGround = this.worldPerPixel();
    const intoGround = acrossGround / Math.sin(pitchRadians());
    this.pan.shiftBy(
      -Math.cos(this.yaw) * dxPixels * acrossGround + Math.sin(this.yaw) * dyPixels * intoGround,
      -Math.sin(this.yaw) * dxPixels * acrossGround - Math.cos(this.yaw) * dyPixels * intoGround,
    );
  }

  recenterOnPlayer(): void {
    this.pan.recenter();
  }

  focusPoint(): FocusPoint {
    return { x: this.followX + this.pan.tilesX(), y: this.followY + this.pan.tilesY() };
  }

  visibleGroundRadiusTiles(): number {
    const halfHeight = this.cameraDistance() * Math.tan(halfFieldOfViewRadians());
    return Math.max(halfHeight / Math.sin(pitchRadians()), halfHeight * this.camera.aspect);
  }

  snapToFocusOnNextUpdate(): void {
    this.snapOnNextUpdate = true;
  }

  setViewportSize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.viewportHeightPx = height;
    this.camera.updateProjectionMatrix();
  }

  update(dtSeconds: number, targetX: number, targetY: number): void {
    if (this.snapOnNextUpdate) this.snapTo(targetX, targetY);
    else this.easeToward(dtSeconds, targetX, targetY);
    this.placeCameraBehindFocus();
  }

  private cameraDistance(): number {
    return DISTANCE_AT_UNIT_ZOOM / this.zoom.current();
  }

  private worldPerPixel(): number {
    return (2 * this.cameraDistance() * Math.tan(halfFieldOfViewRadians())) / this.viewportHeightPx;
  }

  private snapTo(targetX: number, targetY: number): void {
    this.followX = targetX;
    this.followY = targetY;
    this.yaw = this.yawTarget;
    this.snapOnNextUpdate = false;
  }

  private easeToward(dtSeconds: number, targetX: number, targetY: number): void {
    const focusStep = easeFraction(FOCUS_SMOOTHING_RATE, dtSeconds);
    this.followX += (targetX - this.followX) * focusStep;
    this.followY += (targetY - this.followY) * focusStep;
    this.yaw += shortestArc(this.yaw, this.yawTarget) * easeFraction(TURN_SMOOTHING_RATE, dtSeconds);
  }

  private placeCameraBehindFocus(): void {
    const distance = this.cameraDistance();
    const distanceBehind = distance * Math.cos(pitchRadians());
    const focus = this.focusPoint();
    const centerX = focus.x + 0.5;
    const centerZ = focus.y + 0.5;
    this.camera.position.set(
      centerX - Math.sin(this.yaw) * distanceBehind,
      distance * Math.sin(pitchRadians()),
      centerZ + Math.cos(this.yaw) * distanceBehind,
    );
    this.camera.lookAt(centerX, 0, centerZ);
  }
}

function pitchRadians(): number {
  return (PITCH_DEG * Math.PI) / 180;
}

function halfFieldOfViewRadians(): number {
  return (FIELD_OF_VIEW_DEG / 2) * (Math.PI / 180);
}

function easeFraction(rate: number, dtSeconds: number): number {
  return 1 - Math.exp(-rate * dtSeconds);
}

function shortestArc(from: number, to: number): number {
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta <= -Math.PI) delta += TAU;
  return delta;
}
