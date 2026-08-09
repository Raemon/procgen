import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { PanelHint } from '../../frontend/help/PanelHint';
import { useRerenderOnCreatureChange } from '../../frontend/rerenderHooks';
import { CreatureRow } from '../../assets/creatures/editor/CreatureRow';
import { NothingHere } from './NothingHere';

export function CreatureDetail({ id, character }: { id: number; character: boolean }) {
  const { creatures } = useAppRuntime();
  useRerenderOnCreatureChange();
  const creature = creatures.all().find((each) => each.id === id);
  if (!creature) return <NothingHere what={character ? 'character' : 'creature'} />;
  return (
    <>
      <CreatureRow creature={creature} />
      {character ? <CharacterHint /> : <CreatureHint />}
    </>
  );
}

function CreatureHint() {
  return (
    <PanelHint className="mt-2">
      Creatures spawn from points nodes bound with display “creatures”, one per point near the
      player, and walk their behavior in real time. Pause them with the life button in the world
      view. Give one a bag and it becomes a character, over in the characters folder.
    </PanelHint>
  );
}

function CharacterHint() {
  return (
    <PanelHint className="mt-2">
      Characters follow every creature rule — look, behavior, spawning from a points node — and
      additionally carry an inventory: a grid whose slots can be switched off or tagged so only
      certain items fit, with pixel art layered underneath.
    </PanelHint>
  );
}
