import * as THREE from 'three';
import { PanOffset } from '../camera/panOffset';
import { ZoomScale } from '../camera/zoomScale';
import { easeFraction, shortestArc } from './cameraEase';
import { worldPanForDrag } from './dragToWorldPan';

const TURN_SMOOTHING_RATE = 14;
const FOCUS_SMOOTHING_RATE = 10;
const PITCH_DEG = 52;
const FIELD_OF_VIEW_DEG = 50;
const DISTANCE_AT_UNIT_ZOOM = 16;
const FARTHEST_CAMERA_DISTANCE = 800;
const CLOSEST_CAMERA_DISTANCE = 1.2;
const MIN_MAGNIFICATION = DISTANCE_AT_UNIT_ZOOM / FARTHEST_CAMERA_DISTANCE;
const MAX_MAGNIFICATION = DISTANCE_AT_UNIT_ZOOM / CLOSEST_CAMERA_DISTANCE;

export interface FocusPoint {
  x: number;
  y: number;
}

export class FollowCamera {
  readonly camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW_DEG, 1, 0.1, FARTHEST_CAMERA_DISTANCE * 3);

  private readonly zoom = new ZoomScale(1, MIN_MAGNIFICATION, MAX_MAGNIFICATION);
  private readonly pan = new PanOffset();
  private currentYaw = 0;
  private yawTarget = 0;
  private followX = 0;
  private followY = 0;
  private viewportHeightPx = 1;
  private snapOnNextUpdate = true;

  yaw(): number {
    return this.currentYaw;
  }

  zoomByWheelPixels(wheelPixelsY: number): void {
    this.zoom.applyWheelPixels(wheelPixelsY);
  }

  panByDragPixels(dxPixels: number, dyPixels: number): void {
    const delta = worldPanForDrag(
      { dxPixels, dyPixels },
      { yaw: this.currentYaw, worldPerPixel: this.worldPerPixel(), pitchRadians: pitchRadians() },
    );
    this.pan.shiftBy(delta.dx, delta.dy);
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

  update(dtSeconds: number, targetX: number, targetY: number, targetYaw: number): void {
    this.yawTarget = targetYaw;
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
    this.currentYaw = this.yawTarget;
    this.snapOnNextUpdate = false;
  }

  private easeToward(dtSeconds: number, targetX: number, targetY: number): void {
    const focusStep = easeFraction(FOCUS_SMOOTHING_RATE, dtSeconds);
    this.followX += (targetX - this.followX) * focusStep;
    this.followY += (targetY - this.followY) * focusStep;
    this.currentYaw += shortestArc(this.currentYaw, this.yawTarget) * easeFraction(TURN_SMOOTHING_RATE, dtSeconds);
  }

  private placeCameraBehindFocus(): void {
    const distance = this.cameraDistance();
    const distanceBehind = distance * Math.cos(pitchRadians());
    const focus = this.focusPoint();
    const centerX = focus.x + 0.5;
    const centerZ = focus.y + 0.5;
    this.camera.position.set(
      centerX - Math.sin(this.currentYaw) * distanceBehind,
      distance * Math.sin(pitchRadians()),
      centerZ + Math.cos(this.currentYaw) * distanceBehind,
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
