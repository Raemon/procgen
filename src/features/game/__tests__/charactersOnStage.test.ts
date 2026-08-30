import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import type { AgentObservation } from '@/features/agents/observation';
import { CameraFocus } from '../render/camera/cameraFocus';
import { FollowCamera } from '../render/view3d/followCamera';
import {
  charactersInPlay,
  characterNamed,
  characterWithId,
  tilesBetween,
} from '../multiplayer/client/charactersInPlay';
import { RemotePlayers } from '../multiplayer/client/remotePlayers';
import { AGENT_GLYPH, withCharactersPainted } from '../render/agentText/characterGlyphs';

export function checkCharactersOnStage(check: CheckReporter): void {
  const world = { playerX: 4, playerY: 4, facing: 0 as const, sightRadiusTiles: 10, godViewSizeTiles: 33, on: () => () => undefined };
  const remote = new RemotePlayers();
  remote.selfId = 1;
  remote.applyMeta({ t: 'entityMeta', id: 7, name: 'agent_probe', kind: 'agent' });
  remote.applySnapshot([
    [1, 4, 4, 0, 0, 0],
    [7, 6, 3, 0, 0, 0],
  ]);

  const roster = charactersInPlay(world, remote);
  check('the roster starts with you at your own tile', roster[0]?.isSelf === true && roster[0]?.x === 4);
  check('the roster lists the agent by name and kind', roster[1]?.name === 'agent_probe' && roster[1]?.kind === 'agent');
  check('a character can be looked up by entity id', characterWithId(world, remote, 7)?.y === 3);
  check('an agent card can find its entity by name', characterNamed(world, remote, 'agent_probe')?.id === 7);
  check('distance is measured in whole tiles', tilesBetween(roster[0]!, roster[1]!) === 2);

  const focus = new CameraFocus();
  let announcements = 0;
  focus.subscribe(() => announcements++);
  focus.follow(7);
  focus.follow(7);
  check('following an entity announces once', focus.followedId() === 7 && announcements === 1);
  focus.clear();
  check('clearing the focus returns to the player', focus.followedId() === null && announcements === 2);

  const camera = new FollowCamera();
  camera.update(0, 4, 4, 0);
  camera.lookAtTile(6, 3);
  const focused = camera.focusPoint();
  check('looking at a tile moves the camera focus onto it', focused.x === 6 && focused.y === 3);
  camera.recenterOnPlayer();
  check('recentering returns the focus to the followed player', camera.focusPoint().x === 4);

  const painted = withCharactersPainted(observationOf(['.....', '.....', '.....', '.....', '.....'], 4, 4), roster);
  check('you are painted at the middle of your own view', painted.view[2]?.[2] === '@');
  check('an agent two tiles east is painted with the agent glyph', painted.view[1]?.[4] === AGENT_GLYPH);
  check(
    'the legend names the agent it painted',
    painted.legend.some((entry) => entry.glyph === AGENT_GLYPH && entry.meaning.includes('agent_probe (6,3)')),
  );
}

function observationOf(view: string[], x: number, y: number): AgentObservation {
  return {
    mode: 'god',
    position: { x, y },
    facing: 'north',
    viewSize: view.length,
    sightRadiusTiles: null,
  godViewSizeTiles: 33,
    view,
    elevation: null,
    elevationFloorSteps: null,
    legend: [],
    interaction: null,
  };
}
