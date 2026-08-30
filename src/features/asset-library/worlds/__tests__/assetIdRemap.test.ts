import { assetId } from '@/features/asset-library/asset';
import '../nodes';
import { newCultureWithId } from '@/features/asset-library/cultures/cultureDef';
import { newPieceWithId } from '@/features/asset-library/pieces/pieceDef';
import { newTileWithId } from '@/features/asset-library/tiles/tileDef';
import type { CheckReporter } from '@/features/app-shell/__tests__/reporter';
import { nodeTypeOf } from '../nodeRegistry';
import type { NodeInstance, PipelineState } from '../pipeline/pipelineState';
import {
  remappedCultureRefs,
  remappedPieceTiles,
  remappedPipeline,
  type AssetIdMaps,
} from '../seeds/assetIdRemap';

interface Library {
  tiles: ReturnType<typeof newTileWithId>[];
  pieces: ReturnType<typeof newPieceWithId>[];
  cultures: ReturnType<typeof newCultureWithId>[];
  states: PipelineState[];
}

export function checkAssetIdRemap(check: CheckReporter): void {
  const crowded = crowdedLibrary();
  const strangerTile = crowded.tiles[0]!;
  const landed = landGeneratedWorldIn(crowded);

  check(
    'landing a generated world in a crowded library never rebinds an id the library gave away',
    crowded.tiles[0] === strangerTile && landed.bridgeTile !== strangerTile.id,
  );
  check(
    'the landed world points at the copies it brought, not at the stranger holding its old id',
    crowded.tiles.some((tile) => tile.id === landed.bridgeTile && tile.name === 'generated stone'),
  );
  check(
    'every reference in the landed world resolves inside the library it landed in',
    danglingRefsOf(crowded) === 0,
  );

  const fresh = emptyLibrary();
  landGeneratedWorldIn(fresh);
  check(
    'a world landing in an empty library brings its tiles, pieces and culture with it',
    fresh.tiles.length === 2 && fresh.pieces.length === 1 && fresh.cultures.length === 1,
  );
  check('every reference resolves in the empty library too', danglingRefsOf(fresh) === 0);
}

function landGeneratedWorldIn(library: Library): { bridgeTile: number } {
  const generated = generatedWorld();
  const maps: AssetIdMaps = {
    tileMap: new Map(
      generated.tiles.map((tile, at) => [tile.id, assetId<'tiles'>(nextId(library.tiles) + at)]),
    ),
    pieceMap: new Map(
      generated.pieces.map((piece, at) => [piece.id, assetId<'pieces'>(nextId(library.pieces) + at)]),
    ),
    cultureMap: new Map([
      [generated.cultures[0]!.id, assetId<'cultures'>(nextId(library.cultures))],
    ]),
  };
  library.tiles.push(
    ...generated.tiles.map((tile) => ({ ...tile, id: maps.tileMap.get(tile.id)! })),
  );
  library.pieces.push(
    ...generated.pieces.map((piece) => ({
      ...remappedPieceTiles(piece, maps.tileMap),
      id: maps.pieceMap.get(piece.id)!,
    })),
  );
  library.cultures.push({
    ...remappedCultureRefs(generated.cultures[0]!, maps),
    id: maps.cultureMap.get(generated.cultures[0]!.id)!,
  });
  const state = remappedPipeline(generated.state, maps);
  library.states.push(state);
  return { bridgeTile: tileParamOf(state, 'straitBridges', 'bridgeTile') };
}

function generatedWorld() {
  const stone = { ...newTileWithId(assetId<'tiles'>(0)), name: 'generated stone' };
  const moss = { ...newTileWithId(assetId<'tiles'>(1)), name: 'generated moss' };
  const blank = newPieceWithId(assetId<'pieces'>(0));
  const arch = {
    ...blank,
    voxels: blank.voxels.map((_, at) => assetId<'tiles'>(at === 0 ? 1 : -1)),
  };
  const culture = {
    ...newCultureWithId(assetId<'cultures'>(0)),
    roleBindings: { door: [assetId<'pieces'>(0)] },
    wallTileId: assetId<'tiles'>(1),
  };
  return {
    tiles: [stone, moss],
    pieces: [arch],
    cultures: [culture],
    state: { seed: 7, daylight: 1, time: 0, nodes: [bridgesNode(0)] } as PipelineState,
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

function emptyLibrary(): Library {
  return { tiles: [], pieces: [], cultures: [], states: [] };
}

function crowdedLibrary(): Library {
  return {
    tiles: [{ ...newTileWithId(assetId<'tiles'>(0)), name: 'stranger tile' }],
    pieces: [newPieceWithId(assetId<'pieces'>(0))],
    cultures: [newCultureWithId(assetId<'cultures'>(0))],
    states: [],
  };
}

function nextId(assets: ReadonlyArray<{ id: number }>): number {
  return assets.reduce((highest, asset) => Math.max(highest, asset.id), -1) + 1;
}

function tileParamOf(state: PipelineState, nodeType: string, param: string): number {
  const node = state.nodes.find((each) => each.type === nodeType);
  return (node?.params[param] as number) ?? -1;
}

function danglingRefsOf(library: Library): number {
  const tileIds = new Set(library.tiles.map((tile) => tile.id));
  const pieceIds = new Set(library.pieces.map((piece) => piece.id));
  const cultureIds = new Set(library.cultures.map((culture) => culture.id));
  let dangling = 0;
  for (const state of library.states) {
    for (const node of state.nodes) {
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
