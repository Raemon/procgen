import type { CreatureDef } from '../../creatures/creatureDef';
import { clampLightRadius, emitsLight, type LightEmitter } from '../../../world/light/lightEmission';
import type { ItemDef } from '../itemDef';
import type { ItemSource } from '../itemLibrary';

export function brightestCarriedLight(
  creature: CreatureDef | null,
  items: ItemSource,
): LightEmitter | null {
  const carried = carriedItems(creature, items).filter(emitsLight);
  if (carried.length === 0) return null;
  return carried.reduce((brightest, item) =>
    clampLightRadius(item.light) > clampLightRadius(brightest.light) ? item : brightest,
  );
}

function carriedItems(creature: CreatureDef | null, items: ItemSource): ItemDef[] {
  const placements = creature?.inventory?.placements ?? [];
  return placements
    .map((placement) => items.byId(placement.itemId))
    .filter((item): item is ItemDef => item !== undefined);
}
