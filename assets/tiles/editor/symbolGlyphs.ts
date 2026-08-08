export interface Glyph {
  char: string;
  name: string;
}

export interface GlyphGroup {
  title: string;
  glyphs: Glyph[];
}

function named(pairs: [string, string][]): Glyph[] {
  return pairs.map(([char, name]) => ({ char, name }));
}

function charRange(first: string, last: string, describe: (char: string) => string): Glyph[] {
  const glyphs: Glyph[] = [];
  for (let code = first.charCodeAt(0); code <= last.charCodeAt(0); code++) {
    const char = String.fromCharCode(code);
    glyphs.push({ char, name: describe(char) });
  }
  return glyphs;
}

const asciiSymbols = named([
  [' ', 'space blank'],
  ['!', 'exclamation bang'],
  ['"', 'double quote'],
  ['#', 'hash number pound'],
  ['$', 'dollar'],
  ['%', 'percent'],
  ['&', 'ampersand and'],
  ["'", 'apostrophe single quote'],
  ['(', 'open paren'],
  [')', 'close paren'],
  ['*', 'asterisk star'],
  ['+', 'plus'],
  [',', 'comma'],
  ['-', 'hyphen minus dash'],
  ['.', 'period dot'],
  ['/', 'forward slash'],
  [':', 'colon'],
  [';', 'semicolon'],
  ['<', 'less than angle'],
  ['=', 'equals'],
  ['>', 'greater than angle'],
  ['?', 'question mark'],
  ['@', 'at sign'],
  ['[', 'open square bracket'],
  ['\\', 'backslash'],
  [']', 'close square bracket'],
  ['^', 'caret circumflex'],
  ['_', 'underscore'],
  ['`', 'backtick grave'],
  ['{', 'open curly brace'],
  ['|', 'pipe vertical bar'],
  ['}', 'close curly brace'],
  ['~', 'tilde'],
]);

const boxDrawing = named([
  ['─', 'line horizontal'],
  ['│', 'line vertical'],
  ['┌', 'corner top left'],
  ['┐', 'corner top right'],
  ['└', 'corner bottom left'],
  ['┘', 'corner bottom right'],
  ['├', 'tee right'],
  ['┤', 'tee left'],
  ['┬', 'tee down'],
  ['┴', 'tee up'],
  ['┼', 'cross junction'],
  ['═', 'double line horizontal'],
  ['║', 'double line vertical'],
  ['╔', 'double corner top left'],
  ['╗', 'double corner top right'],
  ['╚', 'double corner bottom left'],
  ['╝', 'double corner bottom right'],
  ['╠', 'double tee right'],
  ['╣', 'double tee left'],
  ['╦', 'double tee down'],
  ['╩', 'double tee up'],
  ['╬', 'double cross junction'],
]);

const blocksAndShades = named([
  ['░', 'light shade'],
  ['▒', 'medium shade'],
  ['▓', 'dark shade'],
  ['█', 'full block'],
  ['▀', 'upper half block'],
  ['▄', 'lower half block'],
  ['▌', 'left half block'],
  ['▐', 'right half block'],
  ['■', 'black square filled'],
  ['□', 'white square outline'],
  ['▪', 'small black square'],
  ['▫', 'small white square'],
]);

const shapes = named([
  ['●', 'circle filled'],
  ['○', 'circle outline'],
  ['◎', 'circle bullseye'],
  ['•', 'bullet dot'],
  ['◆', 'diamond filled'],
  ['◇', 'diamond outline'],
  ['▲', 'triangle up filled'],
  ['△', 'triangle up outline'],
  ['▼', 'triangle down filled'],
  ['▽', 'triangle down outline'],
  ['◀', 'triangle left filled'],
  ['▶', 'triangle right filled'],
  ['★', 'star filled'],
  ['☆', 'star outline'],
]);

const arrows = named([
  ['←', 'arrow left'],
  ['↑', 'arrow up'],
  ['→', 'arrow right'],
  ['↓', 'arrow down'],
  ['↔', 'arrow left right'],
  ['↕', 'arrow up down'],
  ['↖', 'arrow up left'],
  ['↗', 'arrow up right'],
  ['↘', 'arrow down right'],
  ['↙', 'arrow down left'],
  ['⇐', 'double arrow left'],
  ['⇑', 'double arrow up'],
  ['⇒', 'double arrow right'],
  ['⇓', 'double arrow down'],
]);

const greek = named([
  ['α', 'alpha'],
  ['β', 'beta'],
  ['γ', 'gamma'],
  ['δ', 'delta'],
  ['ε', 'epsilon'],
  ['θ', 'theta'],
  ['λ', 'lambda'],
  ['μ', 'mu'],
  ['π', 'pi'],
  ['σ', 'sigma'],
  ['τ', 'tau'],
  ['φ', 'phi'],
  ['ψ', 'psi'],
  ['ω', 'omega'],
  ['Δ', 'delta capital'],
  ['Σ', 'sigma capital'],
  ['Φ', 'phi capital'],
  ['Ψ', 'psi capital'],
  ['Ω', 'omega capital'],
]);

const mathAndCurrency = named([
  ['±', 'plus minus'],
  ['×', 'multiply times'],
  ['÷', 'divide'],
  ['≈', 'approximately'],
  ['≠', 'not equal'],
  ['≤', 'less or equal'],
  ['≥', 'greater or equal'],
  ['∞', 'infinity'],
  ['·', 'middle dot'],
  ['°', 'degree'],
  ['§', 'section'],
  ['¶', 'pilcrow paragraph'],
  ['†', 'dagger'],
  ['‡', 'double dagger'],
  ['¢', 'cent'],
  ['£', 'pound sterling'],
  ['¥', 'yen'],
  ['€', 'euro'],
  ['¤', 'currency'],
  ['µ', 'micro'],
  ['¿', 'inverted question'],
  ['¡', 'inverted exclamation'],
]);

const gameAndNature = named([
  ['☀', 'sun'],
  ['☼', 'sun rays'],
  ['☁', 'cloud'],
  ['☂', 'umbrella rain'],
  ['☃', 'snowman'],
  ['❄', 'snowflake'],
  ['✿', 'flower'],
  ['♠', 'spade suit'],
  ['♣', 'club suit'],
  ['♥', 'heart suit'],
  ['♦', 'diamond suit'],
  ['♪', 'music note'],
  ['♫', 'music notes'],
  ['☺', 'smiley face outline'],
  ['☻', 'smiley face filled'],
  ['⌂', 'house'],
  ['⚑', 'flag filled'],
  ['⚐', 'flag outline'],
  ['✓', 'check mark'],
  ['✗', 'cross x mark'],
  ['♀', 'female venus'],
  ['♂', 'male mars'],
]);

export const GLYPH_GROUPS: GlyphGroup[] = [
  { title: 'ascii symbols', glyphs: asciiSymbols },
  { title: 'ascii digits', glyphs: charRange('0', '9', (char) => `digit ${char}`) },
  { title: 'ascii uppercase', glyphs: charRange('A', 'Z', (char) => `letter ${char.toLowerCase()}`) },
  { title: 'ascii lowercase', glyphs: charRange('a', 'z', (char) => `letter ${char}`) },
  { title: 'box drawing', glyphs: boxDrawing },
  { title: 'blocks & shades', glyphs: blocksAndShades },
  { title: 'shapes', glyphs: shapes },
  { title: 'arrows', glyphs: arrows },
  { title: 'greek', glyphs: greek },
  { title: 'math & currency', glyphs: mathAndCurrency },
  { title: 'game & nature', glyphs: gameAndNature },
];
