import { useEffect, useRef } from 'react';
import { shortcutColumnIndex } from './panelShortcut';
import type { ColumnKey } from './usePanelLayout';

export function usePanelShortcuts(
  columns: readonly ColumnKey[],
  toggleCollapsed: (key: ColumnKey) => void,
): void {
  const pressed = useRef({ columns, toggleCollapsed });
  pressed.current = { columns, toggleCollapsed };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const index = shortcutColumnIndex(event);
      if (index === null) return;
      const column = pressed.current.columns[index];
      if (!column) return;
      event.preventDefault();
      pressed.current.toggleCollapsed(column);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
