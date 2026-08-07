import { useAppRuntime } from '../../app/appRuntimeContext';
import { useRerenderOnItemChange } from '../../app/rerenderHooks';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { HINT_CLASSES } from '../controls/fieldClasses';
import { ItemRow } from './ItemRow';

export function ItemsTab() {
  const { items, perform } = useAppRuntime();
  useRerenderOnItemChange();
  return (
    <>
      {items.all().map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
      <Button className="mt-2" onClick={() => perform('add_item')}>
        + add item
      </Button>
      <p className={classes(HINT_CLASSES, 'mt-2')}>
        Items are pixel art on a transparent background, drawn either as a thickened billboard —
        standing up or lying flat, its rim painted with the edge color — or wrapped on a floating
        cube. Bind one to a points node with display “items” to scatter it through the world, and
        give it a cell footprint so characters can carry it.
      </p>
    </>
  );
}
