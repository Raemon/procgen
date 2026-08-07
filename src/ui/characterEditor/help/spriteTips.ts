import type { TooltipContent } from '../../tooltips/tooltipContent';

export const ADD_FRAME_TIP: TooltipContent = {
  title: 'add a frame',
  body: 'Appends an empty frame to this animation. Two or more frames make it move.',
};

export function frameTip(index: number): TooltipContent {
  return { title: `frame ${index}`, body: 'Click to paint this frame of the animation.' };
}

export function dropFrameTip(index: number): TooltipContent {
  return { title: `drop frame ${index}`, body: 'Removes this frame from the animation.' };
}
