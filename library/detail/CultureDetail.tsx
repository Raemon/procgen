import { useAppRuntime } from '../../frontend/appRuntimeContext';
import { PanelHint } from '../../frontend/help/PanelHint';
import { useRerenderOnCultureChange } from '../../frontend/rerenderHooks';
import { CultureRow } from '../../assets/cultures/editor/CultureRow';
import { NothingHere } from './NothingHere';

export function CultureDetail({ id }: { id: number }) {
  const { cultures } = useAppRuntime();
  useRerenderOnCultureChange();
  const culture = cultures.all().find((each) => each.id === id);
  if (!culture) return <NothingHere what="culture" />;
  return (
    <>
      <CultureRow culture={culture} />
      <PanelHint className="mt-2">
        A culture is how a village is built: the tiles its walls, roofs and floors are painted
        with, the pieces bound to each building role, and the roof style, story height and window
        rhythm every building follows. Bind one to a points node with display “structures” and each
        point grows into a whole assembled building.
      </PanelHint>
    </>
  );
}
