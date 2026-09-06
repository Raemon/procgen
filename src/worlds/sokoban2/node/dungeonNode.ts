import { registerNodeType } from '@/features/asset-library/worlds/nodeRegistry'
import type { ChunkGenCtx, WholeWorldSpec } from '@/features/asset-library/worlds/nodeType'
import { EMPTY_TILE, tilesValue, type ChunkValue } from '@/features/asset-library/worlds/values/chunkValues'
import { generateWorld2 } from '../generate/generateWorld'
import { HEIGHT, TILE, type World } from '../types'
import { inBounds, index } from '../world'
import { DUNGEON_PARAMS, DUNGEON_TILE_PARAMS, SOKOBAN2_NODE_TYPE, estimatedBuildMs, genParamsOf } from './dungeonKnobs'
import { parseWorld, serializeWorld, toDungeon } from './worldValue'

const dungeonBuild: WholeWorldSpec<World> = {
  build: ({ seed, params, report }) => generateWorld2(genParamsOf(params), seed, report),
  serialize: serializeWorld,
  parse: parseWorld,
  estimateMs: estimatedBuildMs,
}

registerNodeType({
  type: SOKOBAN2_NODE_TYPE,
  title: 'sokoban dungeon',
  category: 'maze',
  description:
    'A finite maze of rooms joined by doors, each room a crate-pushing puzzle proven solvable before it ships, built whole on the server and centred on the origin. Floors are painted with the floor tile, the two-high shelves crates drop from with the ledge tile, and every wall and pillar with the wall tile. Crates, goals and doors are not tiles: the rules layer that reads this same node stands them in the world, moves the crates you push, and opens each door the moment the room it waits on is finished.',
  whenToUse:
    'A world that is one long puzzle rather than terrain: rooms of escalating difficulty, deliveries of crates between them, and doors that hold you in a room until its puzzle is done. Pair it with the sokoban heights node bound to elevation so ledges and walls stand up, and expect a few seconds of building for a 5x5 maze.',
  inputs: {},
  params: { ...DUNGEON_PARAMS, ...DUNGEON_TILE_PARAMS },
  output: 'tiles',
  wholeWorld: dungeonBuild,
  generateChunk: paintDungeonChunk,
})

function paintDungeonChunk(ctx: ChunkGenCtx): ChunkValue {
  const tiles = ctx.newTiles()
  const world = ctx.built() as World | null
  if (!world) return tilesValue(tiles)
  const floor = ctx.params.floorTile as number
  const ledge = ctx.params.ledgeTile as number
  const wall = ctx.params.wallTile as number
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      const cell = toDungeon(world, ctx.originX + x, ctx.originY + y)
      if (!inBounds(world, cell.x, cell.y)) continue
      const id = index(world, cell.x, cell.y)
      if (world.tiles[id] === TILE.Void) continue
      const height = world.heights[id]!
      tiles[y * ctx.size + x] = world.tiles[id] === TILE.Door ? floor : height >= HEIGHT.Wall ? wall : height >= HEIGHT.Ledge ? ledge : floor
    }
  }
  if (floor === EMPTY_TILE && wall === EMPTY_TILE) return tilesValue(ctx.newTiles())
  return tilesValue(tiles)
}
