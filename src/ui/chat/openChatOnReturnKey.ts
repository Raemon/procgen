import { useEffect } from 'react';
import type { ChatComposerState } from '../../chat/chatComposerState';
import { hasModifier, isTypingInFormControl } from '../../input/movementKeys';

export function useOpenChatOnReturnKey(composer: ChatComposerState): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter' || event.repeat) return;
      if (isTypingInFormControl(event) || hasModifier(event)) return;
      if (returnKeyBelongsToFocusedControl(event.target)) return;
      event.preventDefault();
      composer.open();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [composer]);
}

function returnKeyBelongsToFocusedControl(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLButtonElement ||
    target instanceof HTMLAnchorElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
