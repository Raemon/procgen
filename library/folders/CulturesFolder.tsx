import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { useRerenderOnCultureChange } from '../../frontend/rerenderHooks';
import { Button } from '../../frontend/controls/Button';
import { PIECE_ROLES } from '../../assets/pieces/pieceDef';
import { piecesBoundToRole, type Culture } from '../../assets/cultures/cultureDef';
import { ADD_CULTURE_TIP, FOLDER_TIPS } from '../help/libraryTips';
import { LibraryFolder } from '../panel/LibraryFolder';
import { LibraryRow } from '../panel/LibraryRow';
import { useLibrarySelection } from '../useLibrarySelection';

export function CulturesFolder() {
  const { cultures, perform } = useAppRuntime();
  const [, select] = useLibrarySelection();
  useRerenderOnCultureChange();
  const all = cultures.all();

  function addCultureAndSelectIt(): void {
    perform('add_culture');
    const added = cultures.all().at(-1);
    if (added) select('cultures', String(added.id));
  }

  return (
    <LibraryFolder folder="cultures" tip={FOLDER_TIPS.cultures} count={all.length}>
      {all.map((culture) => (
        <LibraryRow
          key={culture.id}
          folder="cultures"
          entryKey={String(culture.id)}
          name={culture.name}
          tip={{ title: culture.name, body: `culture ${culture.id} · ${boundRolesOf(culture)}` }}
        />
      ))}
      <Button className="mt-1 w-full" tip={ADD_CULTURE_TIP} onClick={addCultureAndSelectIt}>
        + add culture
      </Button>
    </LibraryFolder>
  );
}

function boundRolesOf(culture: Culture): string {
  const bound = PIECE_ROLES.filter((role) => piecesBoundToRole(culture, role).length > 0);
  return bound.length > 0 ? `pieces bound: ${bound.join(', ')}` : 'built from tiles alone';
}
