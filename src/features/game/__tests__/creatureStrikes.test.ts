import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { assetId, type CreatureId } from '@/features/asset-library/asset';
import { headingRadians } from '@/features/asset-library/characters/characterFacing';
import { CHASE } from '@/features/asset-library/creatures/behaviorKinds';
import { newCreatureWithId } from '@/features/asset-library/creatures/creatureDef';
import { spawnedCreature } from '../creatureSim/creatureInstance';
import { moveCreatureTowardTarget } from '../creatureSim/moveCreatureTowardTarget';
import { retargetCreature } from '../creatureSim/creatureTargets';

const TICK_SECONDS = 0.1;

export function checkCreatureStrikes(check: CheckReporter): void {
  const gaunt: CreatureId = assetId(0);
  const def = { ...newCreatureWithId(gaunt), behavior: CHASE, speed: 2, sight: 8 };

  const striker = spawnedCreature('striker', gaunt, 0, 0);
  const closePlayer = { playerX: 1.2, playerY: 0 };
  retargetCreature(striker, def, closePlayer, TICK_SECONDS);
  check('a chasing creature within strike range starts attacking', striker.attacking);
  check('its first strike tick starts the attack clock at zero', striker.attackSeconds === 0);
  retargetCreature(striker, def, closePlayer, TICK_SECONDS);
  check('the attack clock advances while the player stays in reach', striker.attackSeconds > 0);
  retargetCreature(striker, def, { playerX: 30, playerY: 0 }, TICK_SECONDS);
  check(
    'losing the player ends the attack and resets the clock',
    !striker.attacking && striker.attackSeconds === 0,
  );

  const stalker = spawnedCreature('stalker', gaunt, 0, 0);
  retargetCreature(stalker, def, { playerX: 1.5, playerY: 0.5 }, TICK_SECONDS);
  moveCreatureTowardTarget(stalker, def, () => true, TICK_SECONDS);
  check(
    'a striking creature keeps facing the player even while it closes the last step',
    stalker.attacking && stalker.moving && stalker.heading === headingRadians(1.5, 0.5),
  );

  const chaser = spawnedCreature('chaser', gaunt, 0, 0);
  retargetCreature(chaser, def, { playerX: 5, playerY: 0 }, TICK_SECONDS);
  moveCreatureTowardTarget(chaser, def, () => true, TICK_SECONDS);
  check(
    'a creature still out of reach chases without attacking and faces where it walks',
    !chaser.attacking && chaser.moving && chaser.heading === headingRadians(1, 0),
  );
}
