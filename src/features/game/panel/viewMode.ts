export type ViewMode = '3d-god' | 'agent-god' | 'character' | 'agent-character' | 'features';

export const VIEW_MODES: readonly ViewMode[] = [
  '3d-god',
  'agent-god',
  'character',
  'agent-character',
  'features',
];

export function isViewMode(value: unknown): value is ViewMode {
  return VIEW_MODES.some((mode) => mode === value);
}

export function isCharacterControlled(mode: ViewMode): boolean {
  return mode === 'character' || mode === 'agent-character';
}

export function isGodView(mode: ViewMode): boolean {
  return mode === '3d-god' || mode === 'agent-god';
}

export function usesView3d(mode: ViewMode): boolean {
  return mode === '3d-god' || mode === 'character';
}

export function usesAgentText(mode: ViewMode): boolean {
  return mode === 'agent-god' || mode === 'agent-character';
}
