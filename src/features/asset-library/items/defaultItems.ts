import type { ItemId } from '@/features/asset-library/asset';
import { keySprite } from './art/keyArt';
import { torchSprite } from './art/torchArt';
import { BILLBOARD, newItemWithId, UPRIGHT, type ItemDef } from './itemDef';

export const TORCH_ITEM_ID = 5 as ItemId;
export const KEY_ITEM_ID = 6 as ItemId;

export function defaultItems(): ItemDef[] {
  return [
    {
      ...newItemWithId(TORCH_ITEM_ID),
      name: 'torch',
      symbol: '†',
      color: '#ffb14a',
      render: BILLBOARD,
      orientation: UPRIGHT,
      edgeColor: '#7a4a1c',
      size: 0.7,
      hover: 0.3,
      sprite: torchSprite(),
      tags: ['hand', 'light'],
      light: 9,
      lightInk: '#ffa63a',
    },
    {
      ...newItemWithId(KEY_ITEM_ID),
      name: 'key',
      symbol: '\u26b7',
      color: '#e0b33c',
      render: BILLBOARD,
      orientation: UPRIGHT,
      thickness: 0.1,
      edgeColor: '#7a5c17',
      size: 0.55,
      hover: 0.25,
      sprite: keySprite(),
      tags: ['hand', 'key'],
    },
  ];
}
