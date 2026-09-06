import * as THREE from 'three';
import { PanOffset } from '../camera/panOffset';
import { ZoomScale } from '../camera/zoomScale';
import { easeFraction } from './cameraEase';
import { MAX_CHARACTER_SIGHT_RADIUS_TILES } from '../../vision/characterSight';

const FIELD_OF_VIEW_DEG = 60;
const HALF_HEIGHT_AT_UNIT_ZOOM_TILES = 9;
const CLOSEST_HALF_HEIGHT_TILES = 3;
const FARTHEST_HALF_HEIGHT_TILES = MAX_CHARACTER_SIGHT_RADIUS_TILES;
const MIN_MAGNIFICATION = HALF_HEIGHT_AT_UNIT_ZOOM_TILES / FARTHEST_HALF_HEIGHT_TILES;
const MAX_MAGNIFICATION = HALF_HEIGHT_AT_UNIT_ZOOM_TILES / CLOSEST_HALF_HEIGHT_TILES;
const FOCUS_SMOOTHING_RATE = 10;
const NEAR_PLANE = 0.1;
const HEADROOM_TILES = 32;

const NORTH_IS_SCREEN_UP = new THREE.Vector3(0, 0, -1);

export class TopDownCamera {
  readonly camera = new THREE.PerspectiveCamera(FIELD_OF_VIEW_DEG, 1, NEAR_PLANE, 1);

  private readonly zoom = new ZoomScale(1, MIN_MAGNIFICATION, MAX_MAGNIFICATION);
  private readonly pan = new PanOffset();
  private followX = 0;
  private followY = 0;
  private groundElevation = 0;
  private viewportHeightPx = 1;
  private snapOnNextUpdate = true;

  zoomByWheelPixels(wheelPixelsY: number): void {
    this.zoom.applyWheelPixels(wheelPixelsY);
  }

  panByDragPixels(dxPixels: number, dyPixels: number): void {
    const worldPerPixel = (2 * this.halfHeightTiles()) / this.viewportHeightPx;
    this.pan.shiftBy(-dxPixels * worldPerPixel, -dyPixels * worldPerPixel);
  }

  recenterOnPlayer(): void {
    this.pan.recenter();
  }

  snapToFocusOnNextUpdate(): void {
    this.snapOnNextUpdate = true;
  }

  setViewportSize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.viewportHeightPx = height;
    this.camera.updateProjectionMatrix();
  }

  focusPoint(): { x: number; y: number } {
    return { x: this.followX + this.pan.tilesX(), y: this.followY + this.pan.tilesY() };
  }

  visibleGroundRadiusTiles(): number {
    const halfHeight = this.halfHeightTiles();
    return Math.hypot(halfHeight * this.camera.aspect, halfHeight);
  }

  update(dtSeconds: number, targetX: number, targetY: number, groundElevation: number): void {
    if (this.snapOnNextUpdate) this.snapTo(targetX, targetY, groundElevation);
    else this.easeToward(dtSeconds, targetX, targetY, groundElevation);
    this.lookStraightDown();
  }

  private halfHeightTiles(): number {
    return HALF_HEIGHT_AT_UNIT_ZOOM_TILES / this.zoom.current();
  }

  private snapTo(targetX: number, targetY: number, groundElevation: number): void {
    this.followX = targetX;
    this.followY = targetY;
    this.groundElevation = groundElevation;
    this.snapOnNextUpdate = false;
  }

  private easeToward(
    dtSeconds: number,
    targetX: number,
    targetY: number,
    groundElevation: number,
  ): void {
    const step = easeFraction(FOCUS_SMOOTHING_RATE, dtSeconds);
    this.followX += (targetX - this.followX) * step;
    this.followY += (targetY - this.followY) * step;
    this.groundElevation += (groundElevation - this.groundElevation) * step;
  }

  private lookStraightDown(): void {
    const height = this.halfHeightTiles() / Math.tan(halfFieldOfViewRadians());
    this.setFarPlane(height + HEADROOM_TILES);
    const focus = this.focusPoint();
    const centerX = focus.x + 0.5;
    const centerZ = focus.y + 0.5;
    this.camera.up.copy(NORTH_IS_SCREEN_UP);
    this.camera.position.set(centerX, this.groundElevation + height, centerZ);
    this.camera.lookAt(centerX, this.groundElevation, centerZ);
  }

  private setFarPlane(far: number): void {
    if (this.camera.far === far) return;
    this.camera.far = far;
    this.camera.updateProjectionMatrix();
  }
}

function halfFieldOfViewRadians(): number {
  return (FIELD_OF_VIEW_DEG / 2) * (Math.PI / 180);
}
