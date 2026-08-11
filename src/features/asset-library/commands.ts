import { characterCommands } from './characters/characterCommands';
import { inventoryCommands } from './characters/inventoryCommands';
import { creatureCommands } from './creatures/creatureCommands';
import { cultureCommands } from './cultures/cultureCommands';
import { itemCommands } from './items/itemCommands';
import { pieceCommands } from './pieces/pieceCommands';
import { tileCommands } from './tiles/tileCommands';
import { nodeCommands } from './worlds/nodeCommands';
import { worldCommands } from './worlds/worldCommands';

export const assetLibraryCommands = [
  ...tileCommands,
  ...itemCommands,
  ...creatureCommands,
  ...characterCommands,
  ...inventoryCommands,
  ...pieceCommands,
  ...cultureCommands,
  ...nodeCommands,
  ...worldCommands,
];
