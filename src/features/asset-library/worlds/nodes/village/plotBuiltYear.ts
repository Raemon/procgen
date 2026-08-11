import { RING_PERIOD } from '../../time/worldTime';

export const PLOT_STAGGER_LABEL = 'plot stagger';

export function plotBuiltYear(centerBorn: number, ring: number, stagger01: number): number {
  return centerBorn + ring * RING_PERIOD + stagger01 * RING_PERIOD;
}
