import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { classes } from '../controls/classes';
import { FIELD_CLASSES } from '../controls/fieldClasses';
import { bestMatchingGlyph, filteredGlyphGroups } from './glyphFilter';
import { useDismissOnOutsideInteraction } from './useDismissOnOutsideInteraction';
import { symbolPickerPosition, type PopupPosition } from './symbolPickerPosition';
import type { Glyph } from './symbolGlyphs';

const OFFSCREEN: PopupPosition = { left: -9999, top: -9999 };

export function SymbolPickerPopup({
  anchor,
  currentSymbol,
  onPick,
  onClose,
}: {
  anchor: HTMLElement;
  currentSymbol: string;
  onPick(symbol: string): void;
  onClose(): void;
}) {
  const popup = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState<PopupPosition>(OFFSCREEN);
  const groups = filteredGlyphGroups(query);

  useDismissOnOutsideInteraction(popup, anchor, onClose);
  useLayoutEffect(() => {
    if (popup.current)
      setPosition(symbolPickerPosition(anchor.getBoundingClientRect(), popup.current.getBoundingClientRect()));
  }, [anchor]);

  return createPortal(
    <div
      ref={popup}
      style={position}
      className="fixed z-100 flex w-[276px] flex-col rounded-md border border-panel-edge bg-panel p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.55)]"
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
    >
      <input
        autoFocus
        type="text"
        placeholder="filter: star, arrow, box…"
        className={classes(FIELD_CLASSES, 'mb-1.5 w-full')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && pickBestMatch(event, query, onPick)}
      />
      <div className="max-h-[320px] overflow-y-auto">
        {groups.map((group) => (
          <GlyphGroupGrid
            key={group.title}
            title={group.title}
            glyphs={group.glyphs}
            currentSymbol={currentSymbol}
            onPick={onPick}
          />
        ))}
        {groups.length === 0 && (
          <div className="px-0.5 pt-1.5 text-[11px] text-ink-dim">
            no matches — press enter to use what you typed
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function pickBestMatch(
  event: { preventDefault(): void },
  query: string,
  onPick: (symbol: string) => void,
): void {
  event.preventDefault();
  const match = bestMatchingGlyph(query);
  if (match) onPick(match);
}

function GlyphGroupGrid({
  title,
  glyphs,
  currentSymbol,
  onPick,
}: {
  title: string;
  glyphs: Glyph[];
  currentSymbol: string;
  onPick(symbol: string): void;
}) {
  return (
    <div className="mt-2 first:mt-0">
      <div className="mb-[3px] text-[10px] tracking-[0.1em] uppercase text-ink-dim">{title}</div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(24px,1fr))] gap-0.5">
        {glyphs.map((glyph) => (
          <GlyphCell
            key={glyph.char}
            glyph={glyph}
            selected={glyph.char === currentSymbol}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  );
}

function GlyphCell({
  glyph,
  selected,
  onPick,
}: {
  glyph: Glyph;
  selected: boolean;
  onPick(symbol: string): void;
}) {
  return (
    <button
      type="button"
      title={glyph.name}
      className={classes(
        'flex h-6 cursor-pointer items-center justify-center rounded-[3px] border p-0 text-sm hover:bg-btn-hover',
        selected ? 'border-accent text-accent' : 'border-transparent text-ink hover:border-btn-edge',
      )}
      onClick={() => onPick(glyph.char)}
    >
      {glyph.char}
    </button>
  );
}
