import { examplePipelines } from '../../procgen/presets/examplePipelines';
import { nodeTypesJson, pipelineJson } from '../../agents/nodeCatalog';
import { failure, json, type ApiResponse } from './apiMessages';
import { creatureJson, inventoryJson, itemJson } from './libraryJson';
import { registerRoute } from './routeRegistry';
import type { ServerWorld } from './serverWorld';

registerRoute({
  method: 'GET',
  path: '/pipeline',
  summary: 'the current node pipeline: every node with id, type, params, wiring, display',
  body: {},
  query: {},
  handle: ({ access }) => json(200, { pipeline: pipelineJson(access.current().store) }),
});

registerRoute({
  method: 'GET',
  path: '/node-types',
  summary: 'the catalog of node types you can add, every param and input explained',
  body: {},
  query: {},
  handle: () => json(200, nodeTypesJson()),
});

registerRoute({
  method: 'GET',
  path: '/tiles',
  summary: 'the tileset: what every glyph in an observation means',
  body: {},
  query: {},
  handle: ({ access }) => json(200, { tiles: access.current().tileset.all().map(tileJson) }),
});

registerRoute({
  method: 'GET',
  path: '/templates',
  summary: 'saved groups of wired nodes you can stamp in',
  body: {},
  query: {},
  handle: ({ access }) => json(200, { templates: templatesJson(access.current()) }),
});

registerRoute({
  method: 'GET',
  path: '/presets',
  summary: 'whole worlds you can load',
  body: {},
  query: {},
  handle: ({ access }) => json(200, { presets: presetsJson(access.current()) }),
});

registerRoute({
  method: 'GET',
  path: '/prefabs',
  summary: 'the prefab library: structures a points node can stamp',
  body: {},
  query: {},
  handle: ({ access }) => json(200, { prefabs: access.current().prefabs.all().map(prefabJson) }),
});

registerRoute({
  method: 'GET',
  path: '/creatures',
  summary:
    'the creature library: creatures and characters a points node can spawn, and whether each carries an inventory',
  body: {},
  query: {},
  handle: ({ access }) => json(200, { creatures: access.current().creatures.all().map(creatureJson) }),
});

registerRoute({
  method: 'GET',
  path: '/items',
  summary: 'the item library: items a points node can scatter and a character can carry',
  body: {},
  query: {},
  handle: ({ access }) => json(200, { items: access.current().items.all().map(itemJson) }),
});

registerRoute({
  method: 'GET',
  path: '/creatures/{id}/inventory',
  summary:
    "one character's inventory grid: every slot with its usable flag and tags, and every item placed in it",
  body: {},
  query: {},
  handle: ({ access, params }) => creatureInventory(access.current(), Number(params.id)),
});

function creatureInventory(world: ServerWorld, creatureId: number): ApiResponse {
  const creature = world.creatures.byId(creatureId);
  if (!creature) return failure(404, 'unknown_creature', `no creature ${creatureId}`);
  if (!creature.inventory) {
    return failure(404, 'no_inventory', `creature ${creatureId} has no inventory grid`);
  }
  return json(200, { creature_id: creatureId, inventory: inventoryJson(creature.inventory) });
}

function prefabJson(prefab: { id: number; name: string; width: number; depth: number; layers: number }) {
  return {
    id: prefab.id,
    name: prefab.name,
    width: prefab.width,
    depth: prefab.depth,
    layers: prefab.layers,
  };
}

function tileJson(tile: ReturnType<ServerWorld['tileset']['all']>[number]) {
  return {
    id: tile.id,
    name: tile.name,
    symbol: tile.symbol,
    color: tile.color,
    walkable: tile.walkable,
    height: tile.height,
    light: tile.light,
    light_ink: tile.lightInk,
    has_face_art: tile.faceArt !== null,
  };
}

function templatesJson(world: ServerWorld) {
  return world.templates.all().map((template) => ({
    name: template.name,
    description: template.description,
    node_count: template.nodes.length,
    saved: world.templates.savedTemplates().some((each) => each.name === template.name),
  }));
}

function presetsJson(world: ServerWorld) {
  return [
    ...examplePipelines().map((preset) => ({
      name: preset.name,
      description: preset.description ?? '',
      saved: false,
    })),
    ...world.worldPresets.savedPresets().map((preset) => ({
      name: preset.name,
      description: preset.description,
      saved: true,
    })),
  ];
}
