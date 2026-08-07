import { useEffect, useRef } from 'react';
import { paintSpritePixels } from '../../views/paintSpritePixels';
import { spriteGridSize, type SpriteArt } from '../../world/tiles/spriteArt';
import { Button } from '../controls/Button';
import { classes } from '../controls/classes';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import { ADD_FRAME_TIP, dropFrameTip, frameTip } from './help/spriteTips';

export function SpriteFrameStrip({
  frames,
  selected,
  onSelect,
  onAdd,
  onRemove,
}: {
  frames: readonly SpriteArt[];
  selected: number;
  onSelect(index: number): void;
  onAdd(): void;
  onRemove(index: number): void;
}) {
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-1">
      {frames.map((frame, index) => (
        <FrameThumb
          key={index}
          frame={frame}
          index={index}
          isSelected={index === selected}
          onSelect={() => onSelect(index)}
          onRemove={() => onRemove(index)}
        />
      ))}
      <Button className="px-2 py-0.5 text-[11px]" tip={ADD_FRAME_TIP} onClick={onAdd}>
        + frame
      </Button>
    </div>
  );
}

function FrameThumb({
  frame,
  index,
  isSelected,
  onSelect,
  onRemove,
}: {
  frame: SpriteArt;
  index: number;
  isSelected: boolean;
  onSelect(): void;
  onRemove(): void;
}) {
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={`frame ${index}`}
        onClick={onSelect}
        {...tooltipHandlers(frameTip(index))}
        className={classes(
          'h-8 w-8 rounded-[2px] border bg-black/40',
          isSelected ? 'border-accent' : 'border-panel-edge',
        )}
      >
        <SpriteThumb sprite={frame} />
      </button>
      <button
        type="button"
        aria-label={`drop frame ${index}`}
        onClick={onRemove}
        {...tooltipHandlers(dropFrameTip(index))}
        className="absolute -right-1 -top-1 rounded-full bg-field px-1 text-[9px] leading-none text-ink-dim hover:text-danger-ink"
      >
        ×
      </button>
    </span>
  );
}

function SpriteThumb({ sprite }: { sprite: SpriteArt }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current) return;
    canvas.current.width = canvas.current.height = spriteGridSize(sprite);
    paintSpritePixels(canvas.current.getContext('2d')!, sprite, 1);
  }, [sprite]);
  return <canvas ref={canvas} className="block h-full w-full [image-rendering:pixelated]" />;
}
