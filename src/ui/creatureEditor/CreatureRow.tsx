import { useAppRuntime } from '../../app/appRuntimeContext';
import { behaviorLabel } from '../../creatures/behaviorKinds';
import type { CreatureDef } from '../../creatures/creatureDef';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { REVEALED_ON_ROW_HOVER, ROW_HOVER_GROUP } from '../controls/revealOnRowHover';
import { COLOR_INPUT_CLASSES, FIELD_CLASSES } from '../controls/fieldClasses';
import { PixelArtEditor } from '../pixelArtEditor/PixelArtEditor';
import { SymbolInput } from '../tileEditor/SymbolInput';
import { isOneOf } from '../uiState/persistedUiGuards';
import { PERSISTED_UI_KEYS } from '../uiState/persistedUiKeys';
import { usePersistedUiRecord } from '../uiState/usePersistedUiRecord';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import {
  CREATURE_ART_TIP,
  CREATURE_COLOR_TIP,
  CREATURE_NAME_TIP,
  creatureBehaviorTip,
  deleteCreatureTip,
} from './help/creatureTips';
import { CreatureBehaviorKnobs } from './CreatureBehaviorKnobs';

const CREATURE_PANELS = ['none', 'behavior', 'art'] as const;

export function CreatureRow({ creature }: { creature: CreatureDef }) {
  const { perform } = useAppRuntime();
  const openPanels = usePersistedUiRecord(
    PERSISTED_UI_KEYS.openCreaturePanels,
    isOneOf(CREATURE_PANELS),
  );
  const openPanel = openPanels.valueOf(String(creature.id)) ?? 'none';
  const toggle = (panel: 'behavior' | 'art') =>
    openPanels.set(String(creature.id), openPanel === panel ? 'none' : panel);
  return (
    <div className="mb-1.5">
      <div className={classes(ROW_HOVER_GROUP, 'flex items-center gap-1.5')}>
        <input
          type="color"
          className={COLOR_INPUT_CLASSES}
          aria-label="body colour"
          value={creature.color}
          onChange={(event) => perform('update_creature', { creature_id: creature.id, color: event.target.value })}
          {...tooltipHandlers(CREATURE_COLOR_TIP)}
        />
        <SymbolInput
          symbol={creature.symbol}
          onPick={(symbol) => perform('update_creature', { creature_id: creature.id, symbol })}
        />
        <input
          type="text"
          aria-label="creature name"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          value={creature.name}
          onChange={(event) => perform('update_creature', { creature_id: creature.id, name: event.target.value })}
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
      {openPanel === 'behavior' && (
        <CreatureBehaviorKnobs creature={creature} />
      )}
      {openPanel === 'art' && (
        <PixelArtEditor
          art={creature.faceArt}
          baseColor={creature.color}
          onChange={(faceArt) => perform('update_creature', { creature_id: creature.id, face_art: faceArt })}
        />
      )}
    </div>
  );
}
