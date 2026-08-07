import { useRef, useState } from 'react';
import { classes } from '../controls/classes';
import { FIELD_CLASSES } from '../controls/fieldClasses';
import { tooltipHandlers } from '../tooltips/tooltipHandlers';
import { TILE_SYMBOL_TIP } from './help/tileTips';
import { SymbolPickerPopup } from './SymbolPickerPopup';

export function SymbolInput({
  symbol,
  onPick,
}: {
  symbol: string;
  onPick(symbol: string): void;
}) {
  const anchor = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  function pickAndClose(character: string): void {
    onPick(character);
    setPickerOpen(false);
    anchor.current?.focus();
  }

  return (
    <>
      <input
        ref={anchor}
        type="text"
        maxLength={1}
        aria-label="ascii symbol"
        className={classes(FIELD_CLASSES, 'w-[26px] shrink-0 px-0 text-center')}
        value={symbol}
        onChange={(event) => typedSymbolOf(event.target.value, onPick)}
        onClick={() => setPickerOpen(true)}
        {...tooltipHandlers(TILE_SYMBOL_TIP)}
      />
      {pickerOpen && anchor.current && (
        <SymbolPickerPopup
          anchor={anchor.current}
          currentSymbol={symbol}
          onPick={pickAndClose}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

function typedSymbolOf(value: string, onPick: (symbol: string) => void): void {
  const character = value.slice(0, 1);
  if (character) onPick(character);
}
