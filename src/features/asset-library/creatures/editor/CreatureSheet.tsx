import { useState } from 'react';
import type { CommandParams } from '@/features/app-shell/runtime/commands/command';
import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { isCharacter, type CreatureDef } from '../creatureDef';
import { CHARACTER, CREATURE } from '../entityKinds';
import { Button } from '@/features/app-shell/controls/Button';
import { ConfirmModal } from '@/features/app-shell/controls/ConfirmModal';
import { classes } from '@/features/app-shell/controls/classes';
import { ColorField } from '@/features/app-shell/controls/ColorField';
import { FIELD_CLASSES } from '@/features/app-shell/controls/fieldClasses';
import { PERSISTED_UI_KEYS } from '@/features/app-shell/state/persistedUiKeys';
import { usePersistedOpenPanel } from '@/features/app-shell/state/usePersistedOpenPanel';
import { tooltipHandlers } from '@/features/app-shell/tooltips/tooltipHandlers';
import { deleteRowConfirmation } from '@/features/asset-library/help/rowActionTips';
import { useLibrarySelection } from '@/features/asset-library/panel/useLibrarySelection';
import { CharacterSpritesEditor } from '../../characters/editor/CharacterSpritesEditor';
import { InventoryEditor } from '../../items/inventoryEditor/InventoryEditor';
import { PixelArtEditor } from '../../pixelArtEditor/PixelArtEditor';
import { SymbolInput } from '../../tiles/editor/SymbolInput';
import {
  CHARACTER_BAG_TIP,
  CHARACTER_SPRITES_TIP,
  CREATURE_ART_TIP,
  CREATURE_COLOR_TIP,
  CREATURE_NAME_TIP,
  deleteCreatureTip,
  duplicateCreatureTip,
  MAKE_CHARACTER_TIP,
  MAKE_PLAIN_CREATURE_TIP,
} from './help/creatureTips';
import { CreatureBehaviorKnobs } from './CreatureBehaviorKnobs';
import { CREATURE_PANELS, type CreaturePanel } from './creaturePanels';

export function CreatureSheet({ creature }: { creature: CreatureDef }) {
  const { perform } = useAppRuntime();
  const { openPanel, toggle, forgetRow } = usePersistedOpenPanel<Exclude<CreaturePanel, 'none'>>(
    PERSISTED_UI_KEYS.openCreaturePanels,
    CREATURE_PANELS,
    creature.id,
  );
  const edit = (patch: CommandParams) =>
    perform('update_creature', { creature_id: creature.id, ...patch });
  const character = isCharacter(creature);
  return (
    <div className="mb-1.5">
      <div className="mb-2 flex items-center gap-1.5">
        <ColorField
          ink={creature.color}
          tip={CREATURE_COLOR_TIP}
          onChange={(color) => edit({ color })}
        />
        <SymbolInput
          symbol={creature.symbol}
          tint={creature.color}
          onPick={(symbol) => edit({ symbol })}
        />
        <input
          type="text"
          aria-label="creature name"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          value={creature.name}
          onChange={(event) => edit({ name: event.target.value })}
          {...tooltipHandlers(CREATURE_NAME_TIP)}
        />
      </div>
      <CreatureActionsRow creature={creature} onForgetPanel={forgetRow} />
      <CreatureBehaviorKnobs creature={creature} />
      <div className="mt-2 mb-1.5 flex flex-wrap gap-1.5">
        <Button
          className="px-2 py-0.5 text-[11px]"
          tip={CREATURE_ART_TIP}
          active={openPanel === 'art'}
          onClick={() => toggle('art')}
        >
          cube art
        </Button>
        {character ? (
          <>
            <Button
              className="px-2 py-0.5 text-[11px]"
              tip={CHARACTER_SPRITES_TIP}
              active={openPanel === 'sprites'}
              onClick={() => toggle('sprites')}
            >
              sprites
            </Button>
            <Button
              className="px-2 py-0.5 text-[11px]"
              tip={CHARACTER_BAG_TIP}
              active={openPanel === 'inventory'}
              onClick={() => toggle('inventory')}
            >
              bag
            </Button>
            <Button
              className="px-2 py-0.5 text-[11px]"
              tip={MAKE_PLAIN_CREATURE_TIP}
              onClick={() => edit({ kind: CREATURE })}
            >
              drop the bag
            </Button>
          </>
        ) : (
          <Button
            className="px-2 py-0.5 text-[11px]"
            tip={MAKE_CHARACTER_TIP}
            onClick={() => edit({ kind: CHARACTER })}
          >
            + bag
          </Button>
        )}
      </div>
      {openPanel === 'art' && (
        <PixelArtEditor
          art={creature.faceArt}
          baseColor={creature.color}
          onChange={(faceArt) => edit({ face_art: faceArt })}
        />
      )}
      {openPanel === 'sprites' && character && <CharacterSpritesEditor character={creature} />}
      {openPanel === 'inventory' && character && <InventoryEditor creature={creature} />}
    </div>
  );
}

function CreatureActionsRow({
  creature,
  onForgetPanel,
}: {
  creature: CreatureDef;
  onForgetPanel(): void;
}) {
  const { perform } = useAppRuntime();
  const { clear } = useLibrarySelection();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function deleteThisCreature(): void {
    setConfirmingDelete(false);
    onForgetPanel();
    perform('remove_creature', { creature_id: creature.id });
    clear();
  }

  return (
    <>
      <div className="mb-2 flex gap-1.5">
        <Button
          className="flex-1"
          tip={duplicateCreatureTip(creature)}
          onClick={() => perform('duplicate_creature', { creature_id: creature.id })}
        >
          ⧉ duplicate
        </Button>
        <Button
          className="hover:border-danger-edge hover:text-danger-ink"
          tip={deleteCreatureTip(creature)}
          onClick={() => setConfirmingDelete(true)}
        >
          ✕
        </Button>
      </div>
      {confirmingDelete && (
        <ConfirmModal
          {...deleteRowConfirmation(creature.name)}
          onConfirm={deleteThisCreature}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
