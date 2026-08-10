interface BiomeBandTiles {
  deep: number;
  water: number;
  shore: number;
  ground: number;
  rock: number;
  snow: number;
}

export interface BiomeBands {
  seaLevel: number;
  deepDrop: number;
  shoreBand: number;
  rockAbove: number;
  snowLine: number;
  tiles: BiomeBandTiles;
}

const SHORELINE_IN_DISTANCE_FIELD = 0.5;

export function bandTileAt(
  bands: BiomeBands,
  elevation: number,
  steepness: number | undefined,
  shoreDistance: number | undefined,
): number {
  if (elevation < bands.seaLevel) return waterTile(bands, elevation);
  return landTile(bands, elevation, steepness, shoreDistance);
}

function waterTile(bands: BiomeBands, elevation: number): number {
  return elevation < bands.seaLevel - bands.deepDrop ? bands.tiles.deep : bands.tiles.water;
}

function landTile(
  bands: BiomeBands,
  elevation: number,
  steepness: number | undefined,
  shoreDistance: number | undefined,
): number {
  if (elevation >= bands.snowLine) return bands.tiles.snow;
  if (isOnShore(bands, elevation, shoreDistance)) return bands.tiles.shore;
  if (steepness !== undefined && steepness >= bands.rockAbove) return bands.tiles.rock;
  return bands.tiles.ground;
}

function isOnShore(
  bands: BiomeBands,
  elevation: number,
  shoreDistance: number | undefined,
): boolean {
  if (shoreDistance !== undefined) {
    return shoreDistance < SHORELINE_IN_DISTANCE_FIELD + bands.shoreBand;
  }
  return elevation < bands.seaLevel + bands.shoreBand;
}
