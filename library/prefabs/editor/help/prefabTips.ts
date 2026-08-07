import type { Prefab } from '../../prefabDef';
import type { TooltipContent } from '../../../../frontend/tooltips/tooltipContent';
import type { VoxelTool } from '../usePrefabEditor';

export const PREFAB_NAME_TIP: TooltipContent = {
  title: 'prefab name',
  body: 'How the prefab is listed in the display dropdown of a points node — where prefabs get scattered into the world from.',
};

export const ADD_PREFAB_TIP: TooltipContent = {
  title: 'add prefab',
  body: 'Appends an empty one-layer stamp. Paint its voxels here, or use capture in the world view to lift a section of the map instead.',
};

export const ORBIT_TIP: TooltipContent = {
  title: 'preview',
  body: 'The stamp as it will stand in the world. Drag to orbit around it.',
};

export const EMPTY_VOXEL_TIP: TooltipContent = {
  title: 'empty',
  body: 'Paints holes — cells the stamp leaves untouched, so whatever the world already has there shows through.',
};

export const VOXEL_TOOL_TIPS: Readonly<Record<VoxelTool, TooltipContent>> = {
  paint: { title: 'paint', body: 'Click or drag to set cells on this layer to the selected tile.' },
  erase: { title: 'erase', body: 'Clears cells back to empty, so the world shows through there.' },
  fill: {
    title: 'fill',
    body: 'Flood-fills the connected run of matching cells on this layer from wherever you click.',
  },
  pick: { title: 'pick', body: 'Takes the tile under the cursor as the selected tile.' },
};

export const LAYER_TIPS = {
  lower: { title: 'lower layer', body: 'Steps down one layer. Layer 1 is the ground cell.' },
  higher: { title: 'higher layer', body: 'Steps up one layer, toward the roof of the stamp.' },
  add: { title: 'add a layer', body: 'Stacks a new empty layer on top and selects it.' },
  remove: { title: 'drop the top layer', body: 'Deletes the topmost layer and whatever it holds.' },
} as const satisfies Record<string, TooltipContent>;

export const PREFAB_EDIT_TIPS = {
  undo: { title: 'undo', body: 'Steps back through the voxel edits made in this editor.' },
  rotate: {
    title: 'rotate',
    body: 'Turns the whole stamp 90° clockwise, every layer at once — width and depth swap.',
  },
  copy: { title: 'copy layer', body: 'Puts this layer on the clipboard shared by every prefab.' },
  paste: {
    title: 'paste layer',
    body: 'Overwrites this layer with the copied one, clipped to the current footprint.',
  },
  clear: { title: 'clear layer', body: 'Empties this layer, leaving the others alone.' },
} as const satisfies Record<string, TooltipContent>;

export const SIZE_TIPS = {
  width: { title: 'width', body: 'East–west footprint in cells. Shrinking crops from the far edge.' },
  depth: { title: 'depth', body: 'North–south footprint in cells. Shrinking crops from the far edge.' },
  layers: { title: 'layers', body: 'How tall the stamp stands. Layer 1 sits on the ground.' },
} as const satisfies Record<string, TooltipContent>;

export function editPrefabTip(open: boolean): TooltipContent {
  return {
    title: open ? 'close the voxel editor' : 'edit voxels',
    body: 'Paint the stamp layer by layer, with a 3-D preview of what a scatter will drop into the world.',
  };
}

export function duplicatePrefabTip(prefab: Prefab): TooltipContent {
  return {
    title: `duplicate ${prefab.name}`,
    body: 'Copies the stamp and its voxels into a new entry, leaving this one untouched.',
  };
}

export function deletePrefabTip(prefab: Prefab): TooltipContent {
  return {
    title: `delete ${prefab.name}`,
    body: 'Removes the stamp. Nodes bound to it stop scattering anything.',
  };
}

export function paletteTileTip(name: string): TooltipContent {
  return { title: name, body: 'Paints with this tile on the current layer.' };
}
