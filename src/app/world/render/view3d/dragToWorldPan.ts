export interface DragPixels {
  dxPixels: number;
  dyPixels: number;
}

export interface GroundView {
  yaw: number;
  worldPerPixel: number;
  pitchRadians: number;
}

export interface WorldPanDelta {
  dx: number;
  dy: number;
}

export function worldPanForDrag(drag: DragPixels, view: GroundView): WorldPanDelta {
  const across = drag.dxPixels * view.worldPerPixel;
  const into = (drag.dyPixels * view.worldPerPixel) / Math.sin(view.pitchRadians);
  return {
    dx: -Math.cos(view.yaw) * across + Math.sin(view.yaw) * into,
    dy: -Math.sin(view.yaw) * across - Math.cos(view.yaw) * into,
  };
}
