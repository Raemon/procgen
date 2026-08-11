export type ViewMode = '3d-god' | 'agent-god' | 'character' | 'agent-character' | 'features';

export const VIEW_MODES: readonly { id: ViewMode; label: string }[] = [
  { id: '3d-god', label: '3-D God' },
  { id: 'agent-god', label: 'Agent God' },
  { id: 'character', label: '2.5D Character' },
  { id: 'agent-character', label: 'Agent Character' },
  { id: 'features', label: 'Features' },
];

export function isCharacterControlled(mode: ViewMode): boolean {
  return mode === 'character' || mode === 'agent-character';
}

export function usesView3d(mode: ViewMode): boolean {
  return mode === '3d-god' || mode === 'character';
}
