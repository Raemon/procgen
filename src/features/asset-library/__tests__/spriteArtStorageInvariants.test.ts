import { assetId } from '@/features/asset-library/asset';
import { blankCharacterBillboard, type CharacterBillboard } from '@/features/asset-library/characters/characterBillboard';
import { newCreatureWithId, type CreatureDef } from '@/features/asset-library/creatures/creatureDef';
import { creaturesAsStoredJson, creaturesFromStoredJson } from '@/features/asset-library/creatures/creatureStorage';
import { newItemWithId, type ItemDef } from '@/features/asset-library/items/itemDef';
import { itemsAsStoredJson, itemsFromStoredJson } from '@/features/asset-library/items/itemStorage';
import { blankInventory } from '@/features/asset-library/items/inventory/inventoryDef';
import { blankSpriteArt, type SpriteArt } from '@/features/asset-library/tiles/spriteArt';
import {
  compactSpriteArtOf,
  isCompactSpriteArt,
  spriteArtFromStoredShape,
} from '@/features/asset-library/tiles/storage/storedSpriteArt';
import { CHARACTER } from '@/features/asset-library/creatures/entityKinds';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

export function checkSpriteArtStorageInvariants(check: CheckReporter): void {
  checkEveryPixelSurvivesTheCompactForm(check);
  checkSpritesStoredInTheOldExpandedShapeStillLoad(check);
  checkCorruptCompactSpritesAreDroppedRatherThanDecodedWrong(check);
  checkItemsStoreTheirSpritesCompactly(check);
  checkCreaturesStoreTheirClipsAndBackdropsCompactly(check);
}

function checkEveryPixelSurvivesTheCompactForm(check: CheckReporter): void {
  const sprite = spriteWithAlphaAndTransparency();
  const reloaded = spriteArtFromStoredShape(JSON.parse(JSON.stringify(compactSpriteArtOf(sprite))));
  check('a sprite keeps every pixel through the compact form', sameArt(reloaded, sprite));
  check(
    'unpainted pixels come back as nothing painted, not as a colour',
    reloaded !== null && reloaded[1] === null && reloaded[0] === '#ff000080',
  );
}

function checkSpritesStoredInTheOldExpandedShapeStillLoad(check: CheckReporter): void {
  const items = itemsFromStoredJson([{ ...newItemWithId(assetId<'items'>(0)), sprite: spriteWithAlphaAndTransparency() }]);
  check(
    'a sprite stored as a raw pixel array still loads',
    items !== null && sameArt(items[0]!.sprite, spriteWithAlphaAndTransparency()),
  );
}

function checkCorruptCompactSpritesAreDroppedRatherThanDecodedWrong(check: CheckReporter): void {
  const compact = compactSpriteArtOf(spriteWithAlphaAndTransparency());
  check(
    'a sprite whose pixels were truncated in storage is refused, not decoded short',
    spriteArtFromStoredShape({ ...compact, pixels: 'AAAA' }) === null,
  );
  check(
    'a sprite pointing past the end of its palette is refused',
    spriteArtFromStoredShape({ ...compact, palette: [] }) === null,
  );
  check(
    'a sprite that is not even base64 is refused',
    spriteArtFromStoredShape({ ...compact, pixels: '!!!!' }) === null,
  );
}

function checkItemsStoreTheirSpritesCompactly(check: CheckReporter): void {
  const stored = itemsAsStoredJson([oneItemCarryingSprite()]);
  check('saving items stores their sprites compactly, not as raw pixels', isCompactSpriteArt(stored[0]!.sprite));
  const reloaded = itemsFromStoredJson(JSON.parse(JSON.stringify(stored)));
  check(
    'an item sprite survives the round trip through storage',
    reloaded !== null && sameArt(reloaded[0]!.sprite, oneItemCarryingSprite().sprite),
  );
}

function checkCreaturesStoreTheirClipsAndBackdropsCompactly(check: CheckReporter): void {
  const stored = creaturesAsStoredJson([oneCharacterCarryingArt()]);
  check(
    'saving a character stores its animation frames compactly, not as raw pixels',
    isCompactSpriteArt(stored[0]!.billboard?.clips.front.idle[0]),
  );
  check(
    'saving a character stores its inventory backdrop compactly, not as raw pixels',
    isCompactSpriteArt(stored[0]!.inventory?.background),
  );
  const reloaded = creaturesFromStoredJson(JSON.parse(JSON.stringify(stored)));
  check(
    'character frames and backdrops survive the round trip through storage',
    reloaded !== null &&
      sameArt(reloaded[0]!.billboard?.clips.front.idle, [spriteWithAlphaAndTransparency()]) &&
      sameArt(reloaded[0]!.inventory?.background, spriteWithAlphaAndTransparency()),
  );
}

function oneItemCarryingSprite(): ItemDef {
  return { ...newItemWithId(assetId<'items'>(0)), sprite: spriteWithAlphaAndTransparency() };
}

function oneCharacterCarryingArt(): CreatureDef {
  const inventory = blankInventory();
  inventory.background = spriteWithAlphaAndTransparency();
  return {
    ...newCreatureWithId(assetId<'creatures'>(0)),
    kind: CHARACTER,
    inventory,
    billboard: billboardWithOneFrame(),
  };
}

function billboardWithOneFrame(): CharacterBillboard {
  const billboard = blankCharacterBillboard();
  billboard.clips.front.idle = [spriteWithAlphaAndTransparency()];
  return billboard;
}

function spriteWithAlphaAndTransparency(): SpriteArt {
  const sprite = blankSpriteArt(4);
  sprite[0] = '#ff000080';
  sprite[2] = '#0000ff';
  sprite[15] = '#00ff00';
  return sprite;
}

function sameArt(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
