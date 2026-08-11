import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';
import type { PaintTool } from '../paintSettings';

export const PAINT_COLOR_TIP: TooltipContent = {
  title: 'paint colour',
  body: 'The colour draw and fill lay down. Pick lifts a colour off the canvas into this swatch.',
};

export const RESOLUTION_TIP: TooltipContent = {
  title: 'art resolution',
  body: 'Pixels per cube face. Changing it rescales the art you already have rather than discarding it.',
};

export const TILED_PREVIEW_TIP: TooltipContent = {
  title: 'tiling preview',
  body: 'This face repeated 3×3. Seams and edges that do not line up show up here first.',
};

export const SHIFT_TIP: TooltipContent = {
  title: 'shift one pixel',
  body: 'Slides the face by a pixel, wrapping what falls off the edge back in — the usual way to line a pattern up for seamless tiling.',
};

export const PAINT_TOOL_TIPS: Readonly<Record<PaintTool, TooltipContent>> = {
  draw: { title: 'draw', body: 'Click or drag to paint pixels in the current colour.' },
  erase: { title: 'erase', body: 'Resets pixels to the base colour of the tile or creature.' },
  fill: { title: 'fill', body: 'Flood-fills the connected region under the cursor.' },
  pick: { title: 'pick', body: 'Takes the colour under the cursor as the paint colour.' },
};

export const PAINT_EDIT_TIPS = {
  mirrorX: {
    title: 'mirror left↔right',
    body: 'Every stroke is echoed across the vertical centre line while this is on.',
  },
  mirrorY: {
    title: 'mirror top↕bottom',
    body: 'Every stroke is echoed across the horizontal centre line while this is on.',
  },
  undo: { title: 'undo', body: 'Steps back through the strokes made in this editor.' },
  copy: { title: 'copy face', body: 'Puts this face on the clipboard shared by every art editor.' },
  paste: { title: 'paste face', body: 'Overwrites this face with the copied one, rescaled to fit.' },
  clear: { title: 'clear face', body: 'Resets every pixel of this face to the base colour.' },
} as const satisfies Record<string, TooltipContent>;

export const LAYER_TIPS = {
  color: {
    title: 'colour layer',
    body: 'The pixels you see. This is the ordinary drawing surface.',
  },
  height: {
    title: 'relief layer',
    body: 'A greyscale height field painted over the same grid. Light is high, dark is low, and the 3D view turns it into a normal map so lamps and sunlight catch the bumps. Untouched pixels stay flat.',
  },
} as const satisfies Record<string, TooltipContent>;

export const HEIGHT_SLIDER_TIP: TooltipContent = {
  title: 'relief height',
  body: 'How far this brush pushes the surface out or in, from a deep pit at the left to a raised ridge at the right.',
};

export const ADD_FRAME_TIP: TooltipContent = {
  title: 'add a frame',
  body: 'Copies the current frame in after it. Frames play in a loop, so make the last one lead back into the first.',
};

export const REMOVE_FRAME_TIP: TooltipContent = {
  title: 'remove this frame',
  body: 'Drops the frame being edited. Art with one frame is a still picture again.',
};

export const FRAME_MS_TIP: TooltipContent = {
  title: 'frame length',
  body: 'Milliseconds each frame is held for. The whole loop takes this times the number of frames.',
};

export function frameTip(frame: number, frameCount: number): TooltipContent {
  return {
    title: `frame ${frame + 1} of ${frameCount}`,
    body: 'Paints this frame of the animation. Every face and both layers have their own copy of it.',
  };
}

export function playFramesTip(playing: boolean): TooltipContent {
  return {
    title: playing ? 'stop the loop' : 'play the loop',
    body: 'Cycles the frames at the frame length, in the canvas and the tiling preview, so you can judge the motion before it reaches the world.',
  };
}

export function heightSwatchTip(height: number): TooltipContent {
  return {
    title: `${Math.round(height * 100)}% height`,
    body: 'Paints this height. The middle swatch is flat, darker sinks, lighter rises.',
  };
}

export function faceTabTip(tab: string): TooltipContent {
  return { title: `${tab} face`, body: 'Paints this face of the cube.' };
}

export function linkSidesTip(linkedSides: boolean): TooltipContent {
  return {
    title: linkedSides ? 'sides are linked' : 'link the sides',
    body: linkedSides
      ? 'North, east, south and west share one drawing. Unlink to paint each of them separately.'
      : 'Copies the current side to all four and edits them together — the usual choice for anything that should look the same from any angle.',
  };
}
