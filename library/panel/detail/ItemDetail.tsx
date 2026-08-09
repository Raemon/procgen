import { useAppRuntime } from '../../../frontend/appRuntimeContext';
import { PanelHint } from '../../../frontend/help/PanelHint';
import { useRerenderOnItemChange } from '../../../frontend/rerenderHooks';
import { ItemRow } from '../../../assets/items/editor/ItemRow';
import { NothingHere } from './NothingHere';

export function ItemDetail({ id }: { id: number }) {
  const { items } = useAppRuntime();
  useRerenderOnItemChange();
  const item = items.all().find((each) => each.id === id);
  if (!item) return <NothingHere what="item" />;
  return (
    <>
      <ItemRow key={item.id} item={item} />
      <PanelHint className="mt-2">
        Items are pixel art on a transparent background, drawn either as a thickened billboard —
        standing up or lying flat, its rim painted with the edge color — or wrapped on a floating
        cube. Bind one to a points node with display “items” to scatter it through the world, and
        give it a cell footprint so characters can carry it.
      </PanelHint>
    </>
  );
}
