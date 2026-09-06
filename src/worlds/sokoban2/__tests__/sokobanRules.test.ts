import '../index'
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter'
import { NO_ITEMS } from '@/features/asset-library/items/itemAssets'
import { defaultTileId } from '@/features/asset-library/tiles/defaultTiles'
import { synchronousBuilds } from '@/features/asset-library/worlds/eval/builtValues'
import { PipelineEvaluator } from '@/features/asset-library/worlds/eval/evaluator'
import type { NodeInstance } from '@/features/asset-library/worlds/pipeline/pipelineState'
import { asField, asTiles } from '@/features/asset-library/worlds/values/valueAccess'
import { nodeOfType, storeWithNodes } from '@/features/game/__tests__/rulesFixtures'
import { wireMarkersOf } from '@/features/game/circuits/wireMarkers'
import type { DefaultRules, MineSlots, StepAttempt } from '@/features/game/worldRules'
import { WorldRulesSet } from '@/features/game/worldRulesSet'
import { generateWorld2 } from '../generate/generateWorld'
import { sokoban2Rules, type Sokoban2Rules } from '../index'
import { SOKOBAN2_HEIGHTS_NODE_TYPE, SOKOBAN2_NODE_TYPE } from '../node/dungeonKnobs'
import { fromDungeon, toDungeon } from '../node/worldValue'
import { DEFAULT_PARAMS } from '../params'
import { doorLock } from '../play/doors'
import { reachableCells } from '../play/reach'
import { DIRS, DIR_LIST, HEIGHT, type World } from '../types'
import { crateFinder, index, roomAt, terrainHeight } from '../world'
import { worldFromAscii } from './referees/ascii'

const NO_MINE: MineSlots = { get: () => null, set: () => undefined }
const NEVER_ASKED: DefaultRules = {
  step: () => ({ allowed: false, why: 'the overlay decides' }),
  jump: () => null,
  surfaceAt: () => 0,
  tileIsWalkable: () => true,
  climbGate: () => true,
}

export function checkSokobanRules(check: CheckReporter): void {
  checkAStepPushesButNeverClimbs(check)
  checkAJumpClimbsButNeverPushes(check)
  checkDoorsOpenWhenTheirRoomIsSolvedAndStayOpen(check)
  checkTwoPlayersShareTheCrates(check)
  checkResetPutsTheRoomBack(check)
  checkTheOverlayAgreesWithTheReferee(check)
  checkTheNodesSliceTheBuiltWorld(check)
  checkGoalsAreWiredToTheDoorTheyOpen(check)
}

function checkAStepPushesButNeverClimbs(check: CheckReporter): void {
  const rules = rulesFor(worldFromAscii(['######', '#@r..#', '######']))
  const player = rules.spawn()!
  const pinned = rulesFor(worldFromAscii(['#####', '#@r##', '#####']))
  const refused = pinned.step(attempt(pinned.spawn()!, 1, 0, true, false), NO_MINE, NEVER_ASKED)
  check('a step into a crate that cannot move is refused, and the hint says to jump onto it', !refused.allowed && refused.why.includes('jump'))
  const dry = rules.step(attempt(player, 1, 0, true, false), NO_MINE, NEVER_ASKED)
  const crateBefore = rules.crates()[0]!.x
  check('a dry-run step through a crate is allowed without moving it', dry.allowed && rules.crates()[0]!.x === crateBefore && rules.revision() === 0)
  const pushed = rules.step(attempt(player, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  check('a committed step pushes the crate one cell along the floor and bumps the shared revision', pushed.allowed && rules.crates()[0]!.x === crateBefore + 1 && rules.revision() === 1)
  const noPush = rules.step(attempt({ x: player.x + 1, y: player.y }, 1, 0, false, true), NO_MINE, NEVER_ASKED)
  check('a step that may not push is refused by a crate', !noPush.allowed)
  const diagonal = rules.step(attempt(player, 1, 1, true, false), NO_MINE, NEVER_ASKED)
  check('the dungeon refuses diagonal steps, so the engine slides along an axis instead', !diagonal.allowed)
}

function checkAJumpClimbsButNeverPushes(check: CheckReporter): void {
  const rules = rulesFor(worldFromAscii(['######', '#@r=.#', '######']))
  const player = rules.spawn()!
  const ontoCrate = rules.jump({ from: player, dx: 1, dy: 0 }, NO_MINE, NEVER_ASKED)
  check('a jump lands on the crate next to you and leaves it where it was', ontoCrate?.x === player.x + 1 && rules.crates()[0]!.x === 2 && rules.revision() === 0)
  check('standing on that crate raises the surface by one', rules.surfaceRiseAt(player.x + 1, player.y) === 1 && rules.surfaceRiseAt(player.x, player.y) === 0)
  const ontoLedge = rules.jump({ from: ontoCrate!, dx: 1, dy: 0 }, NO_MINE, NEVER_ASKED)
  check('from the crate a jump reaches the ledge two units up', ontoLedge?.x === player.x + 2)
  const fromFloor = rulesFor(worldFromAscii(['#####', '#@=.#', '#####']))
  check('straight from the floor the ledge is out of reach for a jump', fromFloor.jump({ from: fromFloor.spawn()!, dx: 1, dy: 0 }, NO_MINE, NEVER_ASKED) === null)
  const stepUp = fromFloor.step(attempt(fromFloor.spawn()!, 1, 0, true, false), NO_MINE, NEVER_ASKED)
  check('and a step onto it is refused with a hint about crates', !stepUp.allowed && stepUp.why.includes('crate'))
  const twoOut = rules.jump({ from: player, dx: 2, dy: 0 }, NO_MINE, NEVER_ASKED)
  check('the dungeon has no two-tile jumps', twoOut === null)
}

const DOOR_ROWS = ['##########', '#@r.R.#.B#', '#.....D..#', '##########']
const DOOR_OPTIONS = { rooms: (x: number) => (x < 6 ? 0 : x > 6 ? 1 : -1), depths: [0, 1] }

function checkDoorsOpenWhenTheirRoomIsSolvedAndStayOpen(check: CheckReporter): void {
  const world = worldFromAscii(DOOR_ROWS, DOOR_OPTIONS)
  const rules = rulesFor(world)
  const door = fromDungeon(world, world.doors[0]!)
  const beforeDoor = { x: door.x - 1, y: door.y }
  check('the door waits on the room in front of it and starts shut', world.doors[0]!.opensWhen === 0 && rules.blocksAt(door.x, door.y))
  const shut = rules.step(attempt(beforeDoor, 1, 0, true, false), NO_MINE, NEVER_ASKED)
  check('a shut door refuses the step and says which room opens it', !shut.allowed && shut.why.includes('room 0'))
  check('a shut door draws as a barred gate', rules.markersIn(door.x, door.y, door.x, door.y).some((marker) => marker.tag.includes('shut')))
  const player = rules.spawn()!
  rules.step(attempt(player, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  rules.step(attempt({ x: player.x + 1, y: player.y }, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  check('settling the crate on its goal opens the door', rules.openedDoors().length === 1 && !rules.blocksAt(door.x, door.y))
  check('a goal with its crate reads as filled and the crate as settled', rules.markersIn(player.x, player.y, player.x + 4, player.y).filter((marker) => marker.tag.includes('filled') || marker.tag.includes('settled')).length === 2)
  const through = rules.step(attempt(beforeDoor, 1, 0, true, false), NO_MINE, NEVER_ASKED)
  check('an open door takes the step', through.allowed)
  rules.step(attempt({ x: player.x + 2, y: player.y }, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  check('pushing the crate off its goal leaves the door open', rules.crates()[0]!.x === toDungeon(world, player.x, player.y).x + 4 && rules.openedDoors().length === 1 && rules.step(attempt(beforeDoor, 1, 0, true, false), NO_MINE, NEVER_ASKED).allowed)
  const twin = rulesFor(worldFromAscii(DOOR_ROWS, DOOR_OPTIONS))
  twin.applySnapshot(rules.snapshot())
  check('a snapshot carries the moved crate and the opened door to another overlay', twin.crates()[0]!.x === rules.crates()[0]!.x && twin.openedDoors().length === 1)
  twin.applySnapshot(null)
  check('forgetting the snapshot puts the crate back and shuts the door again', twin.crates()[0]!.x === world.crates[0]!.x && twin.openedDoors().length === 0)
}

function checkGoalsAreWiredToTheDoorTheyOpen(check: CheckReporter): void {
  const world = worldFromAscii(DOOR_ROWS, DOOR_OPTIONS)
  const rules = rulesFor(world)
  const everywhere = [-100, -100, 100, 100] as const
  const circuits = rules.circuitsIn(...everywhere)
  const circuit = circuits[0]!
  const door = fromDungeon(world, world.doors[0]!)
  const goal = fromDungeon(world, world.rooms[0]!.goals[0]!)
  check('the room a door waits on is wired from its goals to that door', circuits.length === 1 && circuit.doors[0]!.x === door.x && circuit.doors[0]!.y === door.y && circuit.plates[0]!.x === goal.x && circuit.plates.length === 1)
  const wires = circuit.wires.map((cell) => toDungeon(world, cell.x, cell.y))
  check('wires run only along floor cells of that room, never onto walls, the goal or the door', wires.length > 0 && wires.every((cell) => roomAt(world, cell.x, cell.y) === 0 && terrainHeight(world, cell.x, cell.y) === HEIGHT.Floor && !(cell.x === world.goals[0]!.x && cell.y === world.goals[0]!.y)))
  check('the wire runs from beside the goal to beside the door', wires.some((cell) => Math.abs(cell.x - world.goals[0]!.x) + Math.abs(cell.y - world.goals[0]!.y) === 1) && wires.some((cell) => Math.abs(cell.x - world.doors[0]!.x) + Math.abs(cell.y - world.doors[0]!.y) === 1))
  const player = rules.spawn()!
  check('the crates are listed for the cue watcher where they stand', rules.cratesIn(...everywhere).some((cell) => cell.x === player.x + 1 && cell.y === player.y))
  const wiresBefore = wireMarkersOf(circuits, ...everywhere)
  check('before the room is finished the circuit is dark, its door shut, and its wires drawn dark', !circuit.powered && !circuit.doors[0]!.open && !circuit.plates[0]!.lit && wiresBefore.length === wires.length && wiresBefore.every((marker) => marker.tag.startsWith('circuit line, dark')))
  rules.step(attempt(player, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  rules.step(attempt({ x: player.x + 1, y: player.y }, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  const finished = rules.circuitsIn(...everywhere)[0]!
  check('settling the crate lights the goal, powers the circuit and opens its door', finished.plates[0]!.lit && finished.powered && finished.doors[0]!.open)
  check('a powered circuit draws its wires lit', wireMarkersOf([finished], ...everywhere).every((marker) => marker.tag.startsWith('circuit line, lit')))
  check('a room no door waits on has no circuit to draw', circuits.every((each) => !each.key.endsWith(':room 1')))
}

function checkTwoPlayersShareTheCrates(check: CheckReporter): void {
  const rules = rulesFor(worldFromAscii(['######', '#@r..#', '#....#', '######']))
  const one = rules.spawn()!
  const two = { x: one.x + 1, y: one.y + 1 }
  const blockedBefore = rules.step(attempt(two, 0, -1, false, false), NO_MINE, NEVER_ASKED)
  rules.step(attempt(one, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  const openAfter = rules.step(attempt(two, 0, -1, false, false), NO_MINE, NEVER_ASKED)
  check('a crate one player pushes is out of the way of the other, since crates belong to no one', !blockedBefore.allowed && openAfter.allowed)
  check('nothing is kept per player', rules.initialMine() === null)
}

function checkResetPutsTheRoomBack(check: CheckReporter): void {
  const world = worldFromAscii(DOOR_ROWS, DOOR_OPTIONS)
  const rules = rulesFor(world)
  const player = rules.spawn()!
  rules.step(attempt(player, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  rules.step(attempt({ x: player.x + 1, y: player.y }, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  const described = rules.resetRoomAt(player.x, player.y)
  check('resetting the room names it and puts its crates back where they were built', described === 'room 0' && rules.crates()[0]!.x === world.crates[0]!.x)
  check('a door the room already opened stays open after a reset', rules.openedDoors().length === 1)
  const door = fromDungeon(world, world.doors[0]!)
  check('resetting from a doorway resets nothing, because a doorway belongs to no room', rules.resetRoomAt(door.x, door.y) === null)
}

function checkTheOverlayAgreesWithTheReferee(check: CheckReporter): void {
  const world = generateWorld2({ ...DEFAULT_PARAMS, cols: 2, rows: 2, roomW: 5, roomH: 5 }, 11)
  const rules = rulesFor(world)
  const reached = new Set<string>()
  const queue = [rules.spawn()!]
  reached.add(`${queue[0]!.x},${queue[0]!.y}`)
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head]!
    for (const dir of DIR_LIST) {
      const delta = DIRS[dir]
      const next = { x: at.x + delta.x, y: at.y + delta.y }
      const walked = rules.step(attempt(at, delta.x, delta.y, false, false), NO_MINE, NEVER_ASKED).allowed
      const jumped = rules.jump({ from: at, dx: delta.x, dy: delta.y }, NO_MINE, NEVER_ASKED) !== null
      if (!walked && !jumped) continue
      const key = `${next.x},${next.y}`
      if (reached.has(key)) continue
      reached.add(key)
      queue.push(next)
    }
  }
  const referee = new Set(
    [...reachableCells(frozenCrates(world), [], world.start, crateFinder([]), doorLock(world, world.crates))].map((cell) => {
      const at = fromDungeon(world, { x: cell % world.width, y: Math.floor(cell / world.width) })
      return `${at.x},${at.y}`
    }),
  )
  const same = referee.size === reached.size && [...referee].every((key) => reached.has(key))
  check('walking and jumping through the overlay reaches exactly the cells the referee flood reaches over frozen crates', same && reached.size > 10)
  check('the overlay spawns where the generator placed the start', rules.spawn()!.x === fromDungeon(world, world.start).x)
}

function checkTheNodesSliceTheBuiltWorld(check: CheckReporter): void {
  const floor = defaultTileId('cobbled street')
  const wall = defaultTileId('dressed granite wall')
  const ledge = defaultTileId('flagstone plaza')
  const dungeon: NodeInstance = {
    ...nodeOfType(SOKOBAN2_NODE_TYPE, 'dungeon'),
    params: { cols: 2, rows: 2, maxRoomSlots: 1, roomW: 5, roomH: 5, floorTile: floor, ledgeTile: ledge, wallTile: wall },
    display: { mode: 'tileLayer' },
  }
  const heights: NodeInstance = {
    ...nodeOfType(SOKOBAN2_HEIGHTS_NODE_TYPE, 'heights'),
    inputs: { dungeon: 'dungeon' },
    display: { mode: 'elevation', heightScale: 1 },
  }
  const store = storeWithNodes(dungeon, heights)
  const evaluator = new PipelineEvaluator(store, synchronousBuilds())
  const painted = new Set<number>()
  const raised = new Set<number>()
  for (const [chunkX, chunkY] of [[-1, -1], [0, -1], [-1, 0], [0, 0]] as const) {
    for (const tile of asTiles(evaluator.valueFor('dungeon', chunkX, chunkY)) ?? []) painted.add(tile)
    for (const height of asField(evaluator.valueFor('heights', chunkX, chunkY)) ?? []) raised.add(height)
  }
  check('the dungeon node paints floors and walls with the tiles it was given', painted.has(floor) && painted.has(wall))
  check('the heights node raises ledges and walls by two and leaves floors at zero', raised.has(0) && raised.has(2) && [...raised].every((height) => height === 0 || height === 2))
  const world = new WorldRulesSet({ tileIsWalkable: () => true, elevationAt: () => 0 })
  world.attach(store, { items: NO_ITEMS, builtValueOf: (nodeId) => evaluator.builtValueOf(nodeId) })
  const built = world.find(SOKOBAN2_NODE_TYPE) as Sokoban2Rules
  const spawn = world.spawn()
  check('a rules set attached over the built node knows the dungeon and spawns on its start', built.world !== null && spawn !== null && !world.blocksAt(spawn!.x, spawn!.y))
  const dungeonCell = toDungeon(built.world!, spawn!.x, spawn!.y)
  check('the spawn is painted as floor', asTiles(evaluator.valueFor('dungeon', Math.floor(spawn!.x / 32), Math.floor(spawn!.y / 32)))![((spawn!.y - Math.floor(spawn!.y / 32) * 32) * 32) + (spawn!.x - Math.floor(spawn!.x / 32) * 32)] === floor && index(built.world!, dungeonCell.x, dungeonCell.y) >= 0)
}

function frozenCrates(world: World): World {
  const heights = Uint8Array.from(world.heights)
  for (const crate of world.crates) heights[index(world, crate.x, crate.y)] = heights[index(world, crate.x, crate.y)]! + 1
  return { ...world, heights, crates: [] }
}

function rulesFor(world: World): Sokoban2Rules {
  return sokoban2Rules({
    store: storeWithNodes(nodeOfType(SOKOBAN2_NODE_TYPE, 'dungeon')),
    node: nodeOfType(SOKOBAN2_NODE_TYPE, 'dungeon'),
    tileIsWalkable: () => true,
    elevationAt: () => 0,
    items: NO_ITEMS,
    builtValue: () => world,
  })
}

function attempt(from: { x: number; y: number }, dx: number, dy: number, mayPush: boolean, commit: boolean): StepAttempt {
  return { from, to: { x: from.x + dx, y: from.y + dy }, dx, dy, mayPush, commit }
}
