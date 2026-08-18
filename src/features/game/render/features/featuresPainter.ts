import { colorOfCategory } from './featureColors';
import type { FeatureEdge } from './featureEdges';
import type { PlacedLabel } from './featureLabelLayout';
import type { PickTarget } from './featurePicking';
import type { FeatureScene, SurveyBounds } from './featuresScene';

export const FEATURE_LABEL_FONT = '11px ui-monospace, monospace';

export type NodeOpacity = (nodeId: string) => number;

export function paintFeatureScene(
  ctx: CanvasRenderingContext2D,
  widthPx: number,
  heightPx: number,
  scene: FeatureScene,
  opacityOf: NodeOpacity = () => 1,
): void {
  ctx.fillStyle = '#11151b';
  ctx.fillRect(0, 0, widthPx, heightPx);
  if (scene.surveyBounds) paintSurveyBounds(ctx, scene.surveyBounds);
  for (const edge of scene.edges) withOpacity(ctx, opacityOf(edge.nodeId), () => paintEdge(ctx, edge));
  for (const target of scene.targets) {
    withOpacity(ctx, opacityOf(target.cluster.feature.nodeId), () => paintTarget(ctx, target));
  }
  paintLabels(ctx, scene.labels, opacityOf);
}

function withOpacity(ctx: CanvasRenderingContext2D, opacity: number, paint: () => void): void {
  const previous = ctx.globalAlpha;
  ctx.globalAlpha = previous * opacity;
  paint();
  ctx.globalAlpha = previous;
}

function paintSurveyBounds(ctx: CanvasRenderingContext2D, bounds: SurveyBounds): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(148,163,184,0.35)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeRect(bounds.x, bounds.y, bounds.widthPx, bounds.heightPx);
  ctx.restore();
}

function paintEdge(ctx: CanvasRenderingContext2D, edge: FeatureEdge): void {
  ctx.strokeStyle = edge.kind === 'parent' ? 'rgba(226,232,240,0.4)' : 'rgba(226,232,240,0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(edge.from.x, edge.from.y);
  if (edge.control) ctx.quadraticCurveTo(edge.control.x, edge.control.y, edge.to.x, edge.to.y);
  else ctx.lineTo(edge.to.x, edge.to.y);
  ctx.stroke();
}

function paintTarget(ctx: CanvasRenderingContext2D, target: PickTarget): void {
  const color = colorOfCategory(target.cluster.feature.category);
  if (target.shape.kind === 'rect') paintRect(ctx, target, color);
  else paintDot(ctx, target, color);
}

function paintRect(ctx: CanvasRenderingContext2D, target: PickTarget, color: string): void {
  if (target.shape.kind !== 'rect') return;
  const { x, y, width, height } = target.shape;
  withOpacity(ctx, 0.25, () => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  });
  ctx.strokeStyle = color;
  ctx.strokeRect(x, y, width, height);
}

function paintDot(ctx: CanvasRenderingContext2D, target: PickTarget, color: string): void {
  if (target.shape.kind !== 'dot') return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(target.shape.x, target.shape.y, target.shape.radius, 0, Math.PI * 2);
  ctx.fill();
}

function paintLabels(
  ctx: CanvasRenderingContext2D,
  labels: readonly PlacedLabel[],
  opacityOf: NodeOpacity,
): void {
  ctx.font = FEATURE_LABEL_FONT;
  ctx.fillStyle = '#e2e8f0';
  for (const label of labels) {
    withOpacity(ctx, opacityOf(label.nodeId), () =>
      ctx.fillText(label.text, label.x, label.y + label.heightPx - 3),
    );
  }
}
