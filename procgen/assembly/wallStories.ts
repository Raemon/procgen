import type { PaintVoxel } from './buildingSpec';
import { FIRST_WALL_LAYER } from './buildingTileFallback';

export interface WallStory {
  baseLayer: number;
  topLayer: number;
  isGroundStory: boolean;
}

export function wallStoriesOf(wallLayers: number, storyLayers: number): WallStory[] {
  const height = Math.max(1, storyLayers);
  const stories: WallStory[] = [];
  for (let base = FIRST_WALL_LAYER; base <= wallLayers; base += height) {
    stories.push({
      baseLayer: base,
      topLayer: Math.min(wallLayers, base + height - 1),
      isGroundStory: base === FIRST_WALL_LAYER,
    });
  }
  return stories;
}

export function paintClippedToStory(paint: PaintVoxel, story: WallStory): PaintVoxel {
  return (worldX, worldY, layer, packed) => {
    if (layer >= story.baseLayer && layer <= story.topLayer) paint(worldX, worldY, layer, packed);
  };
}
