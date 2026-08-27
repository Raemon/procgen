import type { PointAttrSpec } from '../nodeType';
import type { WorldPoint } from './chunkValues';

export const BORN = 'born';
export const PROGRAM = 'program';
export const FACING = 'facing';
export const DEPOSIT_KIND = 'depositKind';
export const RICHNESS = 'richness';
export const CHAIN_ID = 'chainId';
export const CONE_RADIUS = 'coneRadius';
export const CONE_HEIGHT = 'coneHeight';
export const HOST_X = 'hostX';
export const HOST_Y = 'hostY';
export const SENT_FROM_X = 'sentFromX';
export const SENT_FROM_Y = 'sentFromY';

export interface PointWithData {
  data?: Readonly<Record<string, number>>;
}

export function pointNumber(point: PointWithData, key: string, fallback: number): number {
  const value = point.data?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function hasPointNumber(point: WorldPoint, key: string): boolean {
  return typeof point.data?.[key] === 'number' && Number.isFinite(point.data[key]);
}

export const BORN_ATTR: PointAttrSpec = {
  key: BORN,
  label: 'born',
  help: 'The world year this point came into being. Time-aware nodes read it; a point without one is treated as having always been here.',
  units: 'years',
};

export const CHAIN_ID_ATTR: PointAttrSpec = {
  key: CHAIN_ID,
  label: 'chain',
  help: 'Which hotspot chain the point belongs to, so everything descended from one plume can be told apart from its neighbours.',
  units: 'id',
};

export const CONE_RADIUS_ATTR: PointAttrSpec = {
  key: CONE_RADIUS,
  label: 'cone radius',
  help: 'How far the volcano’s un-eroded footprint reaches from its vent.',
  units: 'tiles',
};

export const CONE_HEIGHT_ATTR: PointAttrSpec = {
  key: CONE_HEIGHT,
  label: 'cone height',
  help: 'How tall the volcano stood when it was new, on the same 0..1 scale as the elevation it is added to.',
  units: 'unit',
};

export const DEPOSIT_KIND_ATTR: PointAttrSpec = {
  key: DEPOSIT_KIND,
  label: 'deposit kind',
  help: 'Which mineral this is, as an index into the deposit names — what a feature label calls it.',
  units: 'id',
};

export const RICHNESS_ATTR: PointAttrSpec = {
  key: RICHNESS,
  label: 'richness',
  help: 'How much is there, from a trace to a seam worth founding a camp on.',
  units: 'unit',
};

export const HOST_ATTRS: readonly PointAttrSpec[] = [
  { key: HOST_X, label: 'host x', help: 'World x of the volcano this deposit formed under.', units: 'tiles' },
  { key: HOST_Y, label: 'host y', help: 'World y of the volcano this deposit formed under.', units: 'tiles' },
];

export const SENT_FROM_ATTRS: readonly PointAttrSpec[] = [
  { key: SENT_FROM_X, label: 'sent from x', help: 'World x of the village that sent the miners.', units: 'tiles' },
  { key: SENT_FROM_Y, label: 'sent from y', help: 'World y of the village that sent the miners.', units: 'tiles' },
];

export const PROGRAM_ATTR: PointAttrSpec = {
  key: PROGRAM,
  label: 'program',
  help: 'Which building the plot is for, as an index into the building program catalog.',
  units: 'id',
};

export const FACING_ATTR: PointAttrSpec = {
  key: FACING,
  label: 'facing',
  help: 'Which way the building fronts, as a quarter turn: 0 east, 1 south, 2 west, 3 north.',
  units: 'id',
};

export const VOLCANO_ATTRS: readonly PointAttrSpec[] = [
  BORN_ATTR,
  CHAIN_ID_ATTR,
  CONE_RADIUS_ATTR,
  CONE_HEIGHT_ATTR,
];

export const CONE_SHAPE_KEYS: readonly string[] = [BORN, CONE_RADIUS, CONE_HEIGHT];
