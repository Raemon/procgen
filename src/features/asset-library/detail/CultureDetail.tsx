import { useAppRuntime } from '@/features/app-shell/runtime/appRuntimeContext';
import { PanelHint } from '@/features/app-shell/help/PanelHint';
import { useRerenderOnCultureChange } from '@/features/app-shell/runtime/rerenderHooks';
import { CultureRow } from '@/features/asset-library/cultures/editor/CultureRow';
import { NothingHere } from './NothingHere';

export function CultureDetail({ id }: { id: number }) {
  const { cultures } = useAppRuntime();
  useRerenderOnCultureChange();
  const culture = cultures.all().find((each) => each.id === id);
  if (!culture) return <NothingHere what="culture" />;
  return (
    <>
      <CultureRow key={culture.id} culture={culture} />
      <PanelHint className="mt-2">
        A culture is how a village is built: the tiles its walls, roofs and floors are painted
        with, the pieces bound to each building role, and the roof style, story height and window
        rhythm every building follows. Bind one to a points node with display “structures” and each
        point grows into a whole assembled building.
      </PanelHint>
    </>
  );
}
