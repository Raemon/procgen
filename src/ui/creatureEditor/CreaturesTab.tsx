import { useAppRuntime } from '../../app/appRuntimeContext';
import { useRerenderOnCreatureChange } from '../../app/rerenderHooks';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { HINT_CLASSES } from '../controls/fieldClasses';
import { CreatureRow } from './CreatureRow';

export function CreaturesTab() {
  const { creatures, perform } = useAppRuntime();
  useRerenderOnCreatureChange();
  return (
    <>
      {creatures.all().map((creature) => (
        <CreatureRow key={creature.id} creature={creature} />
      ))}
      <Button className="mt-2" onClick={() => perform('add_creature')}>
        + add creature
      </Button>
      <p className={classes(HINT_CLASSES, 'mt-2')}>
        Creatures spawn from points nodes bound with display “creatures”, one per point near the
        player, and walk their behavior in real time. Pause them with the life button in the world
        view.
      </p>
    </>
  );
}
