// View3D — the 2.5d world view. Three.js, one InstancedMesh per shape class
// (floors, rocks, trees) so a 128x128 world is a handful of draw calls, not
// 16k meshes.
//
// The camera is a minimal cut of chunkmaze's CameraRig: an elevated follow
// camera whose yaw chases a discrete target through the SHORTEST arc, and
// whose focus chases the player's tile, both on exponential smoothing. Q/E
// snap the target a quarter-turn; the swing you see is the animation. Yaw 0
// looks north (-Z), world tile (x, y) spans [x, x+1] on X and Z with Y up —
// chunkmaze's mapping exactly.

import * as THREE from 'three';
import { EMPTY } from './grid';
import type { Tileset } from './tiles';
import type { World } from './world';

/** Device pixel ratio ceiling, per chunkmaze's Renderer3D: past ~1.5 the cost
 *  is real and the gain is not. */
const MAX_DPR = 1.5;

/** Yaw smoothing rate — ~150ms swing, the chunkmaze turn feel. */
const TURN_K = 14;
/** Focus follow rate. Softer than the turn, so steps read as a glide. */
const MOVE_K = 10;

/** Camera elevation angle above the horizon, degrees. */
const PITCH_DEG = 52;
const ZOOM_MIN = 6;
const ZOOM_MAX = 40;
const ZOOM_START = 16;

const FLOOR_T = 0.1;
/** How far below grade water sits. */
const WATER_DROP = 0.22;
const ROCK_H = 1;
const TREE_H = 1.4;

export class View3D {
  readonly canvas: HTMLCanvasElement;

  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly worldGroup = new THREE.Group();
  private readonly player: THREE.Mesh;
  private readonly resizeObserver: ResizeObserver;
  private raf = 0;
  private lastT = 0;

  /** Camera facing in quarter-turns, 0 = north. What movement is relative to. */
  private quadrant = 0;
  private yaw = 0;
  private yawTarget = 0;
  private fx = 0;
  private fy = 0;
  private zoom = ZOOM_START;
  private snapNext = true;

  constructor(
    private readonly container: HTMLElement,
    private readonly world: World,
    private readonly tileset: Tileset,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.canvas = this.renderer.domElement;
    this.canvas.className = 'view3d-canvas';
    container.appendChild(this.canvas);

    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
    this.scene.background = new THREE.Color('#0a0d13');
    this.scene.add(this.worldGroup);

    this.scene.add(new THREE.AmbientLight(0xbfd0e0, 0.55));
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.6);
    sun.position.set(40, 60, 25);
    this.scene.add(sun);

    this.player = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.3, 0.5, 4, 12),
      new THREE.MeshLambertMaterial({ color: 0xffd86a }),
    );
    this.scene.add(this.player);

    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, this.zoom + e.deltaY * 0.02));
      },
      { passive: false },
    );

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.rebuild();

    const frame = (t: number): void => {
      this.update(Math.min(100, t - this.lastT));
      this.lastT = t;
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    this.clearWorld();
    this.renderer.dispose();
    this.canvas.remove();
  }

  /** The facing movement should be relative to. */
  yawQuadrant(): number {
    return ((this.quadrant % 4) + 4) % 4;
  }

  /** Q/E: swing the camera a quarter-turn. The swing itself is animated. */
  rotate(dir: -1 | 1): void {
    this.quadrant = (((this.quadrant + dir) % 4) + 4) % 4;
    this.yawTarget = (this.quadrant * Math.PI) / 2;
  }

  /** A new world exists: rebuild the meshes and snap the camera to the spawn. */
  onGenerated(): void {
    this.rebuild();
    this.snapNext = true;
  }

  /** Tile colors/shapes may have changed. */
  onTilesetChanged(): void {
    this.rebuild();
  }

  // ---- scene building -------------------------------------------------------

  private clearWorld(): void {
    for (const child of [...this.worldGroup.children]) {
      this.worldGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const m = child.material;
        for (const mat of Array.isArray(m) ? m : [m]) mat.dispose();
      }
    }
  }

  private rebuild(): void {
    this.clearWorld();
    const grid = this.world.grid;

    // One pass to bucket tiles by shape class.
    interface Placed {
      x: number;
      y: number;
      color: THREE.Color;
      water: boolean;
    }
    const floors: Placed[] = [];
    const rocks: Placed[] = [];
    const trees: Placed[] = [];
    const color = new THREE.Color();
    grid.forEach((x, y, t) => {
      if (t === EMPTY) return;
      const def = this.tileset.byId(t);
      if (!def) return;
      color.set(def.color);
      const role = def.role;
      if (role === 'water') {
        floors.push({ x, y, color: color.clone().multiplyScalar(0.7), water: true });
      } else if (role === 'rock' || (!def.walkable && role !== 'tree')) {
        // Rock and any custom blocker read as a solid block; give it a floor too
        // so gaps never show at the base.
        floors.push({ x, y, color: color.clone().multiplyScalar(0.8), water: false });
        rocks.push({ x, y, color: color.clone(), water: false });
      } else if (role === 'tree') {
        // A tree stands on grass-colored ground.
        const grass = this.tileset.byRole('grass');
        floors.push({
          x,
          y,
          color: new THREE.Color(grass?.color ?? '#3c5a34'),
          water: false,
        });
        trees.push({ x, y, color: color.clone(), water: false });
      } else {
        floors.push({ x, y, color: color.clone(), water: false });
      }
    });

    this.addInstanced(
      new THREE.BoxGeometry(1, FLOOR_T, 1),
      floors,
      (p) => [p.x + 0.5, (p.water ? -WATER_DROP : 0) - FLOOR_T / 2, p.y + 0.5],
    );
    this.addInstanced(new THREE.BoxGeometry(0.95, ROCK_H, 0.95), rocks, (p) => [
      p.x + 0.5,
      ROCK_H / 2,
      p.y + 0.5,
    ]);
    this.addInstanced(new THREE.ConeGeometry(0.42, TREE_H, 7), trees, (p) => [
      p.x + 0.5,
      TREE_H / 2,
      p.y + 0.5,
    ]);
  }

  private addInstanced(
    geometry: THREE.BufferGeometry,
    placed: { x: number; y: number; color: THREE.Color }[],
    position: (p: { x: number; y: number; water: boolean }) => [number, number, number],
  ): void {
    if (placed.length === 0) {
      geometry.dispose();
      return;
    }
    const mesh = new THREE.InstancedMesh(
      geometry,
      new THREE.MeshLambertMaterial(),
      placed.length,
    );
    const m = new THREE.Matrix4();
    for (let i = 0; i < placed.length; i++) {
      const p = placed[i]! as { x: number; y: number; color: THREE.Color; water: boolean };
      const [px, py, pz] = position(p);
      m.makeTranslation(px, py, pz);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, p.color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    this.worldGroup.add(mesh);
  }

  // ---- per-frame ------------------------------------------------------------

  private resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setPixelRatio(Math.min(MAX_DPR, window.devicePixelRatio || 1));
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private update(dtMs: number): void {
    if (this.container.clientWidth === 0) return; // hidden panel: skip
    const dt = dtMs / 1000;
    const px = this.world.playerX;
    const py = this.world.playerY;

    if (this.snapNext) {
      this.fx = px;
      this.fy = py;
      this.yaw = this.yawTarget;
      this.snapNext = false;
    } else {
      const ma = 1 - Math.exp(-MOVE_K * dt);
      this.fx += (px - this.fx) * ma;
      this.fy += (py - this.fy) * ma;
      const ta = 1 - Math.exp(-TURN_K * dt);
      this.yaw += shortestArc(this.yaw, this.yawTarget) * ta;
    }

    this.player.position.set(px + 0.5, 0.55, py + 0.5);

    // Forward is (sin yaw, -cos yaw) on XZ; the camera sits behind and above
    // the focus along that axis, tilted PITCH_DEG above the horizon.
    const pitch = (PITCH_DEG * Math.PI) / 180;
    const horiz = this.zoom * Math.cos(pitch);
    const height = this.zoom * Math.sin(pitch);
    const cx = this.fx + 0.5;
    const cz = this.fy + 0.5;
    const fwdX = Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);
    this.camera.position.set(cx - fwdX * horiz, height, cz - fwdZ * horiz);
    this.camera.lookAt(cx, 0, cz);

    this.renderer.render(this.scene, this.camera);
  }
}

const TAU = Math.PI * 2;

/** Signed shortest angular delta from `from` to `to`, in (-PI, PI]. Borrowed
 *  from chunkmaze's cameraModes: turning right four times must swing on round,
 *  not unwind 270° the other way. */
function shortestArc(from: number, to: number): number {
  let d = (to - from) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d <= -Math.PI) d += TAU;
  return d;
}
