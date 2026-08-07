export const CREATURE = 0;
export const CHARACTER = 1;

export const ENTITY_KIND_CHOICES = [
  {
    value: CREATURE,
    label: 'creature',
    help: 'Wildlife and monsters. Spawns from a points node and walks its behavior.',
  },
  {
    value: CHARACTER,
    label: 'character',
    help: 'Follows every creature rule — the same look, movement and spawning — and additionally carries an inventory.',
  },
] as const;

export function entityKindLabel(kind: number): string {
  return ENTITY_KIND_CHOICES.find((choice) => choice.value === kind)?.label ?? 'creature';
}

export function isEntityKind(kind: number): boolean {
  return ENTITY_KIND_CHOICES.some((choice) => choice.value === kind);
}
