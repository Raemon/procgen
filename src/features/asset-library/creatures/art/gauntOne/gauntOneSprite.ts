import { blankSpriteCanvas, spriteArtOf } from '../paint/spriteCanvas';
import type { SpriteArt } from '../../../tiles/spriteArt';
import type { CharacterRotation } from '../../../characters/characterBillboard';
import type { GauntPose } from './gauntOnePose';
import { gauntOneView } from './gauntOneView';
import { paintGauntArm, paintGauntLeg } from './gauntOneLimbs';
import { paintGauntAntlers, paintGauntNeck, paintGauntSkull } from './gauntOneSkull';
import { paintGauntTorso } from './gauntOneTorso';
import { GAUNT_ONE_SPRITE_SIZE, type GauntFrame } from './gauntOneStrokes';

export { GAUNT_ONE_SPRITE_SIZE };

export function gauntOneSprite(rotation: CharacterRotation, pose: GauntPose): SpriteArt {
  const frame: GauntFrame = {
    canvas: blankSpriteCanvas(GAUNT_ONE_SPRITE_SIZE),
    view: gauntOneView(rotation),
    pose,
  };
  if (frame.view.face === 'none') paintFacingAway(frame);
  else paintFacingViewer(frame);
  return spriteArtOf(frame.canvas);
}

function paintFacingViewer(frame: GauntFrame): void {
  paintGauntArm(frame, 1);
  paintGauntLeg(frame, 1);
  paintGauntTorso(frame);
  paintGauntLeg(frame, -1);
  paintGauntArm(frame, -1);
  paintGauntNeck(frame);
  paintGauntSkull(frame);
  paintGauntAntlers(frame);
}

function paintFacingAway(frame: GauntFrame): void {
  paintGauntSkull(frame);
  paintGauntAntlers(frame);
  paintGauntNeck(frame);
  paintGauntArm(frame, 1);
  paintGauntLeg(frame, 1);
  paintGauntTorso(frame);
  paintGauntLeg(frame, -1);
  paintGauntArm(frame, -1);
}
