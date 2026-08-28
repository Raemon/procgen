import { hasModifier, isTypingInFormControl } from './movementKeys';

export interface KeyPressDeps {
  isSuspended(): boolean;
}

export function listenForKeyPresses(
  actions: Readonly<Record<string, () => void>>,
  deps: KeyPressDeps,
  allowsPress: (event: KeyboardEvent) => boolean = () => true,
): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    const action = actions[event.code];
    if (!action) return;
    if (event.repeat || isTypingInFormControl(event) || hasModifier(event)) return;
    if (!allowsPress(event) || deps.isSuspended()) return;
    event.preventDefault();
    action();
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}
