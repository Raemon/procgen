import { CHARACTER_SIGHT_RADIUS_TILES } from '../../world/vision/characterSight';

export type ViewMode = '3d-god' | 'agent-god' | 'character' | 'agent-character';

export const VIEW_MODES: readonly { id: ViewMode; label: string }[] = [
  { id: '3d-god', label: '3-D God' },
  { id: 'agent-god', label: 'Agent God' },
  { id: 'character', label: '2.5D Character' },
  { id: 'agent-character', label: 'Agent Character' },
];

export function isCharacterControlled(mode: ViewMode): boolean {
  return mode === 'character' || mode === 'agent-character';
}

export function usesView3d(mode: ViewMode): boolean {
  return mode === '3d-god' || mode === 'character';
}

export const MODE_HINTS: Readonly<Record<ViewMode, string>> = {
  '3d-god':
    'WASD/arrows move (camera-relative) · Q/E rotate camera · wheel zoom · drag pan · double-click recenters',
  'agent-god': 'WASD/arrows move (compass) · this text is exactly what a god-mode API agent receives',
  character: `first person · W/S forward/back · A/D strafe · Q/E turn 45° · wheel narrows the field of view · fog closes in at ${CHARACTER_SIGHT_RADIUS_TILES} tiles, exactly what Agent Character sees`,
  'agent-character':
    'W/S forward/back · A/D strafe · Q/E turn 45° · this text is exactly what a character-mode API agent receives',
};
