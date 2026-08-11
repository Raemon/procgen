import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

export const FPS_BADGE_TIP: TooltipContent = {
  title: 'frames per second',
  body: 'How many frames the browser painted over the last second. Click to open the load breakdown, click again to close it.',
  when: 'The world starts to feel sticky and you want to know which piece of work is eating the frame.',
};

export const FRAME_TIME_TIP: TooltipContent = {
  title: 'frame time',
  body: 'The gap between painted frames over the last second, averaged and at its worst. A worst frame far above the average is a stutter rather than a slow world.',
};

export const WORK_BREAKDOWN_TIP: TooltipContent = {
  title: 'work in this tab',
  body: 'Milliseconds each timed piece of work spent per second of wall clock, so 1000 ms/s means it is saturating a whole second. Chunk meshing nests inside procgen sampling, so the rows overlap rather than adding up to the frame.',
  when: 'Deciding whether a slow world is the procgen pipeline, the mesh build, the lights or the GPU.',
};

export const BROWSER_LOAD_TIP: TooltipContent = {
  title: 'this tab',
  body: 'What this browser tab is carrying: the JavaScript heap it holds, the machine it is running on, long tasks that blocked the main thread, and what the last frame asked the GPU to draw.',
};

export const SERVER_LOAD_TIP: TooltipContent = {
  title: 'game server',
  body: 'The node process serving this page — its CPU share, memory and event-loop lag — plus the heaviest processes on the host. The host list is only sent when the page is being served from your own machine.',
  when: 'Frames are fine but movement is jerky, which points at the server rather than the renderer.',
};
