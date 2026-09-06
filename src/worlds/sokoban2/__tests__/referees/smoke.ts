import { DIR_LIST, type Crate, type Dir, type PlayState, type World } from '../../types'
import { crateFinder, index } from '../../world'
import { doorLock, doorOpensNow, openedDoorsOf } from '../../play/doors'
import { goalsFilled, isSolved } from '../../play/goals'
import { initialState, resolveMove, standingHeight, step } from '../../play/physics'
import { reachableCells } from '../../play/reach'
import { roomSolved } from '../../play/rooms'
import { worldGates } from '../../play/gates'
import { worldFromAscii } from './ascii'
import { check, checksRun, reportVerdict } from './checkRunner'

const crateAtCell = (state: PlayState, x: number, y: number): Crate | undefined =>
  state.crates.find((crate) => crate.x === x && crate.y === y)

const at = (state: PlayState, x: number, y: number) => state.player.x === x && state.player.y === y
const where = (state: PlayState) => `player=${state.player.x},${state.player.y} moves=${state.moves} pushes=${state.pushes}`
const walk = (world: World, state: PlayState, dirs: Dir[]) => dirs.reduce((current, dir) => step(world, current, dir), state)

function pushesOnFlatGround() {
  const world = worldFromAscii(['######', '#@r..#', '######'])
  const before = initialState(world)
  const outcome = resolveMove(world, before, 'right')
  check('flat push resolves as a push', outcome.kind === 'push', outcome.kind)
  check('flat push does not fall', outcome.kind === 'push' && !outcome.fell)
  const after = step(world, before, 'right')
  check('flat push moves the crate', !!crateAtCell(after, 3, 1) && !crateAtCell(after, 2, 1), where(after))
  check('flat push moves the player', at(after, 2, 1), where(after))
  check('flat push counts', after.moves === 1 && after.pushes === 1, where(after))
}

function pinnedCratesAreClimbed() {
  const cases: [string, string[]][] = [
    ['wall', ['#####', '#@r##', '#####']],
    ['crate', ['######', '#@rr.#', '######']],
    ['void', ['#####', '#@r  ', '#####']],
  ]
  for (const [label, rows] of cases) {
    const world = worldFromAscii(rows)
    const before = initialState(world)
    const outcome = resolveMove(world, before, 'right')
    check(`push into ${label} is a climb`, outcome.kind === 'climb', outcome.kind)
    const after = step(world, before, 'right')
    check(`push into ${label} leaves the crate`, !!crateAtCell(after, 2, 1), where(after))
    check(`push into ${label} climbs the player`, at(after, 2, 1) && after.pushes === 0 && after.moves === 1, where(after))
    check(`push into ${label} stands one unit up`, standingHeight(world, (x, y) => crateAtCell(after, x, y), after.player) === 1)
  }
  const void1 = worldFromAscii(['#####', '#@r  ', '#####'])
  const onCrate = step(void1, initialState(void1), 'right')
  check('void is never entered', step(void1, onCrate, 'right') === onCrate, where(onCrate))
}

function ledgesNeedACrateStep() {
  const world = worldFromAscii(['######', '#@r=.#', '######'])
  const onCrate = step(world, initialState(world), 'right')
  check('crate is not pushed uphill', !!crateAtCell(onCrate, 2, 1) && onCrate.pushes === 0, where(onCrate))
  const climb = resolveMove(world, onCrate, 'right')
  check('crate top reaches the ledge', climb.kind === 'climb', climb.kind)
  const onLedge = step(world, onCrate, 'right')
  check('player stands on the ledge', at(onLedge, 3, 1), where(onLedge))
  check('ledge is two units up', standingHeight(world, () => undefined, onLedge.player) === 2)
  const down = step(world, onLedge, 'right')
  check('stepping down off a ledge is free', at(down, 4, 1) && down.moves === 3, where(down))

  const bare = worldFromAscii(['#####', '#@=.#', '#####'])
  const blocked = initialState(bare)
  check('a bare ledge cannot be climbed', step(bare, blocked, 'right') === blocked)
}

function ledgeCratesFallAndPin() {
  const falling = worldFromAscii(['######', '#==.##', '######'], { overlay: ['      ', ' @r   ', '      '] })
  const before = initialState(falling)
  check('player starts on the ledge', standingHeight(falling, () => undefined, before.player) === 2)
  const outcome = resolveMove(falling, before, 'right')
  check('a ledge crate pushed at a drop falls', outcome.kind === 'push' && outcome.fell, outcome.kind)
  const after = step(falling, before, 'right')
  check('the fallen crate lands on the floor', !!crateAtCell(after, 3, 1) && after.pushes === 1, where(after))
  check('the pusher follows onto the ledge', at(after, 2, 1), where(after))

  const pinned = worldFromAscii(['######', '#==###', '######'], { overlay: ['      ', ' @r   ', '      '] })
  const start = initialState(pinned)
  const climbed = step(pinned, start, 'right')
  check('a ledge crate against a wall is climbed', at(climbed, 2, 1) && climbed.pushes === 0, where(climbed))
  check('crate on ledge stands three units up', standingHeight(pinned, (x, y) => crateAtCell(climbed, x, y), climbed.player) === 3)
  check('a wall is unreachable even from three units up', step(pinned, climbed, 'right') === climbed)
}

function colorsMustMatch() {
  const rows = ['######', '#@RB.#', '######']
  const mixed = worldFromAscii(rows, { overlay: ['      ', '  br  ', '      '] })
  check('mismatched colors are unsolved', !isSolved(mixed, mixed.crates))
  check('mismatched colors fill nothing', goalsFilled(mixed, mixed.crates) === 0)

  const matched = worldFromAscii(rows, { overlay: ['      ', '  rb  ', '      '] })
  check('matching colors solve the world', isSolved(matched, matched.crates))
  check('matching colors fill both goals', goalsFilled(matched, matched.crates) === 2)

  const half = worldFromAscii(rows, { overlay: ['      ', '  r   ', '      '] })
  check('one of two goals is not solved', !isSolved(half, half.crates))
  check('one of two goals is filled', goalsFilled(half, half.crates) === 1)

  const pushed = worldFromAscii(['######', '#@r.B#', '######'])
  const done = walk(pushed, initialState(pushed), ['right', 'right'])
  check('red pushed onto blue is not solved', !!crateAtCell(done, 4, 1) && !isSolved(pushed, done.crates), where(done))
}

const LOCK_ROWS = ['#########', '#.R.#..B#', '#@..D...#', '#.r.#...#', '#########']
const lockOptions = { rooms: (x: number) => (x < 4 ? 0 : x > 4 ? 1 : -1), depths: [0, 1] }

function withCrates(world: World, state: PlayState, crates: Crate[]): PlayState {
  return { ...state, crates, openedDoors: [...openedDoorsOf(world, crates)] }
}

function doorsOpenWhenTheirRoomIsSolved() {
  const world = worldFromAscii(LOCK_ROWS, lockOptions)
  const start = initialState(world)
  check('the door waits on the shallower room', world.doors[0]!.opensWhen === 0, `${world.doors[0]!.opensWhen}`)
  check('room 0 starts unsolved', !roomSolved(world, world.crates, 0))
  check('an unsolved room starts with its door shut', start.openedDoors.length === 0, `${start.openedDoors}`)

  const atDoor = walk(world, start, ['right', 'right', 'right'])
  check('a shut door is not stepped onto', at(atDoor, 3, 2), where(atDoor))
  check('a shut door blocks the way through', step(world, atDoor, 'right') === atDoor, where(atDoor))

  const solved = withCrates(world, atDoor, [{ ...world.crates[0]!, x: 2, y: 1 }])
  check('solving room 0 opens its door', solved.openedDoors.length === 1 && doorOpensNow(world, world.doors[0]!, solved.crates))
  const through = walk(world, solved, ['right', 'right'])
  check('an open door is walked through', at(through, 5, 2), where(through))

  const fromDeep = withCrates(world, { ...start, player: { x: 5, y: 2 } }, world.crates)
  check('a shut door blocks the way back just the same', step(world, fromDeep, 'left') === fromDeep, where(fromDeep))
  const fromDeepOpen = withCrates(world, { ...start, player: { x: 5, y: 2 } }, [{ ...world.crates[0]!, x: 2, y: 1 }])
  check('an open door is walked back through', at(step(world, fromDeepOpen, 'left'), 4, 2))
}

function doorsStayOpenOnceOpened() {
  const world = worldFromAscii(LOCK_ROWS, lockOptions)
  const solved = withCrates(world, { ...initialState(world), player: { x: 1, y: 1 } }, [{ ...world.crates[0]!, x: 2, y: 1 }])
  const unsolvedAgain = step(world, solved, 'right')
  check('pushing the crate off its goal unsolves the room', !!crateAtCell(unsolvedAgain, 3, 1) && !roomSolved(world, unsolvedAgain.crates, 0), where(unsolvedAgain))
  check('the door it opened stays open', unsolvedAgain.openedDoors.length === 1, `${unsolvedAgain.openedDoors}`)
  const through = walk(world, unsolvedAgain, ['down', 'right', 'right', 'right'])
  check('a latched door is still walked through', at(through, 5, 2), where(through))
  check('a fresh look at the same crates would find it shut', openedDoorsOf(world, unsolvedAgain.crates).size === 0)
}

function cratesNeverPassAShutDoor() {
  const world = worldFromAscii(LOCK_ROWS, lockOptions)
  const pushing = withCrates(world, { ...initialState(world), player: { x: 2, y: 2 } }, [{ id: 0, x: 3, y: 2, color: 'red' }])
  const refused = resolveMove(world, pushing, 'right')
  check('a crate is not pushed onto a shut door', refused.kind === 'climb', refused.kind)
  const pinned = step(world, pushing, 'right')
  check('the refused crate stays put and is climbed instead', !!crateAtCell(pinned, 3, 2) && pinned.pushes === 0 && at(pinned, 3, 2), where(pinned))

  const open = worldFromAscii(['#########', '#...#..B#', '#@..D...#', '#...#...#', '#########'], lockOptions)
  const rolling = withCrates(open, { ...initialState(open), player: { x: 2, y: 2 } }, [{ id: 0, x: 3, y: 2, color: 'red' }])
  check('a room with no puzzle holds its door open', rolling.openedDoors.length === 1)
  const intoDoor = step(open, rolling, 'right')
  check('a crate is pushed onto an open door', !!crateAtCell(intoDoor, 4, 2) && intoDoor.pushes === 1, where(intoDoor))
  const beyond = step(open, intoDoor, 'right')
  check('and on through it', !!crateAtCell(beyond, 5, 2) && at(beyond, 4, 2), where(beyond))
}

function gatesShowWhichDoorsAreShut() {
  const world = worldFromAscii(LOCK_ROWS, lockOptions)
  const shut = worldGates(world, world.crates).filter((gate) => gate.sealed)
  check('an unsolved room seals its door', shut.length === 1, `${shut.length}`)
  check('the gate stands in the doorway', shut[0]!.x === 4 && shut[0]!.y === 2, `${shut[0]!.x},${shut[0]!.y}`)
  check('the gate names the room it waits on', shut[0]!.opensWhen === 0, `${shut[0]!.opensWhen}`)
  const solved = [{ ...world.crates[0]!, x: 2, y: 1 }]
  check('solving the room lifts the gate', worldGates(world, solved).every((gate) => !gate.sealed))
  check('a latched door draws no gate whatever the crates say', worldGates(world, world.crates, [0]).every((gate) => !gate.sealed))
  check('one gate per door', worldGates(world, world.crates).length === world.doors.length)
}

function equalDepthNeighboursNeverGate() {
  const rows = ['#########', '#..R#..B#', '#@..D..b#', '#.r.#...#', '#########']
  const world = worldFromAscii(rows, { rooms: lockOptions.rooms, depths: [1, 1] })
  check('a door between rooms of one depth waits on nobody', world.doors[0]!.opensWhen === null)
  check('neither side gates the other', worldGates(world, world.crates).every((gate) => !gate.sealed))
  const through = walk(world, initialState(world), ['right', 'right', 'right', 'right'])
  check('the loop door is walked through unsolved', at(through, 5, 2), where(through))
  const back = walk(world, through, ['left', 'left'])
  check('and walked straight back', at(back, 3, 2), where(back))
}

const BOUNDARY_ROWS = ['#########', '#..r=..B#', '#@.R#...#', '#..r#...#', '#########']

function boundariesAreOnlyTerrain() {
  const world = worldFromAscii(BOUNDARY_ROWS, lockOptions)
  const onBoundary = walk(world, initialState(world), ['up', 'right', 'right', 'right'])
  check('the boundary ledge is climbed via the crate', at(onBoundary, 4, 1), where(onBoundary))
  check('the boundary belongs to no room', world.roomIds[index(world, 4, 1)] === -1)
  const over = step(world, onBoundary, 'right')
  check('dropping off a ledge into the next room needs no door', at(over, 5, 1), where(over))
  const dropped = step(world, { ...over, player: { x: 4, y: 1 } }, 'left')
  check('dropping back the other way needs none either', at(dropped, 3, 1), where(dropped))
}

function reachabilityMatchesWalking(label: string, world: World, state: PlayState) {
  const expected = reachableByStepping(world, state)
  const actual = reachableCells(world, state.crates, state.player, crateFinder(state.crates), doorLock(world, state.crates, state.openedDoors))
  const same = expected.size === actual.size && [...expected].every((cell) => actual.has(cell))
  check(`reachable cells agree (${label})`, same, `${[...actual].sort().join(' ')} vs ${[...expected].sort().join(' ')}`)
}

function reachableByStepping(world: World, state: PlayState): Set<number> {
  const cells = new Set<number>()
  const seen = new Set<string>([`${state.player.x},${state.player.y}`])
  const queue: PlayState[] = [state]
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head]
    cells.add(index(world, current!.player.x, current!.player.y))
    for (const dir of DIR_LIST) {
      const next = step(world, current!, dir)
      if (next === current || next.pushes !== current!.pushes) continue
      const id = `${next.player.x},${next.player.y}`
      if (seen.has(id)) continue
      seen.add(id)
      queue.push(next)
    }
  }
  return cells
}

function reachabilityChecks() {
  const ledges = worldFromAscii(['######', '#@r=.#', '######'])
  reachabilityMatchesWalking('ledges', ledges, initialState(ledges))

  const lock = worldFromAscii(LOCK_ROWS, lockOptions)
  const start = initialState(lock)
  reachabilityMatchesWalking('shut doors', lock, start)
  const solved = withCrates(lock, start, [{ ...lock.crates[0]!, x: 2, y: 1 }])
  reachabilityMatchesWalking('open doors', lock, solved)

  const held = reachableCells(lock, start.crates, start.player)
  check('a shut door is out of reach', !held.has(index(lock, 4, 2)))
  check('the room behind it stays out of reach', ![...held].some((cell) => lock.roomIds[cell] === 1), `${held.size}`)
  const opened = reachableCells(lock, solved.crates, solved.player)
  check('solving room 0 puts the deep room in reach', [...opened].some((cell) => lock.roomIds[cell] === 1), `${opened.size}`)

  const boundary = worldFromAscii(BOUNDARY_ROWS, lockOptions)
  reachabilityMatchesWalking('boundary ledge', boundary, initialState(boundary))
  reachabilityMatchesWalking('boundary ledge from the deeper room', boundary, {
    ...initialState(boundary),
    player: { x: 5, y: 2 },
  })
}

function stepsNeverMutate() {
  const world = worldFromAscii(LOCK_ROWS, lockOptions)
  const start = initialState(world)
  const snapshot = JSON.stringify(start)
  walk(world, start, ['right', 'down', 'right', 'up', 'right', 'right', 'left'])
  check('step leaves its input untouched', JSON.stringify(start) === snapshot, JSON.stringify(start))
  check('a blocked step returns the same state', step(world, start, 'left') === start)
  check('the world crates are not aliased', world.crates.every((crate, i) => crate !== start.crates[i]))
}

pushesOnFlatGround()
pinnedCratesAreClimbed()
ledgesNeedACrateStep()
ledgeCratesFallAndPin()
colorsMustMatch()
doorsOpenWhenTheirRoomIsSolved()
doorsStayOpenOnceOpened()
cratesNeverPassAShutDoor()
gatesShowWhichDoorsAreShut()
equalDepthNeighboursNeverGate()
boundariesAreOnlyTerrain()
reachabilityChecks()
stepsNeverMutate()

console.log(`sokoban2 play: ${checksRun()} checks`)
reportVerdict()
