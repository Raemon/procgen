import '@/features/asset-library/worlds/nodes';
import { performCommand } from '@/features/app-shell/runtime/commands/performCommand';
import type { CommandContext } from '@/features/app-shell/runtime/commands/command';
import { CreatureAssets } from '@/features/asset-library/creatures/creatureAssets';
import { ItemAssets } from '@/features/asset-library/items/itemAssets';
import { TORCH_ITEM_ID } from '@/features/asset-library/items/defaultItems';
import { emptyPipeline } from '@/features/asset-library/worlds/pipeline/pipelineState';
import { PipelineStore } from '@/features/asset-library/worlds/pipeline/pipelineStore';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';

export function checkInsertAhead(check: CheckReporter): void {
  checkAnItemLandsOneTileAhead(check);
  checkACreatureLandsOneTileAhead(check);
  checkAnUnknownIdLeavesTheWorldAlone(check);
}

function checkAnItemLandsOneTileAhead(check: CheckReporter): void {
  const world = insertionWorld();
  const result = performCommand(world.context, 'god', 'insert_item', { item_id: TORCH_ITEM_ID });
  const node = world.store.nodes()[0];
  check(
    'inserting an item plants a landmark point on the tile ahead of an east-facing player',
    result.ok &&
      node?.type === 'landmarkPoint' &&
      node.params.x === 4 &&
      node.params.y === -2,
  );
  check(
    'the planted landmark displays that item',
    node?.display.mode === 'items' && node.display.itemId === TORCH_ITEM_ID,
  );
}

function checkACreatureLandsOneTileAhead(check: CheckReporter): void {
  const world = insertionWorld();
  const creature = world.creatures.add();
  const result = performCommand(world.context, 'god', 'insert_creature', {
    creature_id: creature.id,
  });
  const node = world.store.nodes()[0];
  check(
    'inserting a creature plants a landmark point displaying that creature',
    result.ok &&
      node?.type === 'landmarkPoint' &&
      node.display.mode === 'creatures' &&
      node.display.creatureId === creature.id,
  );
}

function checkAnUnknownIdLeavesTheWorldAlone(check: CheckReporter): void {
  const world = insertionWorld();
  const badItem = performCommand(world.context, 'god', 'insert_item', { item_id: 999 });
  const badCreature = performCommand(world.context, 'god', 'insert_creature', { creature_id: 999 });
  check(
    'inserting an id the library does not know fails without touching the pipeline',
    !badItem.ok && !badCreature.ok && world.store.nodes().length === 0,
  );
}

function insertionWorld(): {
  store: PipelineStore;
  creatures: CreatureAssets;
  context: CommandContext;
} {
  const store = new PipelineStore(emptyPipeline());
  const creatures = new CreatureAssets([]);
  const context = {
    store,
    items: new ItemAssets(),
    creatures,
    actor: {
      pose: () => ({ x: 3, y: -2, facing: 2 }),
      tryStep: () => true,
      turn: () => undefined,
      sightRadiusTiles: () => 1,
      setSightRadiusTiles: () => undefined,
    },
  } as unknown as CommandContext;
  return { store, creatures, context };
}
