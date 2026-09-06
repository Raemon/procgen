export interface ShortcutPress {
  code: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

const DIGIT_CODE = /^(?:Digit|Numpad)([1-9])$/;
const LAST_SHORTCUT_COLUMN = 9;

export function shortcutColumnIndex(press: ShortcutPress): number | null {
  if (press.altKey || press.shiftKey) return null;
  if (!press.metaKey && !press.ctrlKey) return null;
  const digit = DIGIT_CODE.exec(press.code);
  return digit ? Number(digit[1]) - 1 : null;
}

export function panelShortcutLabel(index: number, onApple = runningOnApple()): string | undefined {
  if (index < 0 || index >= LAST_SHORTCUT_COLUMN) return undefined;
  return onApple ? `⌘${index + 1}` : `Ctrl+${index + 1}`;
}

function runningOnApple(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}
