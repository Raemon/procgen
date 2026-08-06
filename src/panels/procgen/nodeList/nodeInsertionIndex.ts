export function insertionIndexAt(list: HTMLElement | null, pointerY: number): number {
  const cards = cardsIn(list);
  const firstBelow = cards.findIndex((card) => pointerY < cardMidY(card));
  return firstBelow < 0 ? cards.length : firstBelow;
}

function cardsIn(list: HTMLElement | null): HTMLElement[] {
  return [...(list?.querySelectorAll<HTMLElement>('[data-node-id]') ?? [])];
}

function cardMidY(card: HTMLElement): number {
  const rect = card.getBoundingClientRect();
  return rect.top + rect.height / 2;
}
