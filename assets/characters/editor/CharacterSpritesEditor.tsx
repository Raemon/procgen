import { useState } from 'react';
import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import {
  ANIMATION_HELP,
  CHARACTER_ANIMATIONS,
  CHARACTER_ROTATIONS,
  framesOf,
  fpsOf,
  ROTATION_HELP,
  type CharacterAnimation,
  type CharacterBillboard,
  type CharacterRotation,
} from '../characterBillboard';
import type { CreatureDef } from '../../creatures/creatureDef';
import { blankSpriteArt, type SpriteArt } from '../../tiles/spriteArt';
import { Button } from '../../../frontend/controls/Button';
import { KnobRow } from '../../../frontend/controls/KnobRow';
import { Slider } from '../../../frontend/controls/Slider';
import { ValueReadout } from '../../../frontend/controls/ValueReadout';
import { classes } from '../../../frontend/controls/classes';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { CLEAR_SPRITES_TIP } from '../../creatures/editor/help/creatureTips';
import { SpriteArtEditor } from '../../pixelArtEditor/SpriteArtEditor';
import { tooltipHandlers } from '../../../frontend/tooltips/tooltipHandlers';
import { SpriteFrameStrip } from './SpriteFrameStrip';

const NEW_FRAME_SIZE = 16;

export function CharacterSpritesEditor({ character }: { character: CreatureDef }) {
  const { perform } = useAppRuntime();
  const [rotation, setRotation] = useState<CharacterRotation>('front');
  const [animation, setAnimation] = useState<CharacterAnimation>('idle');
  const [frame, setFrame] = useState(0);
  const billboard = character.billboard;
  const frames = billboard ? framesOf(billboard, rotation, animation) : [];
  const editFrame = (index: number, sprite: SpriteArt) =>
    perform('set_character_frame', {
      creature_id: character.id,
      rotation,
      animation,
      frame: index,
      sprite,
    });
  return (
    <div className="mt-1.5 rounded border border-art-edge bg-art-panel p-2">
      <TabRow
        values={CHARACTER_ROTATIONS}
        active={rotation}
        help={ROTATION_HELP}
        onSelect={(next) => {
          setRotation(next);
          setFrame(0);
        }}
      />
      <TabRow
        values={CHARACTER_ANIMATIONS}
        active={animation}
        help={ANIMATION_HELP}
        onSelect={(next) => {
          setAnimation(next);
          setFrame(0);
        }}
      />
      <SpriteFrameStrip
        frames={frames}
        selected={frame}
        onSelect={setFrame}
        onAdd={() => {
          editFrame(frames.length, newFrameLike(frames));
          setFrame(frames.length);
        }}
        onRemove={(index) => {
          perform('remove_character_frame', {
            creature_id: character.id,
            rotation,
            animation,
            frame: index,
          });
          setFrame(0);
        }}
      />
      {frames[frame] ? (
        <SpriteArtEditor
          key={`${character.id}-${rotation}-${animation}-${frame}`}
          sprite={frames[frame]!}
          onChange={(sprite) => editFrame(frame, sprite ?? blankSpriteArt(NEW_FRAME_SIZE))}
        />
      ) : (
        <PanelHint>
          No frames for {rotation}/{animation} yet. The 2.5D view falls back to another rotation
          until you paint one.
        </PanelHint>
      )}
      {billboard && <FpsRows character={character} billboard={billboard} />}
      <div className="mt-2 flex items-center gap-1.5">
        <Button
          className="px-2 py-0.5 text-[11px] hover:border-danger-edge hover:text-danger-ink"
          tip={CLEAR_SPRITES_TIP}
          onClick={() => perform('clear_character_billboard', { creature_id: character.id })}
        >
          clear sprites
        </Button>
        <PanelHint>
          The quad turns to face the camera; the five rotations cover the eight compass facings,
          the mirrored half flipped.
        </PanelHint>
      </div>
    </div>
  );
}

function TabRow<T extends string>({
  values,
  active,
  help,
  onSelect,
}: {
  values: readonly T[];
  active: T;
  help: Readonly<Record<T, string>>;
  onSelect(value: T): void;
}) {
  return (
    <div className="mb-1.5 flex flex-wrap gap-1">
      {values.map((value) => (
        <Button
          key={value}
          className={classes('px-2 py-0.5 text-[11px]')}
          active={value === active}
          onClick={() => onSelect(value)}
          {...tooltipHandlers({ title: value, body: help[value] })}
        >
          {value}
        </Button>
      ))}
    </div>
  );
}

function FpsRows({
  character,
  billboard,
}: {
  character: CreatureDef;
  billboard: CharacterBillboard;
}) {
  const { perform } = useAppRuntime();
  return (
    <>
      {CHARACTER_ANIMATIONS.map((animation) => (
        <KnobRow
          key={animation}
          className="mt-2"
          label={`${animation} fps`}
          tip={{ title: `${animation} fps`, body: `How fast the ${animation} frames play. 0 freezes on the first frame.` }}
        >
          <Slider
            min={0}
            max={30}
            step={1}
            value={fpsOf(billboard, animation)}
            onChange={(fps) =>
              perform('set_character_animation_fps', { creature_id: character.id, animation, fps })
            }
          />
          <ValueReadout value={fpsOf(billboard, animation)} />
        </KnobRow>
      ))}
    </>
  );
}

function newFrameLike(frames: readonly SpriteArt[]): SpriteArt {
  const last = frames[frames.length - 1];
  return last ? [...last] : blankSpriteArt(NEW_FRAME_SIZE);
}
