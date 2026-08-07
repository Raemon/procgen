import { useState } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { behaviorLabel } from '../../creatures/behaviorKinds';
import { isCharacter, type CreatureDef } from '../../creatures/creatureDef';
import { CHARACTER, CREATURE } from '../../creatures/entityKinds';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { COLOR_INPUT_CLASSES, FIELD_CLASSES } from '../controls/fieldClasses';
import { InventoryEditor } from '../inventoryEditor/InventoryEditor';
import { PixelArtEditor } from '../pixelArtEditor/PixelArtEditor';
import { SymbolInput } from '../tileEditor/SymbolInput';
import { CreatureBehaviorKnobs } from './CreatureBehaviorKnobs';

type OpenPanel = 'none' | 'behavior' | 'art' | 'inventory';

export function CreatureRow({ creature }: { creature: CreatureDef }) {
  const { perform } = useAppRuntime();
  const [openPanel, setOpenPanel] = useState<OpenPanel>('none');
  const edit = (patch: Record<string, unknown>) =>
    perform('update_creature', { creature_id: creature.id, ...patch });
  const toggle = (panel: Exclude<OpenPanel, 'none'>) =>
    setOpenPanel(openPanel === panel ? 'none' : panel);
  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          className={COLOR_INPUT_CLASSES}
          title="color"
          value={creature.color}
          onChange={(event) => edit({ color: event.target.value })}
        />
        <SymbolInput symbol={creature.symbol} onPick={(symbol) => edit({ symbol })} />
        <input
          type="text"
          title="name"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          value={creature.name}
          onChange={(event) => edit({ name: event.target.value })}
        />
        <Button
          className="px-2 py-0.5 text-[11px]"
          title={`behavior: ${behaviorLabel(creature.behavior)}`}
          active={openPanel === 'behavior'}
          onClick={() => toggle('behavior')}
        >
          {behaviorLabel(creature.behavior)}
        </Button>
        <Button
          className="px-2 py-0.5"
          title="cube art"
          active={openPanel === 'art'}
          onClick={() => toggle('art')}
        >
          art
        </Button>
        {isCharacter(creature) ? (
          <Button
            className="px-2 py-0.5 text-[11px]"
            title="inventory grid"
            active={openPanel === 'inventory'}
            onClick={() => toggle('inventory')}
          >
            bag
          </Button>
        ) : (
          <Button
            className="px-2 py-0.5 text-[11px]"
            title="make this a character: same creature rules, plus an inventory"
            onClick={() => edit({ kind: CHARACTER })}
          >
            +bag
          </Button>
        )}
        <Button
          className="px-2 py-0.5"
          title="duplicate"
          onClick={() => perform('duplicate_creature', { creature_id: creature.id })}
        >
          ⧉
        </Button>
        <Button
          className="px-2 py-0.5 hover:border-danger-edge hover:text-danger-ink"
          title="delete"
          onClick={() => perform('remove_creature', { creature_id: creature.id })}
        >
          ×
        </Button>
      </div>
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
            title="demote to a plain creature; the inventory is kept but no longer shown"
            onClick={() => edit({ kind: CREATURE })}
          >
            make it a plain creature
          </Button>
        </>
      )}
    </div>
  );
}
