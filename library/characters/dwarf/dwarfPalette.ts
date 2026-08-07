import type { SurfaceInk } from '../../creatures/art/paint/sculptedInk';

export interface DwarfPalette {
  skin: SurfaceInk;
  hair: SurfaceInk;
  cloak: SurfaceInk;
  tunic: SurfaceInk;
  leather: SurfaceInk;
  metal: SurfaceInk;
  gold: SurfaceInk;
  ember: string;
  emberCore: string;
  gem: string;
  eye: string;
  eyeShine: string;
  lip: string;
  halo: string;
  groundShadow: string;
}

export const MOONLIT_DWARF_PALETTE: DwarfPalette = {
  skin: { base: '#c6b0a8', shadow: '#4e4657', rim: '#f1e7ea' },
  hair: { base: '#c3b8ad', shadow: '#4a4149', rim: '#f6f0e4' },
  cloak: { base: '#232f43', shadow: '#0d121c', rim: '#7d9bb4' },
  tunic: { base: '#3a544f', shadow: '#161f22', rim: '#8fbfae' },
  leather: { base: '#3a2e2b', shadow: '#150f10', rim: '#8b6f5c' },
  metal: { base: '#8b93a1', shadow: '#2b3038', rim: '#e6edf7' },
  gold: { base: '#a98a4e', shadow: '#3d2f1a', rim: '#ffe9b0' },
  ember: '#ff8a3c',
  emberCore: '#ffe7b8',
  gem: '#9fe0ef',
  eye: '#0d1119',
  eyeShine: '#bfe9f4',
  lip: '#8c5f64',
  halo: '#4d6f92',
  groundShadow: '#0b0f16',
};
