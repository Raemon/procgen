import { registerExampleWorldSeed } from '@/features/asset-library/worlds/seeds/examplePipelines';
import { registerWorldRules } from '@/features/game/worldRules';
import './generate/kinds/keyRoom';
import './generate/kinds/leverRoom';
import './generate/kinds/sokobanRoom';
import './node/labyrinthChunksFeatures';
import './node/labyrinthChunksNode';
import './node/labyrinthDenizensNode';
import { LABYRINTH_NODE_TYPE } from './node/labyrinthKnobs';
import { infiniteLabyrinth } from './node/seed';
import { describeLabyrinthState, labyrinthRules } from './rules/overlay';

registerExampleWorldSeed(infiniteLabyrinth);
registerWorldRules({ nodeType: LABYRINTH_NODE_TYPE, attach: labyrinthRules, describe: describeLabyrinthState });
