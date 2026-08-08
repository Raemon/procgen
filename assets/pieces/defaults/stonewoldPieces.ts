import { defaultTileId } from '../../tiles/defaultTiles';
import { culturePieceBlueprints, type CulturePieceNames } from './culturePieceSet';
import type { PieceBlueprint } from './pieceBlueprint';

export const STONEWOLD_PIECE_NAMES: CulturePieceNames = {
  wallRun: 'granite wall run',
  cornerPost: 'granite corner quoin',
  windowedWall: 'granite shuttered wall',
  doorway: 'iron-strapped granite doorway',
  roofEave: 'slate shingle eave',
  roofRidge: 'slate ridge cap',
  gableEnd: 'granite gable end',
  floorSlab: 'oak plank floor slab',
  chimney: 'granite chimney stack',
};

export function stonewoldPieceBlueprints(): PieceBlueprint[] {
  return culturePieceBlueprints(STONEWOLD_PIECE_NAMES, {
    footing: defaultTileId('granite footing'),
    wall: defaultTileId('dressed granite wall'),
    frame: defaultTileId('oak beam'),
    door: defaultTileId('iron-strapped oak door'),
    window: defaultTileId('oak shutter window'),
    roofSlope: defaultTileId('slate shingle roof'),
    roofRidge: defaultTileId('slate roof ridge'),
    floor: defaultTileId('oak plank floor'),
    chimney: defaultTileId('granite chimney'),
    chimneyCap: defaultTileId('granite footing'),
  });
}
