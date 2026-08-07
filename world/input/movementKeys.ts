export type MovementAxis = 'forward' | 'back' | 'left' | 'right';

const MOVEMENT_KEYS: Readonly<Record<string, MovementAxis>> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyQ: 'left',
  KeyC: 'right',
};

export function movementAxisForKey(code: string): MovementAxis | undefined {
  return MOVEMENT_KEYS[code];
}

export function isTypingInFormControl(event: KeyboardEvent): boolean {
  return (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    event.target instanceof HTMLSelectElement
  );
}

export function hasModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey || event.altKey;
}
