import { characterCommands } from './characters/characterCommands';
import { inventoryCommands } from './characters/inventoryCommands';
import { creatureCommands } from './creatures/creatureCommands';
import { cultureCommands } from './cultures/cultureCommands';
import { folderCommands } from './folders/folderCommands';
import { itemCommands } from './items/itemCommands';
import { pieceCommands } from './pieces/pieceCommands';
import { tileCommands } from './tiles/tileCommands';
import { labCommands } from './worlds/worldSeedLabCommands';
import { nodeCommands } from './worlds/nodeCommands';
import { worldCommands } from './worlds/worldSeedCommands';

export const assetLibraryCommands = [
  ...tileCommands,
  ...itemCommands,
  ...creatureCommands,
  ...characterCommands,
  ...inventoryCommands,
  ...pieceCommands,
  ...cultureCommands,
  ...folderCommands,
  ...nodeCommands,
  ...worldCommands,
  ...labCommands,
];
