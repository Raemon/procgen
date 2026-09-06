import { registerNodeType } from '@/features/asset-library/worlds/nodeRegistry'
import type { ChunkGenCtx } from '@/features/asset-library/worlds/nodeType'
import { fieldValue, type ChunkValue } from '@/features/asset-library/worlds/values/chunkValues'
import { HEIGHT, TILE, type World } from '../types'
import { inBounds, index } from '../world'
import { SOKOBAN2_HEIGHTS_NODE_TYPE, SOKOBAN2_NODE_TYPE } from './dungeonKnobs'
import { toDungeon } from './worldValue'

export const LEDGE_ELEVATION = HEIGHT.Ledge
export const WALL_ELEVATION = HEIGHT.Ledge

registerNodeType({
  type: SOKOBAN2_HEIGHTS_NODE_TYPE,
  title: 'sokoban heights',
  category: 'maze',
  description:
    `Reads a sokoban dungeon and raises its ground: floors and doorways stay at 0, ledges and walls rise to ${HEIGHT.Ledge}. Bind it to elevation with a scale of 1 so a crate, one unit tall, is exactly the step a ledge needs. Walls rise the same ${HEIGHT.Ledge} and then stand two more units tall as blocking tiles, which is what makes them ${HEIGHT.Wall} high and out of reach.`,
  whenToUse:
    'Always beside a sokoban dungeon node, wired to it and bound to elevation. Without it the maze is flat and every ledge puzzle is just a floor.',
  inputs: {
    dungeon: { kind: 'tiles', label: 'dungeon', help: `A ${SOKOBAN2_NODE_TYPE} node whose built maze these heights follow.` },
  },
  params: {},
  output: 'field',
  readsBuiltWorld: true,
  generateChunk: raiseDungeonChunk,
})

function raiseDungeonChunk(ctx: ChunkGenCtx): ChunkValue {
  const field = ctx.newField()
  const world = ctx.builtInput('dungeon') as World | null
  if (!world) return fieldValue(field)
  for (let y = 0; y < ctx.size; y++) {
    for (let x = 0; x < ctx.size; x++) {
      const cell = toDungeon(world, ctx.originX + x, ctx.originY + y)
      if (!inBounds(world, cell.x, cell.y)) continue
      const id = index(world, cell.x, cell.y)
      if (world.tiles[id] === TILE.Void || world.tiles[id] === TILE.Door) continue
      const height = world.heights[id]!
      field[y * ctx.size + x] = height >= HEIGHT.Wall ? WALL_ELEVATION : height >= HEIGHT.Ledge ? LEDGE_ELEVATION : 0
    }
  }
  return fieldValue(field)
}
