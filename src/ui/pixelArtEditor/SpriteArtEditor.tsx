import { useMemo } from 'react';
import { TRANSPARENT_INK } from '../../world/tiles/inkColor';
import type { SpriteArt } from '../../world/tiles/spriteArt';
import {
  blankCubeFaceArt,
  faceGridSize,
  type CubeFaceArt,
} from '../../world/tiles/tileFaceArt';
import { PixelArtEditor } from './PixelArtEditor';

export function SpriteArtEditor({
  sprite,
  onChange,
}: {
  sprite: SpriteArt | null;
  onChange(sprite: SpriteArt | null): void;
}) {
  const art = useMemo(() => cubeArtHoldingSprite(sprite), [sprite]);
  return (
    <PixelArtEditor
      art={art}
      baseColor={TRANSPARENT_INK}
      lockedFace="top"
      onChange={(next) => onChange(next ? next.top : null)}
    />
  );
}

function cubeArtHoldingSprite(sprite: SpriteArt | null): CubeFaceArt | null {
  if (!sprite) return null;
  const art = blankCubeFaceArt(faceGridSize(sprite));
  art.top = [...sprite];
  return art;
}
