import { useEffect, type RefObject } from 'react';

export function useDismissOnOutsideInteraction(
  popup: RefObject<HTMLElement | null>,
  anchor: HTMLElement,
  onDismiss: () => void,
): void {
  useEffect(() => {
    const isOutside = (target: EventTarget | null) =>
      target instanceof Node && !popup.current?.contains(target) && target !== anchor;
    const dismissWhenOutside = (event: Event) => {
      if (isOutside(event.target)) onDismiss();
    };
    document.addEventListener('pointerdown', dismissWhenOutside, true);
    window.addEventListener('scroll', dismissWhenOutside, true);
    window.addEventListener('resize', onDismiss);
    return () => {
      document.removeEventListener('pointerdown', dismissWhenOutside, true);
      window.removeEventListener('scroll', dismissWhenOutside, true);
      window.removeEventListener('resize', onDismiss);
    };
  }, [popup, anchor, onDismiss]);
}
