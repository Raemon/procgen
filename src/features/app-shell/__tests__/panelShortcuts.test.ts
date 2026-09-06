import type { CheckReporter } from './reporter';
import { panelShortcutLabel, shortcutColumnIndex } from '../layout/panelShortcut';
import type { ColumnKey } from '../layout/usePanelLayout';

const WITHOUT_A_SELECTED_AGENT: ColumnKey[] = ['library', 'detail', 'agents', 'worlds', 'game'];
const WITH_A_SELECTED_AGENT: ColumnKey[] = ['library', 'detail', 'agents', 'log', 'worlds', 'game'];

export function checkPanelShortcuts(check: CheckReporter): void {
  checkACommandDigitNamesTheColumnAtThatPlace(check);
  checkOnlyACommandDigitCounts(check);
  checkEveryColumnOnScreenHasALabelThatMatchesItsKey(check);
}

function checkACommandDigitNamesTheColumnAtThatPlace(check: CheckReporter): void {
  check(
    'command-1 reaches the leftmost column and command-4 the fourth one',
    columnPressed('Digit1', WITHOUT_A_SELECTED_AGENT) === 'library' &&
      columnPressed('Digit4', WITHOUT_A_SELECTED_AGENT) === 'worlds',
  );
  check(
    'the world view is the last column a digit can reach',
    columnPressed('Digit5', WITHOUT_A_SELECTED_AGENT) === 'game' &&
      columnPressed('Digit6', WITH_A_SELECTED_AGENT) === 'game',
  );
  check(
    'the agent log takes the fourth place while it is on screen, pushing worlds along',
    columnPressed('Digit4', WITH_A_SELECTED_AGENT) === 'log' &&
      columnPressed('Digit5', WITH_A_SELECTED_AGENT) === 'worlds',
  );
  check(
    'a digit past the last column toggles nothing',
    columnPressed('Digit6', WITHOUT_A_SELECTED_AGENT) === null &&
      columnPressed('Digit9', WITH_A_SELECTED_AGENT) === null,
  );
  check(
    'the number pad works the same as the digit row',
    columnPressed('Numpad2', WITHOUT_A_SELECTED_AGENT) === 'detail',
  );
}

function checkOnlyACommandDigitCounts(check: CheckReporter): void {
  check(
    'a bare digit is left to whatever is typing, and control stands in for command off the mac',
    shortcutColumnIndex(press('Digit1', {})) === null &&
      shortcutColumnIndex(press('Digit1', { ctrlKey: true })) === 0,
  );
  check(
    'adding shift or alt gives the press back to the browser rather than folding a column',
    shortcutColumnIndex(press('Digit1', { metaKey: true, shiftKey: true })) === null &&
      shortcutColumnIndex(press('Digit1', { metaKey: true, altKey: true })) === null,
  );
  check(
    'command with anything but a digit is not a panel shortcut',
    shortcutColumnIndex(press('KeyS', { metaKey: true })) === null &&
      shortcutColumnIndex(press('Digit0', { metaKey: true })) === null,
  );
}

function checkEveryColumnOnScreenHasALabelThatMatchesItsKey(check: CheckReporter): void {
  const labels = WITH_A_SELECTED_AGENT.map((_, index) => panelShortcutLabel(index, true));
  check(
    'every column on screen offers a distinct label naming the digit that toggles it',
    labels.join() === '⌘1,⌘2,⌘3,⌘4,⌘5,⌘6',
  );
  check(
    'the label spells out control where there is no command key',
    panelShortcutLabel(0, false) === 'Ctrl+1',
  );
  check(
    'a column no digit can reach is offered no label to promise one',
    panelShortcutLabel(-1, true) === undefined && panelShortcutLabel(9, true) === undefined,
  );
}

function columnPressed(code: string, columns: readonly ColumnKey[]): ColumnKey | null {
  const index = shortcutColumnIndex(press(code, { metaKey: true }));
  return index === null ? null : (columns[index] ?? null);
}

function press(code: string, held: Partial<Record<string, boolean>>) {
  return {
    code,
    metaKey: held.metaKey === true,
    ctrlKey: held.ctrlKey === true,
    altKey: held.altKey === true,
    shiftKey: held.shiftKey === true,
  };
}
