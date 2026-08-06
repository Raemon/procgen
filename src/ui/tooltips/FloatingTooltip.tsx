import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { floatingTipPosition, type TipPosition } from './floatingTipPosition';
import { TooltipBody } from './TooltipBody';
import { activeTooltip, hideTooltip, subscribeToTooltip } from './tooltipState';

const OFFSCREEN: TipPosition = { left: -9999, top: -9999 };

export function FloatingTooltip() {
  const active = useSyncExternalStore(subscribeToTooltip, activeTooltip);
  const tip = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<TipPosition>(OFFSCREEN);

  useHideOnScroll();
  useLayoutEffect(() => {
    if (active && tip.current)
      setPosition(floatingTipPosition(tip.current.getBoundingClientRect(), active.anchor));
  }, [active]);

  if (!active) return null;
  return (
    <div
      ref={tip}
      role="tooltip"
      style={position}
      className="pointer-events-none fixed z-50 max-w-[300px] rounded-md border border-btn-edge bg-tip px-[11px] py-[9px] text-[11px] leading-relaxed text-ink shadow-[0_6px_20px_rgba(0,0,0,0.5)]"
    >
      <TooltipBody content={active.content} />
    </div>
  );
}

function useHideOnScroll(): void {
  useEffect(() => {
    window.addEventListener('scroll', hideTooltip, true);
    return () => window.removeEventListener('scroll', hideTooltip, true);
  }, []);
}
