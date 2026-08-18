import '@/features/asset-library/worlds/features';
import type { Feature } from '@/features/asset-library/worlds/features/feature';
import { listenForDragPan } from '../camera/dragPanListener';
import { PanOffset } from '../camera/panOffset';
import { listenForWheelZoom } from '../camera/wheelZoomListener';
import { containerSize, isCollapsed, sizeCanvasToContainer, type CanvasSize } from '../canvasSurface';
import type { WorldViewDeps } from '../worldViewDeps';
import { FeatureDetailCard } from './featureDetailCard';
import { FeatureLegend } from './featureLegend';
import { pickFeatureAt } from './featurePicking';
import { featuresCameraOf, worldOfScreen, type FeaturesCamera } from './featuresCamera';
import { FEATURE_LABEL_FONT, paintFeatureScene } from './featuresPainter';
import { FeatureVisibility } from './featureVisibility';
import { buildFeatureScene, type FeatureScene } from './featuresScene';
import { clampedPixelsPerTile, surveyRectOf } from './featuresSurveyRect';
import { SurveyedFeatures } from './surveyedFeatures';

const DEFAULT_PIXELS_PER_TILE = 8;
const WHEEL_PIXELS_PER_DOUBLING = 420;

export class FeaturesView {
  private readonly canvas = document.createElement('canvas');
  private readonly pan = new PanOffset();
  private readonly surveyed: SurveyedFeatures;
  private readonly visibility = new FeatureVisibility();
  private readonly legend: FeatureLegend;
  private readonly card: FeatureDetailCard;
  private pixelsPerTile = DEFAULT_PIXELS_PER_TILE;
  private scene: FeatureScene | null = null;
  private featuresByKey = new Map<string, Feature>();

  constructor(
    private readonly container: HTMLElement,
    private readonly deps: WorldViewDeps,
  ) {
    this.canvas.className = 'absolute inset-0 touch-none';
    container.appendChild(this.canvas);
    this.legend = new FeatureLegend(container, this.visibility, () => this.draw());
    this.card = new FeatureDetailCard(container);
    this.surveyed = new SurveyedFeatures(deps.store, deps.evaluator);
    listenForDragPan(this.canvas, (dx, dy) => this.panByPixels(dx, dy));
    listenForWheelZoom(this.canvas, (pixelsY) => this.zoomByWheelPixels(pixelsY));
    this.canvas.addEventListener('pointermove', (event) => this.hoverAt(event.offsetX, event.offsetY));
    this.canvas.addEventListener('pointerleave', () => this.endHover());
  }

  draw(): void {
    const size = containerSize(this.container);
    if (isCollapsed(size)) return;
    const ratio = sizeCanvasToContainer(this.canvas, size);
    const camera = this.cameraFor(size);
    const surveyed = this.surveyed.featuresFor(surveyRectOf(camera));
    const shown = surveyed.filter((feature) => !this.visibility.isHidden(feature.nodeId));
    this.featuresByKey = new Map(shown.map((feature) => [feature.key, feature]));
    this.paint(camera, shown, ratio);
    this.legend.update(surveyed);
  }

  recenterOnPlayer(): void {
    this.pan.recenter();
    this.draw();
  }

  dispose(): void {
    this.legend.dispose();
    this.card.dispose();
    this.canvas.remove();
  }

  private paint(camera: FeaturesCamera, features: Feature[], ratio: number): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.font = FEATURE_LABEL_FONT;
    this.scene = buildFeatureScene(features, camera, (text) => ctx.measureText(text).width);
    paintFeatureScene(ctx, camera.widthPx, camera.heightPx, this.scene, (nodeId) =>
      this.visibility.opacityOf(nodeId),
    );
  }

  private cameraFor(size: CanvasSize): FeaturesCamera {
    this.pixelsPerTile = clampedPixelsPerTile(this.pixelsPerTile);
    const player = { x: this.deps.world.playerX, y: this.deps.world.playerY };
    return featuresCameraOf(player, this.pan, this.pixelsPerTile, size);
  }

  private panByPixels(dxPixels: number, dyPixels: number): void {
    this.pan.shiftBy(-dxPixels / this.pixelsPerTile, -dyPixels / this.pixelsPerTile);
    this.draw();
  }

  private zoomByWheelPixels(wheelPixelsY: number): void {
    this.pixelsPerTile *= Math.pow(2, -wheelPixelsY / WHEEL_PIXELS_PER_DOUBLING);
    this.draw();
  }

  private hoverAt(offsetX: number, offsetY: number): void {
    const camera = this.cameraFor(containerSize(this.container));
    const world = worldOfScreen(camera, offsetX, offsetY);
    this.deps.hoveredTile.hover({ x: Math.floor(world.x), y: Math.floor(world.y) });
    this.showCardAt(offsetX, offsetY);
  }

  private showCardAt(offsetX: number, offsetY: number): void {
    const picked = this.scene && pickFeatureAt(this.scene.targets, offsetX, offsetY);
    if (picked) this.card.show(picked, this.featuresByKey, offsetX, offsetY);
    else this.card.hide();
  }

  private endHover(): void {
    this.card.hide();
    this.deps.hoveredTile.clear();
  }
}
