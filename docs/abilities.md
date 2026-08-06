# Abilities: the one way anything changes

Every ability in this application is an entry in `src/abilities/`. There is no
second path. A human clicking a button and an LLM POSTing to the API run the
same registered function, with the same validation and the same failure text.

## What counts as an ability

An ability is anything that changes the world or the definitions it is built
from: nodes, knobs, wiring, displays, the seed, tiles, prefabs, creatures,
templates, presets, and where the player stands.

View state is not an ability: camera angle, zoom, pan, which view mode you are
looking at, which panel is open, panel widths, the creature clock, and the
prefab editor's own clipboard and undo stack. These change what you are looking
at, never what is there. If you are unsure which side of the line something is
on, ask whether an agent reading an observation could tell that it happened.

## Adding one

`registerAbility` in `src/abilities/abilityRegistry.ts` is the only way in, and
it takes a complete declaration:

```ts
registerAbility({
  action: 'rename_prefab',
  mode: 'god',
  group: 'library',
  humanControl: 'library panel, prefabs tab: the name field on a prefab row',
  description: 'Rename a prefab. Nodes bind prefabs by id, so renaming is safe.',
  params: { prefab_id: { kind: 'int', help: '...' }, name: { kind: 'text', help: '...' } },
  example: { action: 'rename_prefab', prefab_id: 0, name: 'gatehouse' },
  changesWorld: true,
  apply: (context, params) => ...,
});
```

It throws at module load — a startup crash, not a runtime surprise — on a
duplicate action, a param with no help text, or an example that does not match
the declared params. `GET /api/v1/docs` is rendered from these declarations, so
a new ability documents itself and cannot drift from the code. Never write API
prose that duplicates the table; add the entry to the table.

## Why a UI-only ability is not merely discouraged

The panels cannot reach a mutable object. `AppRuntime` hands out
`ReadOnlyTileset`, `ReadOnlyPipelineStore`, `ReadOnlyPrefabLibrary` and friends
(`src/app/readOnlyLibraries.ts`) — `Pick<>` views with every mutator removed.
The real `Tileset`, `PipelineStore`, `PrefabLibrary`, `CreatureLibrary`,
`TemplateLibrary`, `WorldPresetLibrary` and `World` live in the closure of
`createAppRuntime` and are handed to nothing but the ability context. A panel
that tries to change something directly does not fail review; it fails to
compile, because the method is not on the type it holds.

`npm run check` closes the loop:

- **only the ability layer and the runtime can hold a mutable library** — a
  source scan (`scripts/checkAbilityLayerIsTheOnlyMutator.ts`) that fails if any
  file outside `src/abilities/`, the runtime, the API or the model packages
  value-imports one of those classes.
- **every ability is reachable through the API dispatcher**, and the docs list
  every ability, its example, and the human control that invokes it.
- **character mode owns nothing but movement.**

## The two dispatchers

Both call `performAbility(context, mode, action, params)`:

- The browser builds its context from the live objects in `createAppRuntime`
  and exposes it as `runtime.perform(...)`. Applying locally is deliberate: the
  production build is a static site with no server, so the UI cannot depend on
  the API being reachable.
- The dev-server API builds its context from `data/*.json`
  (`src/agent/api/serverWorld.ts`), applies the same ability, writes every
  library back to `data/`, and notifies the browser over the vite websocket so
  the page reflects an agent's edit live.

Because the API only exists in the vite dev server, a deployed static build has
the UI but no agents. That is a hosting limitation, not a design one: the same
abilities are behind both.
