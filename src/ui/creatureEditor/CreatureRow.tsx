import { useState } from 'react';
import { useAppRuntime } from '../../app/appRuntimeContext';
import { behaviorLabel } from '../../creatures/behaviorKinds';
import type { CreatureDef } from '../../creatures/creatureDef';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { COLOR_INPUT_CLASSES, FIELD_CLASSES } from '../controls/fieldClasses';
import { PixelArtEditor } from '../pixelArtEditor/PixelArtEditor';
import { SymbolInput } from '../tileEditor/SymbolInput';
import { CreatureBehaviorKnobs } from './CreatureBehaviorKnobs';

export function CreatureRow({ creature }: { creature: CreatureDef }) {
  const { creatures } = useAppRuntime();
  const [openPanel, setOpenPanel] = useState<'none' | 'behavior' | 'art'>('none');
  const toggle = (panel: 'behavior' | 'art') =>
    setOpenPanel(openPanel === panel ? 'none' : panel);
  return (
    <div className="mb-1.5">
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          className={COLOR_INPUT_CLASSES}
          title="color"
          value={creature.color}
          onChange={(event) => creatures.update(creature.id, { color: event.target.value })}
        />
        <SymbolInput
          symbol={creature.symbol}
          onPick={(symbol) => creatures.update(creature.id, { symbol })}
        />
        <input
          type="text"
          title="name"
          className={classes(FIELD_CLASSES, 'min-w-0 flex-1')}
          value={creature.name}
          onChange={(event) => creatures.update(creature.id, { name: event.target.value })}
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
        <Button
          className="px-2 py-0.5 hover:border-danger-edge hover:text-danger-ink"
          title="delete creature"
          onClick={() => creatures.remove(creature.id)}
        >
          ×
        </Button>
      </div>
      {openPanel === 'behavior' && (
        <CreatureBehaviorKnobs creature={creature} library={creatures} />
      )}
      {openPanel === 'art' && (
        <PixelArtEditor
          art={creature.faceArt}
          baseColor={creature.color}
          onChange={(faceArt) => creatures.update(creature.id, { faceArt })}
        />
      )}
    </div>
  );
}
