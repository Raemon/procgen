import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnCreatureChange } from '../../../frontend/rerenderHooks';
import { isCharacter } from '../creatureDef';
import { Button } from '../../../frontend/controls/Button';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { CreatureRow } from './CreatureRow';

export function CreaturesTab() {
  const { creatures, perform } = useAppRuntime();
  useRerenderOnCreatureChange();
  return (
    <>
      {creatures
        .all()
        .filter((creature) => !isCharacter(creature))
        .map((creature) => (
          <CreatureRow key={creature.id} creature={creature} />
        ))}
      <Button className="mt-2" onClick={() => perform('add_creature')}>
        + add creature
      </Button>
      <PanelHint className="mt-2">
        Creatures spawn from points nodes bound with display “creatures”, one per point near the
        player, and walk their behavior in real time. Pause them with the life button in the world
        view. Give one a bag and it becomes a character, over on the characters tab.
      </PanelHint>
    </>
  );
}
