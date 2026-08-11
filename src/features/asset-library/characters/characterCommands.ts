import {
  blankCharacterBillboard,
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
  hasAnyFrame,
  isCharacterAnimation,
  isCharacterRotation,
  MAX_ANIMATION_FRAMES,
  ROTATION_HELP,
  type CharacterAnimation,
  type CharacterBillboard,
  type CharacterRotation,
} from '@/features/asset-library/characters/characterBillboard';
import { clampFps } from '@/features/asset-library/characters/sanitizeCharacterBillboard';
import { CHARACTER } from '@/features/asset-library/creatures/entityKinds';
import type { SpriteArt } from '@/features/asset-library/tiles/spriteArt';
import {
  commandFailed,
  commandSucceeded,
  type CommandContext,
  type CommandResult,
  type CommandSpec,
} from '@/features/app-shell/runtime/commands/command';
import { listOf, readInt, readNumber, readText } from '@/features/app-shell/runtime/commands/commandParams';
import { createCommandCollection } from '@/features/app-shell/runtime/commands/commandCollection';
import { withCreature } from '@/features/asset-library/creatures/creatureCommands';
import { spriteFrom } from '@/features/asset-library/items/itemCommands';

const { define: registerCommand, commands: characterCommands } = createCommandCollection();
export { characterCommands };



const CREATURE_ID_HELP = 'id of an existing creature or character — see GET /api/v1/asset-library/creatures';

function registerCharacterArtCommand(
  spec: Omit<CommandSpec, 'mode' | 'group' | 'changesWorld'>,
): CommandSpec {
  return registerCommand({ ...spec, mode: 'god', group: 'assets', changesWorld: true });
}

registerCharacterArtCommand({
  action: 'set_character_frame',
  humanControl: 'detail panel, characters: paint a frame in the sprites editor',
  description:
    'Paint one frame of one animation of one rotation. Passing the frame after the last one appends it; the character grows a billboard the first time you do this, and the 2.5D view stops drawing it as a cube.',
  params: {
    creature_id: { kind: 'int', help: CREATURE_ID_HELP },
    rotation: { kind: 'text', help: rotationHelp() },
    animation: { kind: 'text', help: animationHelp() },
    frame: { kind: 'int', help: `0-based frame index; the frame count is the append slot (max ${MAX_ANIMATION_FRAMES})` },
    sprite: {
      kind: 'json',
      help: 'a flat array of size*size "#rrggbb" strings and nulls, where null is transparent',
    },
  },
  example: {
    action: 'set_character_frame',
    creature_id: 7,
    rotation: 'front',
    animation: 'idle',
    frame: 0,
    sprite: ['#d9a878', null, null, '#d9a878'],
  },
  apply: (context, params) => setFrame(context, params),
});

registerCharacterArtCommand({
  action: 'remove_character_frame',
  humanControl: 'detail panel, characters: ✕ on a frame in the sprites editor',
  description:
    'Drop one frame from one animation. Removing the last frame everywhere takes the billboard away and the character goes back to a cube.',
  params: {
    creature_id: { kind: 'int', help: CREATURE_ID_HELP },
    rotation: { kind: 'text', help: rotationHelp() },
    animation: { kind: 'text', help: animationHelp() },
    frame: { kind: 'int', help: 'the 0-based frame index to drop' },
  },
  example: {
    action: 'remove_character_frame',
    creature_id: 7,
    rotation: 'front',
    animation: 'moving',
    frame: 3,
  },
  apply: (context, params) => removeFrame(context, params),
});

registerCharacterArtCommand({
  action: 'set_character_animation_fps',
  humanControl: 'detail panel, characters: the idle and moving fps knobs',
  description: 'How fast one of the two animations plays, in frames per second (0-30).',
  params: {
    creature_id: { kind: 'int', help: CREATURE_ID_HELP },
    animation: { kind: 'text', help: animationHelp() },
    fps: { kind: 'number', help: 'frames per second, 0 to 30; 0 freezes on the first frame' },
  },
  example: { action: 'set_character_animation_fps', creature_id: 7, animation: 'moving', fps: 10 },
  apply: (context, params) => setFps(context, params),
});

registerCharacterArtCommand({
  action: 'clear_character_billboard',
  humanControl: 'detail panel, characters: clear sprites',
  description:
    'Throw away every frame of every rotation. The character falls back to the cube art creatures use.',
  params: { creature_id: { kind: 'int', help: CREATURE_ID_HELP } },
  example: { action: 'clear_character_billboard', creature_id: 7 },
  apply: (context, params) =>
    withCreature(context, params, (creatureId) => {
      context.creatures.update(creatureId, { billboardArt: null, billboard: null });
      return commandSucceeded(`creature ${creatureId} has no billboard sprites`);
    }),
});

function rotationHelp(): string {
  const named = CHARACTER_ROTATIONS.map((rotation) => `'${rotation}' (${ROTATION_HELP[rotation]})`);
  return `which of the five rotations — ${named.join(', ')}. The mirrored halves of the turn reuse these, flipped.`;
}

function animationHelp(): string {
  return `'idle' or 'moving' — ${listOf(CHARACTER_ANIMATIONS)}`;
}

function setFrame(context: CommandContext, params: Record<string, unknown>): CommandResult {
  return withClip(context, params, (creatureId, billboard, rotation, animation) => {
    const sprite = spriteFrom(params);
    if (!sprite.ok) return sprite.failure;
    if (!sprite.value) return commandFailed('invalid_value', "'sprite' must be sprite art, not null");
    const frames = framesOf(billboard, rotation, animation);
    const index = readInt(params, 'frame');
    if (!index.ok) return index.failure;
    if (!isWritableFrame(index.value, frames.length)) {
      return commandFailed(
        'invalid_value',
        `'frame' must be 0-${frames.length} for ${rotation}/${animation} (${frames.length} is append), and at most ${MAX_ANIMATION_FRAMES - 1}`,
      );
    }
    saveBillboard(context, creatureId, withFrame(billboard, rotation, animation, index.value, sprite.value));
    return commandSucceeded(`${rotation}/${animation} frame ${index.value} painted on creature ${creatureId}`);
  });
}

function removeFrame(context: CommandContext, params: Record<string, unknown>): CommandResult {
  return withClip(context, params, (creatureId, billboard, rotation, animation) => {
    const frames = framesOf(billboard, rotation, animation);
    const index = readInt(params, 'frame');
    if (!index.ok) return index.failure;
    if (index.value < 0 || index.value >= frames.length) {
      return commandFailed(
        'invalid_value',
        `'frame' must be 0-${frames.length - 1} for ${rotation}/${animation}`,
      );
    }
    const next = withoutFrame(billboard, rotation, animation, index.value);
    saveBillboard(context, creatureId, hasAnyFrame(next) ? next : null);
    return commandSucceeded(`${rotation}/${animation} frame ${index.value} dropped from creature ${creatureId}`);
  });
}

function setFps(context: CommandContext, params: Record<string, unknown>): CommandResult {
  return withCreature(context, params, (creatureId) => {
    const animation = animationFrom(params);
    if (!animation.ok) return animation.failure;
    const billboard = context.creatures.byId(creatureId)!.billboard;
    if (!billboard) return noBillboard(creatureId);
    const fps = readNumber(params, 'fps');
    if (!fps.ok) return fps.failure;
    const clamped = clampFps(fps.value, billboard.idleFps);
    saveBillboard(context, creatureId, {
      ...billboard,
      idleFps: animation.value === 'idle' ? clamped : billboard.idleFps,
      movingFps: animation.value === 'moving' ? clamped : billboard.movingFps,
    });
    return commandSucceeded(`creature ${creatureId} plays ${animation.value} at ${clamped} fps`);
  });
}

function withClip(
  context: CommandContext,
  params: Record<string, unknown>,
  use: (
    creatureId: number,
    billboard: CharacterBillboard,
    rotation: CharacterRotation,
    animation: CharacterAnimation,
  ) => CommandResult,
): CommandResult {
  return withCreature(context, params, (creatureId) => {
    const rotation = rotationFrom(params);
    if (!rotation.ok) return rotation.failure;
    const animation = animationFrom(params);
    if (!animation.ok) return animation.failure;
    const billboard = context.creatures.byId(creatureId)!.billboard ?? blankCharacterBillboard();
    return use(creatureId, billboard, rotation.value, animation.value);
  });
}

function rotationFrom(
  params: Record<string, unknown>,
): { ok: true; value: CharacterRotation } | { ok: false; failure: CommandResult } {
  const read = readText(params, 'rotation');
  if (!read.ok) return read;
  if (!isCharacterRotation(read.value)) {
    return { ok: false, failure: commandFailed('invalid_value', `'rotation' — ${rotationHelp()}`) };
  }
  return { ok: true, value: read.value };
}

function animationFrom(
  params: Record<string, unknown>,
): { ok: true; value: CharacterAnimation } | { ok: false; failure: CommandResult } {
  const read = readText(params, 'animation');
  if (!read.ok) return read;
  if (!isCharacterAnimation(read.value)) {
    return { ok: false, failure: commandFailed('invalid_value', `'animation' — ${animationHelp()}`) };
  }
  return { ok: true, value: read.value };
}

function isWritableFrame(index: number, frameCount: number): boolean {
  return index >= 0 && index <= frameCount && index < MAX_ANIMATION_FRAMES;
}

function withFrame(
  billboard: CharacterBillboard,
  rotation: CharacterRotation,
  animation: CharacterAnimation,
  index: number,
  sprite: SpriteArt,
): CharacterBillboard {
  const frames = [...framesOf(billboard, rotation, animation)];
  frames[index] = sprite;
  return replacedFrames(billboard, rotation, animation, frames);
}

function withoutFrame(
  billboard: CharacterBillboard,
  rotation: CharacterRotation,
  animation: CharacterAnimation,
  index: number,
): CharacterBillboard {
  const frames = framesOf(billboard, rotation, animation).filter((_, at) => at !== index);
  return replacedFrames(billboard, rotation, animation, frames);
}

function replacedFrames(
  billboard: CharacterBillboard,
  rotation: CharacterRotation,
  animation: CharacterAnimation,
  frames: SpriteArt[],
): CharacterBillboard {
  const clips = structuredClone(billboard.clips);
  clips[rotation][animation] = frames;
  return { ...billboard, clips };
}

function saveBillboard(
  context: CommandContext,
  creatureId: number,
  billboard: CharacterBillboard | null,
): void {
  context.creatures.update(creatureId, { billboardArt: null, billboard, kind: CHARACTER });
}

function noBillboard(creatureId: number): CommandResult {
  return commandFailed(
    'no_billboard',
    `creature ${creatureId} has no billboard sprites — paint one with set_character_frame`,
  );
}
