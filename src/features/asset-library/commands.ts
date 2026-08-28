import { characterCommands } from './characters/characterCommands';
import { inventoryCommands } from './characters/inventoryCommands';
import { creatureCommands } from './creatures/creatureCommands';
import { cultureCommands } from './cultures/cultureCommands';
import { folderCommands } from './folders/folderCommands';
import { itemCommands } from './items/itemCommands';
import { pieceCommands } from './pieces/pieceCommands';
import { tileCommands } from './tiles/tileCommands';
import { worldSeedLabCommands } from './worlds/worldSeedLabCommands';
import { nodeCommands } from './worlds/nodeCommands';
import { worldSeedCommands } from './worlds/worldSeedCommands';
import { savedWorldCommands } from './worlds/saved/savedWorldCommands';

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
  ...worldSeedCommands,
  ...savedWorldCommands,
  ...worldSeedLabCommands,
];
