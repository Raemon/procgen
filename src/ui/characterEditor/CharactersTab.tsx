import { useAppRuntime } from '../../app/appRuntimeContext';
import { useRerenderOnCreatureChange } from '../../app/rerenderHooks';
import { isCharacter } from '../../creatures/creatureDef';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { HINT_CLASSES } from '../controls/fieldClasses';
import { CreatureRow } from '../creatureEditor/CreatureRow';

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
      <p className={classes(HINT_CLASSES, 'mt-2')}>
        Characters follow every creature rule — look, behavior, spawning from a points node — and
        additionally carry an inventory: a grid whose slots can be switched off or tagged so only
        certain items fit, with pixel art layered underneath.
      </p>
    </>
  );
}
