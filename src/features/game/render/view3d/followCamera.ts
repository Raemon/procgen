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
const FARTHEST_CAMERA_DISTANCE = 1e7;
const CLOSEST_CAMERA_DISTANCE = 0.02;
const MIN_MAGNIFICATION = DISTANCE_AT_UNIT_ZOOM / FARTHEST_CAMERA_DISTANCE;
const MAX_MAGNIFICATION = DISTANCE_AT_UNIT_ZOOM / CLOSEST_CAMERA_DISTANCE;
const NEAR_PLANE_OF_DISTANCE = 0.005;
const FAR_PLANE_OF_DISTANCE = 8;
const MIN_NEAR_PLANE = 0.0001;
const GROUND_FRUSTUM_POINTS = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

export interface FocusPoint {
  x: number;
  y: number;
}

export class FollowCamera {
  readonly camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW_DEG, 1, 0.1, DISTANCE_AT_UNIT_ZOOM * FAR_PLANE_OF_DISTANCE);

  private readonly zoom = new ZoomScale(1, MIN_MAGNIFICATION, MAX_MAGNIFICATION);
  private readonly pan = new PanOffset();
  private currentYaw = 0;
  private yawTarget = 0;
  private followX = 0;
  private followY = 0;
  private viewportHeightPx = 1;
  private snapOnNextUpdate = true;
  private readonly unprojectedPoint = new THREE.Vector3();
  private readonly groundDirection = new THREE.Vector3();
  private readonly groundIntersection = new THREE.Vector3();

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

  lookAtTile(x: number, y: number): void {
    this.pan.setTo(x - this.followX, y - this.followY);
  }

  focusPoint(): FocusPoint {
    return { x: this.followX + this.pan.tilesX(), y: this.followY + this.pan.tilesY() };
  }

  visibleGroundRadiusTiles(groundElevation: number = 0): number {
    this.camera.updateMatrixWorld();
    const focus = this.focusPoint();
    const centerX = focus.x + 0.5;
    const centerZ = focus.y + 0.5;
    let radius = 0;
    for (const [x, y] of GROUND_FRUSTUM_POINTS) {
      this.unprojectedPoint.set(x, y, 1).unproject(this.camera);
      this.groundDirection.subVectors(this.unprojectedPoint, this.camera.position);
      if (this.groundDirection.y >= 0) continue;
      const distance = (groundElevation - this.camera.position.y) / this.groundDirection.y;
      if (distance < 0) continue;
      this.groundIntersection
        .copy(this.camera.position)
        .addScaledVector(this.groundDirection, distance);
      radius = Math.max(
        radius,
        Math.hypot(this.groundIntersection.x - centerX, this.groundIntersection.z - centerZ),
      );
    }
    return radius;
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

  private clipPlanesForDistance(distance: number): void {
    const near = Math.max(MIN_NEAR_PLANE, distance * NEAR_PLANE_OF_DISTANCE);
    const far = distance * FAR_PLANE_OF_DISTANCE;
    if (this.camera.near === near && this.camera.far === far) return;
    this.camera.near = near;
    this.camera.far = far;
    this.camera.updateProjectionMatrix();
  }

  private placeCameraBehindFocus(): void {
    const distance = this.cameraDistance();
    this.clipPlanesForDistance(distance);
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
