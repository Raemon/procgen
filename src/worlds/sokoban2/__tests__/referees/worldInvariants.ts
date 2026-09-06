import { worldIsProvenSolvable } from '../../generate/prove'
import { unplayableRoom } from '../../generate/roomAsPlayed'
import { roomEntries } from '../../generate/worldReach'
import { doorOpensNow } from '../../play/doors'
import { worldGates, type Gate } from '../../play/gates'
import { reachableCells } from '../../play/reach'
import { COLORS, DIRS, DIR_LIST, HEIGHT, TILE, type Crate, type Goal, type RoomPlan, type Vec, type World } from '../../types'
import { holdsCrates, index, key, roomAt } from '../../world'
import { check } from './checkRunner'

export function checkWorld(world: World, label: string): void {
  checkTerrain(world, label)
  checkGoals(world, label)
  checkCrates(world, label)
  checkStart(world, label)
  checkLanes(world, label)
  checkLedges(world, label)
  checkDoorsOpenTheMaze(world, label)
  checkGates(world, label)
  checkDeliveries(world, label)
  checkPuzzleFloors(world, label)
  check('proven solvable', worldIsProvenSolvable(world), label)
  const stuck = unplayableRoom(world)
  check('every room can be finished from every doorway, as played', stuck === null, `${label}: room ${stuck?.roomId} (${stuck?.cause})`)
}

function checkTerrain(world: World, label: string): void {
  let bad = 0
  for (let id = 0; id < world.tiles.length; id++) {
    if (world.tiles[id] === TILE.Door) {
      if (world.heights[id] !== HEIGHT.Floor || world.roomIds[id]! >= 0) bad++
      continue
    }
    if (world.roomIds[id]! < 0 && world.heights[id] !== HEIGHT.Wall) bad++
    if (world.roomIds[id]! >= 0 && world.heights[id]! > HEIGHT.Ledge) bad++
  }
  check('boundaries are wall, doors are floor', bad === 0, `${label}: ${bad} cells`)
  for (const door of world.doors) {
    check('door tile', world.tiles[index(world, door.x, door.y)] === TILE.Door, `${label} @${door.x},${door.y}`)
  }
}

function checkGoals(world: World, label: string): void {
  for (const goal of world.goals) {
    check('goal is colored', COLORS.includes(goal.color), `${label} @${goal.x},${goal.y}`)
    check('goal cell holds crates', holdsCrates(world, goal.x, goal.y), `${label} @${goal.x},${goal.y}`)
    check('goal is off the walls', world.heights[index(world, goal.x, goal.y)]! <= HEIGHT.Ledge, `${label} @${goal.x},${goal.y}`)
  }
  const listed = new Set(world.rooms.flatMap((room) => room.goals).map(cellKey))
  check('world goals match room goals', listed.size === world.goals.length, `${label}: ${listed.size} vs ${world.goals.length}`)
}

function checkCrates(world: World, label: string): void {
  for (const crate of world.crates) {
    check('crate on a holdable cell', holdsCrates(world, crate.x, crate.y), `${label} @${crate.x},${crate.y}`)
    check('crate is off the walls', world.heights[index(world, crate.x, crate.y)]! <= HEIGHT.Ledge, `${label} @${crate.x},${crate.y}`)
    check('crate is colored', COLORS.includes(crate.color), `${label} @${crate.x},${crate.y}`)
  }
  const cells = new Set(world.crates.map(cellKey))
  check('crates distinct', cells.size === world.crates.length, label)
}

function checkStart(world: World, label: string): void {
  const id = index(world, world.start.x, world.start.y)
  check('start on room floor', world.heights[id] === HEIGHT.Floor && world.tiles[id] === TILE.Ground, label)
  check('start stands in a room', world.roomIds[id]! >= 0, `${label}: room ${world.roomIds[id]}`)
  check('start is crate free', !world.crates.some((crate) => crate.x === world.start.x && crate.y === world.start.y), label)
}

function checkLanes(world: World, label: string): void {
  for (const room of world.rooms) {
    for (const cell of room.highway) {
      const id = index(world, cell.x, cell.y)
      check('lane is floor', world.heights[id] === HEIGHT.Floor, `${label} room${room.id} @${cell.x},${cell.y}`)
      check('lane belongs to its room', world.roomIds[id] === room.id, `${label} room${room.id} @${cell.x},${cell.y}`)
    }
  }
}

function checkLedges(world: World, label: string): void {
  for (const room of world.rooms) {
    const lane = new Set(room.highway.map(cellKey))
    const entries = new Set(roomEntries(world, room.id).map(cellKey))
    for (const ledge of room.ledges) {
      const id = index(world, ledge.x, ledge.y)
      check('ledge is two high', world.heights[id] === HEIGHT.Ledge, `${label} room${room.id} @${ledge.x},${ledge.y}`)
      check('ledge belongs to its room', world.roomIds[id] === room.id, `${label} room${room.id} @${ledge.x},${ledge.y}`)
      check('ledge off the lane', !lane.has(cellKey(ledge)), `${label} room${room.id} @${ledge.x},${ledge.y}`)
      const beside = DIR_LIST.map((dir) => ({ x: ledge.x + DIRS[dir].x, y: ledge.y + DIRS[dir].y }))
      check('ledge away from doorways', !beside.some((cell) => entries.has(cellKey(cell))), `${label} room${room.id} @${ledge.x},${ledge.y}`)
      check('ledge away from the lane', !beside.some((cell) => lane.has(cellKey(cell))), `${label} room${room.id} @${ledge.x},${ledge.y}`)
    }
  }
}

function checkPuzzleFloors(world: World, label: string): void {
  for (const room of world.rooms) {
    if (!isShipped(room)) continue
    const inRoom = world.crates.filter((crate) => roomAt(world, crate.x, crate.y) === room.id).length
    const trapFloor = inRoom - room.exports < 2 ? 1 : 2
    const pushFloor = room.recipeId === 'R6' ? 2 : 3
    check('shipped room carries its traps', (room.traps ?? 0) >= trapFloor, `${label} room${room.id}: ${room.traps} < ${trapFloor}`)
    check('shipped room clears the push floor', (room.minPushes ?? 0) >= pushFloor, `${label} room${room.id}: ${room.minPushes}`)
    check('shipped room has goals', room.goals.length > 0, `${label} room${room.id}`)
  }
}

function checkDoorsOpenTheMaze(world: World, label: string): void {
  const unlocked: World = { ...world, rooms: world.rooms.map((room) => ({ ...room, goals: [] })) }
  const reach = reachableCells(unlocked, [], world.start)
  for (const door of world.doors) {
    check('every door reachable', reach.has(index(world, door.x, door.y)), `${label} @${door.x},${door.y}`)
  }
  for (const room of world.rooms) {
    for (const entry of roomEntries(world, room.id)) {
      check('every room entry reachable', reach.has(index(world, entry.x, entry.y)), `${label} room${room.id} @${entry.x},${entry.y}`)
    }
  }
}

function checkDeliveries(world: World, label: string): void {
  for (const delivery of world.deliveries) {
    const parked = world.crates.find((crate) => crate.x === delivery.parking.x && crate.y === delivery.parking.y)
    check('delivery has a parked spare', !!parked, `${label} ${delivery.fromRoom}->${delivery.toRoom}`)
    check('delivery colors match', parked?.color === delivery.goal.color, `${label} ${delivery.fromRoom}->${delivery.toRoom}`)
    check(
      'delivery goal is on the map',
      world.goals.some((goal) => goal.x === delivery.goal.x && goal.y === delivery.goal.y && goal.color === delivery.goal.color),
      `${label} ${delivery.fromRoom}->${delivery.toRoom}`,
    )
    check('delivery goal holds crates', holdsCrates(world, delivery.goal.x, delivery.goal.y), label)
  }
}

function isShipped(room: RoomPlan): boolean {
  return room.traps !== null && room.concept !== 'empty'
}

function cellKey(cell: Vec): string {
  return `${cell.x},${cell.y}`
}

function checkGates(world: World, label: string): void {
  const standing = worldGates(world, world.crates)
  check('one gate per door', standing.length === world.doors.length, `${label}: ${standing.length} vs ${world.doors.length}`)
  for (const gate of standing) checkGate(world, gate, label)
  for (const room of world.rooms) {
    const filled = worldGates(world, cratesOnGoals(world.crates, room.goals))
    check(
      'filling the goals of a room opens every door it holds shut',
      filled.filter((gate) => gate.opensWhen === room.id).every((gate) => !gate.sealed),
      `${label} room ${room.id}`,
    )
  }
}

function checkGate(world: World, gate: Gate, label: string): void {
  const door = world.doors[gate.door]
  const where = `${label} gate ${gate.x},${gate.y}`
  check('a gate stands in its door', door !== undefined && door.x === gate.x && door.y === gate.y, where)
  check('a gate is sealed exactly while the puzzle it waits on is unfinished', door !== undefined && gate.sealed === !doorOpensNow(world, door, world.crates), where)
  check('a door between rooms of one depth never seals', gate.opensWhen !== null || !gate.sealed, where)
  if (door && gate.opensWhen !== null) {
    check('a door waits on one of the two rooms it joins', gate.opensWhen === door.a || gate.opensWhen === door.b, where)
    check('a door waits on the shallower of its rooms', world.rooms[gate.opensWhen]!.depth < world.rooms[gate.opensWhen === door.a ? door.b : door.a]!.depth, where)
  }
}

function cratesOnGoals(crates: Crate[], goals: Goal[]): Crate[] {
  const cells = new Set(goals.map(key))
  const elsewhere = crates.filter((crate) => !cells.has(key(crate)))
  return [...elsewhere, ...goals.map((goal, i) => ({ id: -1 - i, x: goal.x, y: goal.y, color: goal.color }))]
}
