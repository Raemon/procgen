import { defaultTileId } from '../../tiles/defaultTiles';
import { culturePieceBlueprints, type CulturePieceNames } from './culturePieceSet';
import type { PieceBlueprint } from './pieceBlueprint';

export const THATCHMERE_PIECE_NAMES: CulturePieceNames = {
  wallRun: 'wattle wall run',
  cornerPost: 'wattle corner post',
  windowedWall: 'wattle small-paned wall',
  doorway: 'oak-planked doorway',
  roofEave: 'thatch eave course',
  roofRidge: 'thatch ridge bundle',
  gableEnd: 'thatch gable end',
  floorSlab: 'rammed earth floor slab',
  chimney: 'clay chimney stack',
};

export function thatchmerePieceBlueprints(): PieceBlueprint[] {
  return culturePieceBlueprints(THATCHMERE_PIECE_NAMES, {
    footing: defaultTileId('fieldstone footing'),
    wall: defaultTileId('limewashed wattle wall'),
    frame: defaultTileId('oak cruck frame'),
    door: defaultTileId('oak plank door'),
    window: defaultTileId('small-paned window'),
    roofSlope: defaultTileId('thatch roof'),
    roofRidge: defaultTileId('thatch roof ridge'),
    floor: defaultTileId('rammed earth floor'),
    chimney: defaultTileId('clay chimney'),
    chimneyCap: defaultTileId('fieldstone footing'),
  });
}
