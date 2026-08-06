export const DROP_INDEX_ATTRIBUTE = 'data-drop-index';

export function insertionIndexAt(
  list: HTMLElement | null,
  pointerY: number,
  nodeCount: number,
): number {
  const target = dropTargetsIn(list).find((element) => pointerY < targetMidY(element));
  return target ? Number(target.getAttribute(DROP_INDEX_ATTRIBUTE)) : nodeCount;
}

function dropTargetsIn(list: HTMLElement | null): HTMLElement[] {
  return [...(list?.querySelectorAll<HTMLElement>(`[${DROP_INDEX_ATTRIBUTE}]`) ?? [])];
}

function targetMidY(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  return rect.top + rect.height / 2;
}
