import { assetId } from '@/features/asset-library/asset';
import '../nodes';
import { readFileSync } from 'node:fs';
import { newCultureWithId } from '@/features/asset-library/cultures/cultureDef';
import { newPieceWithId } from '@/features/asset-library/pieces/pieceDef';
import { newTileWithId } from '@/features/asset-library/tiles/tileDef';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { nodeTypeOf } from '../nodeRegistry';
import type { NodeInstance, PipelineState } from '../pipeline/pipelineState';
import { libraryDocsFrom, syncMissingPresets, type LibraryDocs } from '../presets/presetSync';
import { sanitizeWorldPresets } from '../presets/worldPreset';

export function checkPresetSync(check: CheckReporter): void {
  checkSyntheticSync(check);
  checkShippedDataFilesSync(check);
  checkBootSyncReadsTheShapeTheAppWrites(check);
}

function checkBootSyncReadsTheShapeTheAppWrites(check: CheckReporter): void {
  const shipped = shippedFixture();
  const docs = new Map<string, unknown>([
    ['tiles', []],
    ['pieces', []],
    ['cultures', []],
    ['worldPresets', { presets: [], hiddenExamples: ['volcanic islands'] }],
  ]);
  const held = libraryDocsFrom((name) => docs.get(name));
  const added = syncMissingPresets(held.library, shipped);
  check('boot sync installs into a world library the app saved as an envelope', added === 1);
  check('the installed preset lands in the envelope the app reads back', held.worldLibrary.presets.length === 1);
  check('boot sync keeps the hidden examples the app recorded', held.worldLibrary.hiddenExamples.length === 1);

  const bare = libraryDocsFrom((name) => (name === 'worldPresets' ? shipped.worldPresets : []));
  check('boot sync still reads a world library saved as a bare array', bare.library.worldPresets.length === 1);
}

function checkSyntheticSync(check: CheckReporter): void {
  const shipped = shippedFixture();
  const empty = emptyLibrary();
  const addedToEmpty = syncMissingPresets(empty, shipped);
  check('a fresh library receives every shipped preset', addedToEmpty === 1 && empty.worldPresets.length === 1);
  check('a synced preset arrives with its tiles, pieces, and culture', empty.tiles.length === 2 && empty.pieces.length === 1 && empty.cultures.length === 1);
  check('every reference in a synced preset resolves inside the library it landed in', danglingRefsOf(empty) === 0);

  const crowded = crowdedLibrary();
  const strangerTile = crowded.tiles[0]!;
  syncMissingPresets(crowded, shipped);
  const synced = crowded.worldPresets[crowded.worldPresets.length - 1]!;
  const bridgeTileId = tileParamOf(synced.state, 'straitBridges', 'bridgeTile');
  check('syncing never rebinds ids a library already gave away', crowded.tiles[0] === strangerTile && bridgeTileId !== strangerTile.id);
  check('a synced preset points at the copies it brought, not at the stranger holding its old id', crowded.tiles.some((tile) => tile.id === bridgeTileId && tile.name === 'shipped stone'));
  check('every reference still resolves after landing in a crowded library', danglingRefsOf(crowded) === 0);

  const again = syncMissingPresets(crowded, shipped);
  check('a second sync of the same presets installs nothing', again === 0);
}

function checkShippedDataFilesSync(check: CheckReporter): void {
  const library = emptyLibrary();
  const shipped = shippedDataFiles();
  const added = syncMissingPresets(library, shipped);
  check('every preset shipped in the repo data files installs into a fresh database', added === shipped.worldPresets.length && added >= 2);
  check('every repo preset resolves all of its asset references after install', danglingRefsOf(library) === 0);
  check('repeating the boot sync against a seeded database installs nothing', syncMissingPresets(library, shipped) === 0);
}

function shippedDataFiles(): LibraryDocs {
  const read = (name: string) => JSON.parse(readFileSync(`data/${name}.json`, 'utf8'));
  return {
    tiles: read('tiles'),
    pieces: read('pieces'),
    cultures: read('cultures'),
    worldPresets: sanitizeWorldPresets(read('worldPresets')),
  };
}

function shippedFixture(): LibraryDocs {
  const stone = { ...newTileWithId(assetId<'tiles'>(0)), name: 'shipped stone' };
  const moss = { ...newTileWithId(assetId<'tiles'>(1)), name: 'shipped moss' };
  const arch = { ...newPieceWithId(assetId<'pieces'>(0)), voxels: newPieceWithId(assetId<'pieces'>(0)).voxels.map((_, at) => assetId<'tiles'>(at === 0 ? 1 : -1)) };
  const culture = { ...newCultureWithId(assetId<'cultures'>(0)), roleBindings: { door: [assetId<'pieces'>(0)] }, wallTileId: assetId<'tiles'>(1) };
  const state: PipelineState = {
    seed: 7,
    daylight: 1,
    time: 0,
    nodes: [bridgesNode(0)],
  };
  return {
    tiles: [stone, moss],
    pieces: [arch],
    cultures: [culture],
    worldPresets: [{ name: 'shipped isle', description: 'fixture', state }],
  };
}

function bridgesNode(bridgeTile: number): NodeInstance {
  return {
    id: 'n1',
    type: 'straitBridges',
    label: 'bridges',
    comment: '',
    folder: '',
    enabled: true,
    params: { bridgeTile },
    inputs: { ground: null },
    display: { mode: 'structures', cultureId: 0 } as NodeInstance['display'],
  };
}

function emptyLibrary(): LibraryDocs {
  return { tiles: [], pieces: [], cultures: [], worldPresets: [] };
}

function crowdedLibrary(): LibraryDocs {
  return {
    tiles: [{ ...newTileWithId(assetId<'tiles'>(0)), name: 'stranger tile' }],
    pieces: [newPieceWithId(assetId<'pieces'>(0))],
    cultures: [newCultureWithId(assetId<'cultures'>(0))],
    worldPresets: [],
  };
}

function tileParamOf(state: PipelineState, nodeType: string, param: string): number {
  const node = state.nodes.find((each) => each.type === nodeType);
  return (node?.params[param] as number) ?? -1;
}

function danglingRefsOf(library: LibraryDocs): number {
  const tileIds = new Set(library.tiles.map((tile) => tile.id));
  const pieceIds = new Set(library.pieces.map((piece) => piece.id));
  const cultureIds = new Set(library.cultures.map((culture) => culture.id));
  let dangling = 0;
  for (const preset of library.worldPresets) {
    for (const node of preset.state.nodes) {
      for (const [name, spec] of Object.entries(nodeTypeOf(node.type)?.params ?? {})) {
        if (spec.kind !== 'tile') continue;
        const value = node.params[name];
        if (typeof value === 'number' && value >= 0 && !tileIds.has(assetId<'tiles'>(value))) dangling += 1;
      }
      const display = node.display;
      if (display.mode === 'markers' && display.tileId >= 0 && !tileIds.has(display.tileId)) dangling += 1;
      if (display.mode === 'pieces' && display.pieceId >= 0 && !pieceIds.has(display.pieceId)) dangling += 1;
      if (display.mode === 'structures' && display.cultureId >= 0 && !cultureIds.has(display.cultureId)) dangling += 1;
    }
  }
  return dangling;
}
