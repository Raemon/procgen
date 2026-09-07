import type { FramedCamera } from './framedCamera';
import { TopDownCamera } from './topDownCamera';
import { wheelPixelsReaching } from './wheelPixelsReaching';

export interface TopDownShotFrame {
  x: number;
  y: number;
  groundElevation: number;
  width: number;
  height: number;
  cameraDistanceTiles: number | null;
}

export function topDownFramedCamera(frame: TopDownShotFrame): FramedCamera {
  const overhead = zoomedTopDownCamera(frame);
  return {
    camera: overhead.camera,
    update: () => overhead.update(0, frame.x, frame.y, frame.groundElevation),
    focusPoint: () => overhead.focusPoint(),
    visibleRadiusTiles: () => overhead.visibleGroundRadiusTiles(),
    fogSightRadiusTiles: () => null,
  };
}

function zoomedTopDownCamera(frame: TopDownShotFrame): TopDownCamera {
  const overhead = viewportSizedTopDownCamera(frame);
  if (frame.cameraDistanceTiles === null) return overhead;
  overhead.zoomByWheelPixels(
    wheelPixelsReaching(frame.cameraDistanceTiles, (wheelPixels) =>
      visibleRadiusAfterWheelPixels(frame, wheelPixels),
    ),
  );
  return overhead;
}

function visibleRadiusAfterWheelPixels(frame: TopDownShotFrame, wheelPixels: number): number {
  const trial = viewportSizedTopDownCamera(frame);
  trial.zoomByWheelPixels(wheelPixels);
  return trial.visibleGroundRadiusTiles();
}

function viewportSizedTopDownCamera(frame: TopDownShotFrame): TopDownCamera {
  const overhead = new TopDownCamera();
  overhead.setViewportSize(frame.width, frame.height);
  return overhead;
}
