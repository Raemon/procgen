import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { behaviorLabel } from '../behaviorKinds';
import { isCharacter, type CreatureDef } from '../creatureDef';
import { CHARACTER, CREATURE } from '../entityKinds';
import { Button } from '../../../frontend/controls/Button';
import { classes } from '../../../frontend/controls/classes';
import { REVEALED_ON_ROW_HOVER, ROW_HOVER_GROUP } from '../../../frontend/controls/revealOnRowHover';
import { ColorField } from '../../../frontend/controls/ColorField';
import { FIELD_CLASSES } from '../../../frontend/controls/fieldClasses';
import { CharacterSpritesEditor } from '../../characters/editor/CharacterSpritesEditor';
import { InventoryEditor } from '../../items/inventoryEditor/InventoryEditor';
import { PixelArtEditor } from '../../pixelArtEditor/PixelArtEditor';
import { SymbolInput } from '../../tiles/editor/SymbolInput';
import { isOneOf } from '../../../frontend/uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../../../frontend/uiState/persistedUiKeys';
import { usePersistedUiRecord } from '../../../frontend/uiState/usePersistedUiRecord';
import { tooltipHandlers } from '../../../frontend/tooltips/tooltipHandlers';
import {
  CHARACTER_BAG_TIP,
  CHARACTER_SPRITES_TIP,
  CREATURE_ART_TIP,
  CREATURE_COLOR_TIP,
  CREATURE_NAME_TIP,
  creatureBehaviorTip,
  deleteCreatureTip,
  MAKE_CHARACTER_TIP,
  MAKE_PLAIN_CREATURE_TIP,
} from './help/creatureTips';
import { CreatureBehaviorKnobs } from './CreatureBehaviorKnobs';
import { CREATURE_PANELS, type CreaturePanel } from './creaturePanels';

export function CreatureRow({ creature }: { creature: CreatureDef }) {
  const { perform } = useAppRuntime();
  const openPanels = usePersistedUiRecord(
    PERSISTED_UI_KEYS.openCreaturePanels,
    isOneOf(CREATURE_PANELS),
  );
  const openPanel = openPanels.valueOf(String(creature.id)) ?? 'none';
  const edit = (patch: Record<string, unknown>) =>
    perform('update_creature', { creature_id: creature.id, ...patch });
  const toggle = (panel: Exclude<CreaturePanel, 'none'>) =>
    openPanels.set(String(creature.id), openPanel === panel ? 'none' : panel);
  return (
    <div className="mb-1.5">
      <div className={classes(ROW_HOVER_GROUP, 'flex items-center gap-1.5')}>
        <ColorField ink={creature.color} tip={CREATURE_COLOR_TIP} onChange={(color) => edit({ color })} />
        <SymbolInput symbol={creature.symbol} onPick={(symbol) => edit({ symbol })} />
        <input
          type="text"
          aria-label="creature name"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          value={creature.name}
          onChange={(event) => edit({ name: event.target.value })}
          {...tooltipHandlers(CREATURE_NAME_TIP)}
        />
        <Button
          className="px-2 py-0.5 text-[11px]"
          tip={creatureBehaviorTip(creature)}
          active={openPanel === 'behavior'}
          onClick={() => toggle('behavior')}
        >
          {behaviorLabel(creature.behavior)}
        </Button>
        <Button
          className="px-2 py-0.5"
          tip={CREATURE_ART_TIP}
          active={openPanel === 'art'}
          onClick={() => toggle('art')}
        >
          art
        </Button>
        {isCharacter(creature) ? (
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
          </>
        ) : (
          <Button
            className="px-2 py-0.5 text-[11px]"
            tip={MAKE_CHARACTER_TIP}
            onClick={() => edit({ kind: CHARACTER })}
          >
            +bag
          </Button>
        )}
        <Button
          className={classes(REVEALED_ON_ROW_HOVER, 'px-2 py-0.5')}
          tip={{ title: `duplicate ${creature.name}`, body: 'Copies the creature, art and knobs included.' }}
          onClick={() => perform('duplicate_creature', { creature_id: creature.id })}
        >
          ⧉
        </Button>
        <Button
          className={classes(
            REVEALED_ON_ROW_HOVER,
            'px-2 py-0.5 hover:border-danger-edge hover:text-danger-ink',
          )}
          tip={deleteCreatureTip(creature)}
          onClick={() => perform('remove_creature', { creature_id: creature.id })}
        >
          ×
        </Button>
      </div>
      {openPanel === 'sprites' && isCharacter(creature) && (
        <CharacterSpritesEditor character={creature} />
      )}
      {openPanel === 'behavior' && <CreatureBehaviorKnobs creature={creature} />}
      {openPanel === 'art' && (
        <PixelArtEditor
          art={creature.faceArt}
          baseColor={creature.color}
          onChange={(faceArt) => edit({ face_art: faceArt })}
        />
      )}
      {openPanel === 'inventory' && isCharacter(creature) && (
        <>
          <InventoryEditor creature={creature} />
          <Button
            className="mt-1.5 px-2 py-0.5 text-[11px]"
            tip={MAKE_PLAIN_CREATURE_TIP}
            onClick={() => edit({ kind: CREATURE })}
          >
            make it a plain creature
          </Button>
        </>
      )}
    </div>
  );
}
