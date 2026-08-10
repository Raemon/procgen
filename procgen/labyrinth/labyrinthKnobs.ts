export const LABYRINTH_NODE_TYPE = 'labyrinthChunks';

export const LABYRINTH_SEED_LABEL = 'labyrinth';

export interface LabyrinthKnobs {
  seed: number;
  roomFraction: number;
  tutorialRings: number;
  corridor: number;
  wall: number;
  braid: number;
  carver: number;
  doorJitter: number;
  wallTile: number;
  floorTile: number;
}

export function labyrinthKnobsFrom(
  seed: number,
  params: Record<string, number | string>,
): LabyrinthKnobs {
  return {
    seed,
    roomFraction: params.roomFraction as number,
    tutorialRings: params.tutorialRings as number,
    corridor: params.corridor as number,
    wall: params.wall as number,
    braid: params.braid as number,
    carver: params.carver as number,
    doorJitter: params.doorJitter as number,
    wallTile: (params.wallTile as number) ?? 0,
    floorTile: (params.floorTile as number) ?? 0,
  };
}
