import type { FacingIndex } from '@/features/game/facing';
import type { Store } from './db';

export interface CharacterRow {
  id: string;
  name: string;
  x: number;
  y: number;
  facing: FacingIndex;
}

export async function loadCharacter(store: Store, id: string): Promise<CharacterRow | null> {
  if (!store.enabled || !store.prisma) return null;
  const row = await store.prisma.character.findUnique({ where: { id } });
  return row ? toCharacterRow(row) : null;
}

export async function saveCharacter(store: Store, character: CharacterRow): Promise<void> {
  if (!store.enabled || !store.prisma) return;
  const fields = { name: character.name, x: character.x, y: character.y, facing: character.facing, lastSeenAt: new Date() };
  await store.prisma.character.upsert({
    where: { id: character.id },
    create: { id: character.id, ...fields },
    update: fields,
  });
}

function toCharacterRow(row: Record<string, unknown>): CharacterRow {
  return {
    id: String(row.id),
    name: String(row.name ?? 'wanderer'),
    x: Number(row.x ?? 0),
    y: Number(row.y ?? 0),
    facing: (Number(row.facing ?? 0) % 8) as FacingIndex,
  };
}
