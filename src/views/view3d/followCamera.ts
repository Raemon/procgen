import * as THREE from 'three';

const TURN_SMOOTHING_RATE = 14;
const FOCUS_SMOOTHING_RATE = 10;
const PITCH_DEG = 52;
const ZOOM_MIN = 6;
const ZOOM_MAX = 40;
const ZOOM_START = 16;
const QUARTER_TURN = Math.PI / 2;
const TAU = Math.PI * 2;

export class FollowCamera {
  readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);

  private quadrant = 0;
  private yaw = 0;
  private yawTarget = 0;
  private focusX = 0;
  private focusY = 0;
  private zoom = ZOOM_START;
  private snapOnNextUpdate = true;

  yawQuadrant(): number {
    return this.quadrant;
  }

  rotate(direction: -1 | 1): void {
    this.quadrant = (((this.quadrant + direction) % 4) + 4) % 4;
    this.yawTarget = this.quadrant * QUARTER_TURN;
  }

  zoomBy(delta: number): void {
    this.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this.zoom + delta));
  }

  snapToFocusOnNextUpdate(): void {
    this.snapOnNextUpdate = true;
  }

  setAspect(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update(dtSeconds: number, targetX: number, targetY: number): void {
    if (this.snapOnNextUpdate) this.snapTo(targetX, targetY);
    else this.easeToward(dtSeconds, targetX, targetY);
    this.placeCameraBehindFocus();
  }

  private snapTo(targetX: number, targetY: number): void {
    this.focusX = targetX;
    this.focusY = targetY;
    this.yaw = this.yawTarget;
    this.snapOnNextUpdate = false;
  }

  private easeToward(dtSeconds: number, targetX: number, targetY: number): void {
    const focusStep = easeFraction(FOCUS_SMOOTHING_RATE, dtSeconds);
    this.focusX += (targetX - this.focusX) * focusStep;
    this.focusY += (targetY - this.focusY) * focusStep;
    this.yaw += shortestArc(this.yaw, this.yawTarget) * easeFraction(TURN_SMOOTHING_RATE, dtSeconds);
  }

  private placeCameraBehindFocus(): void {
    const pitch = (PITCH_DEG * Math.PI) / 180;
    const distanceBehind = this.zoom * Math.cos(pitch);
    const centerX = this.focusX + 0.5;
    const centerZ = this.focusY + 0.5;
    this.camera.position.set(
      centerX - Math.sin(this.yaw) * distanceBehind,
      this.zoom * Math.sin(pitch),
      centerZ + Math.cos(this.yaw) * distanceBehind,
    );
    this.camera.lookAt(centerX, 0, centerZ);
  }
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
