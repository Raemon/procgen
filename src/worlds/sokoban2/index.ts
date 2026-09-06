import { registerExampleWorldSeed } from '@/features/asset-library/worlds/seeds/examplePipelines'
import { registerWorldRules } from '@/features/game/worldRules'
import './node/dungeonNode'
import './node/heightsNode'
import { SOKOBAN2_NODE_TYPE } from './node/dungeonKnobs'
import { sokobanDungeon } from './node/seed'
import { sokoban2Rules } from './rules/overlay'
import { describeSokobanState } from './rules/snapshot'

registerExampleWorldSeed(sokobanDungeon)
registerWorldRules({ nodeType: SOKOBAN2_NODE_TYPE, attach: sokoban2Rules, describe: describeSokobanState })
