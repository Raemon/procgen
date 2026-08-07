import type { TooltipContent } from '../../tooltips/tooltipContent';
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
