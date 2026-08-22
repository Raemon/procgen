import type { TooltipContent } from '@/features/app-shell/tooltips/tooltipContent';

export function insertRowTip(name: string): TooltipContent {
  return {
    title: `insert ${name}`,
    body: 'Places one in the running world on the tile just ahead of the player, kept as a landmark point node in the world.',
  };
}

export function renameRowTip(name: string): TooltipContent {
  return {
    title: `rename ${name}`,
    body: 'Click to rename. Enter or clicking away keeps the new name, Esc leaves it as it was.',
  };
}

export function duplicateRowTip(name: string): TooltipContent {
  return { title: `duplicate ${name}`, body: 'Files a copy right below, with its own id and everything else the same.' };
}

export function deleteRowTip(name: string): TooltipContent {
  return { title: `delete ${name}`, body: 'Asks first. Nodes still pointing at it fall back to drawing nothing.' };
}

export function runRowTip(name: string, running: boolean): TooltipContent {
  return running
    ? { title: `${name} is running`, body: 'This is the world the game panel is showing. Editing it changes what you are looking at.' }
    : {
        title: `run ${name}`,
        body: 'Makes this the world the game panel shows. Selecting a world only opens it for editing; running one is what puts it on screen.',
      };
}

export function deleteRowConfirmation(name: string): { title: string; body: string; confirmLabel: string } {
  return {
    title: `delete ${name}?`,
    body: 'It leaves the library for good. Anything referencing it by id stops finding it.',
    confirmLabel: 'delete',
  };
}
