import { billboardFigureExtent } from '../../../assets/characters/billboardFigureExtent';
import type { CharacterBillboard } from '../../../assets/characters/characterBillboard';
import type { CreatureDef } from '../../../assets/creatures/creatureDef';

export interface CharacterQuadFit {
  quadWidth: number;
  quadHeight: number;
  centerHeightAboveFeet: number;
}

export function characterQuadFit(def: CreatureDef, billboard: CharacterBillboard): CharacterQuadFit {
  const extent = billboardFigureExtent(billboard);
  if (!extent || extent.widthCells <= 0 || extent.heightCells <= 0) return quadIsTheBody(def);
  const unitsPerCell = Math.max(
    def.bodyWidth / extent.widthCells,
    def.bodyHeight / extent.heightCells,
  );
  const quadSize = extent.gridSize * unitsPerCell;
  return {
    quadWidth: quadSize,
    quadHeight: quadSize,
    centerHeightAboveFeet: quadSize / 2 - extent.cellsBelowFeet * unitsPerCell,
  };
}

function quadIsTheBody(def: CreatureDef): CharacterQuadFit {
  return {
    quadWidth: def.bodyWidth,
    quadHeight: def.bodyHeight,
    centerHeightAboveFeet: def.bodyHeight / 2,
  };
}
