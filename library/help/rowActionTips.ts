import type { TooltipContent } from '../../frontend/tooltips/tooltipContent';

export function duplicateRowTip(name: string): TooltipContent {
  return { title: `duplicate ${name}`, body: 'Files a copy right below, with its own id and everything else the same.' };
}

export function deleteRowTip(name: string): TooltipContent {
  return { title: `delete ${name}`, body: 'Asks first. Nodes still pointing at it fall back to drawing nothing.' };
}

export function deleteRowConfirmation(name: string): { title: string; body: string; confirmLabel: string } {
  return {
    title: `delete ${name}?`,
    body: 'It leaves the library for good. Anything referencing it by id stops finding it.',
    confirmLabel: 'delete',
  };
}
