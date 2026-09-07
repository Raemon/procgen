import '../index'
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter'
import { NO_ITEMS } from '@/features/asset-library/items/itemAssets'
import { nodeOfType, storeWithNodes } from '@/features/game/__tests__/rulesFixtures'
import type { DefaultRules, MineSlots, StepAttempt } from '@/features/game/worldRules'
import { SOKOBAN2_NODE_TYPE } from '../node/dungeonKnobs'
import { fromDungeon } from '../node/worldValue'
import { doorLock } from '../play/doors'
import { reachableCells } from '../play/reach'
import { sokoban2Rules, type Sokoban2Rules } from '../rules/overlay'
import type { World } from '../types'
import { crateFinder, index } from '../world'
import { worldFromAscii } from './referees/ascii'

const NO_MINE: MineSlots = { get: () => null, set: () => undefined }
const NEVER_ASKED: DefaultRules = {
  step: () => ({ allowed: false, why: 'the overlay decides' }),
  jump: () => null,
  surfaceAt: () => 0,
  tileIsWalkable: () => true,
  climbGate: () => true,
}

export function checkSteppingUp(check: CheckReporter): void {
  checkACrateWithRoomIsPushed(check)
  checkACrateWithoutRoomIsClimbed(check)
  checkAOneBlockRiseIsSteppedOnto(check)
  checkATwoBlockLedgeStillRefuses(check)
  checkTheRefereeReachesWhatTheStepsReach(check)
}

function checkACrateWithRoomIsPushed(check: CheckReporter): void {
  const rules = rulesFor(worldFromAscii(['#####', '#@r.#', '#####']))
  const player = rules.spawn()!
  const pushed = rules.step(attempt(player, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  check('walking into a crate with a free cell beyond it still pushes the crate along', pushed.allowed && rules.crates()[0]!.x === 3)
  check('the pushed crate leaves floor behind it, so you end the step on the ground', rules.surfaceRiseAt(player.x + 1, player.y) === 0)
}

function checkACrateWithoutRoomIsClimbed(check: CheckReporter): void {
  const rules = rulesFor(worldFromAscii(['#####', '#@r##', '#####']))
  const player = rules.spawn()!
  const climbed = rules.step(attempt(player, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  check('walking into a crate a wall pins climbs onto it rather than refusing', climbed.allowed)
  check('the pinned crate stays put and now holds you one block up', rules.crates()[0]!.x === 2 && rules.surfaceRiseAt(player.x + 1, player.y) === 1)
}

function checkAOneBlockRiseIsSteppedOnto(check: CheckReporter): void {
  const rules = rulesFor(raisedBy(worldFromAscii(['#####', '#@..#', '#####']), 2, 1, 1))
  const player = rules.spawn()!
  const up = rules.step(attempt(player, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  check('walking into ground one block high steps up onto it without asking for a jump', up.allowed)
}

function checkATwoBlockLedgeStillRefuses(check: CheckReporter): void {
  const rules = rulesFor(worldFromAscii(['#####', '#@=.#', '#####']))
  const player = rules.spawn()!
  const refused = rules.step(attempt(player, 1, 0, true, true), NO_MINE, NEVER_ASKED)
  check('walking into a ledge two blocks high is still refused', !refused.allowed)
  check('and the refusal says to push a crate against the ledge and jump from it', !refused.allowed && refused.why.includes('crate'))
  check('a jump straight at that ledge is refused too', rules.jump({ from: player, dx: 1, dy: 0 }, NO_MINE, NEVER_ASKED) === null)
}

function checkTheRefereeReachesWhatTheStepsReach(check: CheckReporter): void {
  const world = raisedBy(worldFromAscii(['######', '#@r###', '#....#', '######']), 4, 2, 1)
  const rules = rulesFor(world)
  const reached = reachableCells(world, world.crates, world.start, crateFinder(world.crates), doorLock(world, world.crates))
  const onTheCrate = reached.has(index(world, 2, 1))
  const onTheRise = reached.has(index(world, 4, 2))
  const stepsOntoTheRise = rules
    .step(attempt(fromDungeon(world, { x: 3, y: 2 }), 1, 0, true, false), NO_MINE, NEVER_ASKED)
    .allowed
  check('the referee flood the generator solves with counts a climbable crate and a one-block rise as reachable', onTheCrate && onTheRise)
  check('and the overlay takes the same step the flood counted, so runtime and generator agree', stepsOntoTheRise)
}

function raisedBy(world: World, x: number, y: number, height: number): World {
  const heights = Uint8Array.from(world.heights)
  heights[index(world, x, y)] = height
  return { ...world, heights }
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
