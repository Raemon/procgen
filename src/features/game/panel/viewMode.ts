import type { CommandMode } from '@/features/app-shell/runtime/commands/command';

export type ViewMode =
  | '3d-god'
  | 'agent-god'
  | 'top-down'
  | 'agent-top-down'
  | 'character'
  | 'agent-character'
  | 'features';

export const VIEW_MODES: readonly ViewMode[] = [
  '3d-god',
  'agent-god',
  'top-down',
  'agent-top-down',
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

export function isTopDownView(mode: ViewMode): boolean {
  return mode === 'top-down' || mode === 'agent-top-down';
}

export function usesView3d(mode: ViewMode): boolean {
  return mode === '3d-god' || mode === 'character' || mode === 'top-down';
}

export function usesAgentText(mode: ViewMode): boolean {
  return mode === 'agent-god' || mode === 'agent-character' || mode === 'agent-top-down';
}

export function usesCompassMovement(mode: ViewMode): boolean {
  return isGodView(mode) || isTopDownView(mode);
}

export function usesSightRadius(mode: ViewMode): boolean {
  return isCharacterControlled(mode) || isTopDownView(mode);
}

export function commandModeOf(mode: ViewMode): CommandMode {
  if (isCharacterControlled(mode)) return 'character';
  return isTopDownView(mode) ? 'topdown' : 'god';
}
