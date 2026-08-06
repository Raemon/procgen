const MAX_DEVICE_PIXEL_RATIO = 1.5;

export interface CanvasSize {
  cssWidth: number;
  cssHeight: number;
}

export function devicePixelRatioCapped(): number {
  return Math.min(MAX_DEVICE_PIXEL_RATIO, window.devicePixelRatio || 1);
}

export function containerSize(container: HTMLElement): CanvasSize {
  return { cssWidth: container.clientWidth, cssHeight: container.clientHeight };
}

export function isCollapsed({ cssWidth, cssHeight }: CanvasSize): boolean {
  return cssWidth === 0 || cssHeight === 0;
}

export function sizeCanvasToContainer(canvas: HTMLCanvasElement, size: CanvasSize): number {
  const ratio = devicePixelRatioCapped();
  canvas.width = Math.round(size.cssWidth * ratio);
  canvas.height = Math.round(size.cssHeight * ratio);
  canvas.style.width = `${size.cssWidth}px`;
  canvas.style.height = `${size.cssHeight}px`;
  return ratio;
}
