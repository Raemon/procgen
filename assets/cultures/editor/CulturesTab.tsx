import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { useRerenderOnCultureChange } from '../../../frontend/rerenderHooks';
import { Button } from '../../../frontend/controls/Button';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { CultureRow } from './CultureRow';
import { ADD_CULTURE_TIP } from './help/cultureTips';

export function CulturesTab() {
  const { cultures, perform } = useAppRuntime();
  useRerenderOnCultureChange();
  return (
    <>
      {cultures.all().map((culture) => (
        <CultureRow key={culture.id} culture={culture} />
      ))}
      <Button className="mt-2" tip={ADD_CULTURE_TIP} onClick={() => perform('add_culture')}>
        + add culture
      </Button>
      <PanelHint className="mt-2">
        A culture is how a village is built: the tiles its walls, roofs and floors are painted
        with, the pieces bound to each building role, and the roof style, story height and window
        rhythm every building follows. Bind one to a points node with display “structures” and each
        point grows into a whole assembled building.
      </PanelHint>
    </>
  );
}
