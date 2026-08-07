import {
  coinSprite,
  cubeArtFromSprite,
  potionSprite,
  runeSprite,
  shieldSprite,
  swordSprite,
} from './art/defaultItemArt';
import { BILLBOARD, CUBE, LYING_FLAT, newItemWithId, UPRIGHT, type ItemDef } from './itemDef';

export function defaultItems(): ItemDef[] {
  return [
    billboard(0, 'health potion', 'p', '#c0392b', potionSprite(), {
      edgeColor: '#7a2118',
      tags: ['consumable'],
    }),
    billboard(1, 'short sword', '/', '#cfd6e0', swordSprite(), {
      edgeColor: '#6d747d',
      gridHeight: 2,
      size: 0.8,
      tags: ['weapon', 'hand'],
    }),
    billboard(2, 'kite shield', ')', '#3a5c8a', shieldSprite(), {
      edgeColor: '#24395a',
      gridWidth: 2,
      gridHeight: 2,
      size: 0.9,
      tags: ['armor', 'hand'],
    }),
    billboard(3, 'gold coin', '$', '#e8c14a', coinSprite(), {
      edgeColor: '#a8801f',
      orientation: LYING_FLAT,
      size: 0.45,
      hover: 0.12,
      thickness: 0.06,
      tags: ['currency'],
    }),
    {
      ...newItemWithId(4),
      name: 'rune stone',
      symbol: '◆',
      color: '#6f7a80',
      render: CUBE,
      faceArt: cubeArtFromSprite(runeSprite()),
      size: 0.5,
      hover: 0.55,
      tags: ['gem'],
    },
  ];
}

function billboard(
  id: number,
  name: string,
  symbol: string,
  color: string,
  sprite: ItemDef['sprite'],
  overrides: Partial<ItemDef>,
): ItemDef {
  return {
    ...newItemWithId(id),
    name,
    symbol,
    color,
    render: BILLBOARD,
    orientation: UPRIGHT,
    sprite,
    ...overrides,
  };
}
