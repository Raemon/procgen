import {
  BUILT_IN_BILLBOARD_ART,
  builtInBillboard,
  isBuiltInBillboardArt,
  MOONLIT_DWARF_ART,
} from '../src/creatures/art/builtInBillboards';
import {
  DWARF_IDLE_FRAMES,
  DWARF_WALK_FRAMES,
} from '../src/creatures/art/dwarf/dwarfBillboard';
import { DWARF_SPRITE_SIZE } from '../src/creatures/art/dwarf/dwarfProportions';
import {
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
} from '../src/creatures/character/characterBillboard';
import { CreatureLibrary } from '../src/creatures/creatureLibrary';
import { creaturesAsStoredJson, creaturesFromStoredJson } from '../src/creatures/creatureStorage';
import { CHARACTER } from '../src/creatures/entityKinds';
import { playerCharacterDef, PLAYER_CHARACTER_ID } from '../src/creatures/playerCharacter';
import { isSpriteArt, spriteGridSize } from '../src/world/tiles/spriteArt';
import { FACE_ART_SIZES, isCubeFaceArt, MAX_FACE_ART_SIZE } from '../src/world/tiles/tileFaceArt';
import type { CheckReporter } from './checkCharacterBillboardInvariants';

export function checkPlayerCharacterInvariants(check: CheckReporter): void {
  checkArtResolutionsReachOneThousandTwentyFour(check);
  checkTheDwarfIsDrawnAtOneTwentyEight(check);
  checkTheDwarfIsRichlyAnimated(check);
  checkPlayersAreDrawnAsACharacter(check);
  checkGeneratedFramesStayOutOfStorage(check);
}

function checkArtResolutionsReachOneThousandTwentyFour(check: CheckReporter): void {
  check(
    'art resolutions go up to 1024x1024 and still offer the small ones',
    MAX_FACE_ART_SIZE === 1024 &&
      FACE_ART_SIZES.includes(1024) &&
      FACE_ART_SIZES.includes(128) &&
      FACE_ART_SIZES.includes(4),
  );
  check(
    'sprite art of 128 and 1024 is accepted, and 2048 is not',
    isSpriteArt(new Array<null>(128 * 128).fill(null).map(() => '#ffffff')) &&
      isSpriteArt(new Array<null>(1024 * 1024).fill(null).map(() => '#ffffff')) &&
      !isSpriteArt(new Array<null>(2048 * 2048).fill(null).map(() => '#ffffff')),
  );
  check(
    'cube face art of 1024 is accepted where 64 used to be the ceiling',
    isCubeFaceArt({
      size: 128,
      top: blankFace(128),
      north: blankFace(128),
      east: blankFace(128),
      south: blankFace(128),
      west: blankFace(128),
      bottom: blankFace(128),
    }),
  );
}

function checkTheDwarfIsDrawnAtOneTwentyEight(check: CheckReporter): void {
  const billboard = builtInBillboard(MOONLIT_DWARF_ART)!;
  check(
    'every dwarf frame is valid 128x128 sprite art with something drawn on it',
    CHARACTER_ROTATIONS.every((rotation) =>
      CHARACTER_ANIMATIONS.every((animation) =>
        framesOf(billboard, rotation, animation).every(
          (frame) =>
            isSpriteArt(frame) &&
            spriteGridSize(frame) === DWARF_SPRITE_SIZE &&
            frame.some((pixel) => pixel !== null),
        ),
      ),
    ),
  );
  check(
    'the dwarf leaves the frame edges transparent so she reads as a cut-out',
    CHARACTER_ROTATIONS.every((rotation) =>
      framesOf(billboard, rotation, 'idle').every((frame) => frame[0] === null),
    ),
  );
}

function checkTheDwarfIsRichlyAnimated(check: CheckReporter): void {
  const billboard = builtInBillboard(MOONLIT_DWARF_ART)!;
  check(
    'every rotation carries the full idle and walk cycles',
    CHARACTER_ROTATIONS.every(
      (rotation) =>
        framesOf(billboard, rotation, 'idle').length === DWARF_IDLE_FRAMES &&
        framesOf(billboard, rotation, 'moving').length === DWARF_WALK_FRAMES,
    ),
  );
  check(
    'no two frames of a walk cycle are the same drawing',
    CHARACTER_ROTATIONS.every(
      (rotation) =>
        new Set(framesOf(billboard, rotation, 'moving').map((frame) => frame.join(''))).size ===
        DWARF_WALK_FRAMES,
    ),
  );
  check(
    'the idle cycle breathes rather than holding one pose',
    CHARACTER_ROTATIONS.every(
      (rotation) =>
        new Set(framesOf(billboard, rotation, 'idle').map((frame) => frame.join(''))).size ===
        DWARF_IDLE_FRAMES,
    ),
  );
  check(
    'the five rotations are drawn differently from one another',
    new Set(
      CHARACTER_ROTATIONS.map((rotation) => framesOf(billboard, rotation, 'idle')[0]!.join('')),
    ).size === CHARACTER_ROTATIONS.length,
  );
}

function checkPlayersAreDrawnAsACharacter(check: CheckReporter): void {
  const creatures = new CreatureLibrary();
  const player = playerCharacterDef(creatures)!;
  check(
    'the default library ships a female dwarf as the player character',
    player !== null &&
      player.id === PLAYER_CHARACTER_ID &&
      player.kind === CHARACTER &&
      player.billboardArt === MOONLIT_DWARF_ART,
  );
  check(
    'the player character has sprites to draw, so no capsule is needed',
    player.billboard !== null && player.size > 1,
  );
  check(
    'a library with no dwarf still resolves some character for the player',
    playerCharacterDef(
      new CreatureLibrary(
        creatures.all().filter((creature) => creature.billboardArt !== MOONLIT_DWARF_ART),
      ),
    )?.kind === CHARACTER,
  );
}

function checkGeneratedFramesStayOutOfStorage(check: CheckReporter): void {
  const creatures = new CreatureLibrary();
  const stored = creaturesAsStoredJson(creatures.all());
  check(
    'built-in art is stored as a name, never as its pixels',
    stored.every((creature) => !isBuiltInBillboardArt(creature.billboardArt) || creature.billboard === null),
  );
  check(
    'the saved creature file stays far smaller than the art it names',
    JSON.stringify(stored).length < 40_000,
  );
  const reloaded = creaturesFromStoredJson(JSON.parse(JSON.stringify(stored)))!;
  const player = playerCharacterDef(new CreatureLibrary(reloaded))!;
  check(
    'reloading rebuilds the named art in full',
    player.billboard !== null &&
      framesOf(player.billboard, 'side', 'moving').length === DWARF_WALK_FRAMES,
  );
  check(
    'every built-in art name builds a billboard, and unknown names build nothing',
    BUILT_IN_BILLBOARD_ART.every((art) => builtInBillboard(art) !== null) &&
      builtInBillboard('no-such-art') === null &&
      builtInBillboard(null) === null,
  );
  const painted = creaturesFromStoredJson([
    { ...structuredClone(player), billboardArt: 'no-such-art' },
  ])!;
  check(
    'a creature naming art that no longer exists falls back to its own stored frames',
    painted[0]!.billboardArt === null && painted[0]!.billboard !== null,
  );
}

function blankFace(size: number): (string | null)[] {
  return new Array<string | null>(size * size).fill(null);
}
