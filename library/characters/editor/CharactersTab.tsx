import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnCreatureChange } from '../../../frontend/rerenderHooks';
import { isCharacter } from '../../creatures/creatureDef';
import { Button } from '../../../frontend/controls/Button';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { CreatureRow } from '../../creatures/editor/CreatureRow';

export function CharactersTab() {
  const { creatures, perform } = useAppRuntime();
  useRerenderOnCreatureChange();
  return (
    <>
      {creatures
        .all()
        .filter(isCharacter)
        .map((character) => (
          <CreatureRow key={character.id} creature={character} />
        ))}
      <Button className="mt-2" onClick={() => perform('add_character')}>
        + add character
      </Button>
      <PanelHint className="mt-2">
        Characters follow every creature rule — look, behavior, spawning from a points node — and
        additionally carry an inventory: a grid whose slots can be switched off or tagged so only
        certain items fit, with pixel art layered underneath.
      </PanelHint>
    </>
  );
}
