import { writeFileSync } from 'node:fs';
import type { Culture } from '@/features/asset-library/cultures/cultureDef';
import type { Piece } from '@/features/asset-library/pieces/pieceDef';
import type { TileDef } from '@/features/asset-library/tiles/tileDef';
import type { WorldSeed } from '@/features/asset-library/worlds/seeds/worldSeed';
import {
  generatedCultures,
  generatedPieces,
  generatedTiles,
  generatedWorldSeeds,
} from '@/features/asset-library/generation/generatedAssets';

export const GENERATED_ASSETS_PATH = 'src/features/asset-library/generation/generatedAssets.ts';

export interface GeneratedAssets {
  tiles: TileDef[];
  pieces: Piece[];
  cultures: Culture[];
  worldSeeds: WorldSeed[];
}

export function readGeneratedAssets(): GeneratedAssets {
  return {
    tiles: [...generatedTiles],
    pieces: [...generatedPieces],
    cultures: [...generatedCultures],
    worldSeeds: [...generatedWorldSeeds],
  };
}

export function writeGeneratedAssets(assets: GeneratedAssets): void {
  writeFileSync(GENERATED_ASSETS_PATH, moduleSourceOf(assets));
}

function moduleSourceOf(assets: GeneratedAssets): string {
  const sections = [
    section('generatedTiles', 'TileDef', 'tilesFromStoredJson', assets.tiles),
    section('generatedPieces', 'Piece', 'piecesFromStoredJson', assets.pieces),
    section('generatedCultures', 'Culture', 'culturesFromStoredJson', assets.cultures),
    section('generatedWorldSeeds', 'WorldSeed', 'sanitizeWorldSeeds', assets.worldSeeds),
  ];
  return [...importsFor(sections), '', ...sections.flatMap((held) => [held.source, ''])].join('\n');
}

interface Section {
  type: string;
  parser: string;
  parsed: boolean;
  source: string;
}

const PARSER_MODULES: Readonly<Record<string, string>> = {
  tilesFromStoredJson: '../tiles/tileStorage',
  piecesFromStoredJson: '../pieces/pieceStorage',
  culturesFromStoredJson: '../cultures/cultureStorage',
  sanitizeWorldSeeds: '../worlds/seeds/worldSeed',
};

const TYPE_MODULES: Readonly<Record<string, string>> = {
  TileDef: '../tiles/tileDef',
  Piece: '../pieces/pieceDef',
  Culture: '../cultures/cultureDef',
  WorldSeed: '../worlds/seeds/worldSeed',
};

function section(name: string, type: string, parser: string, entries: readonly unknown[]): Section {
  const empty = entries.length === 0;
  const call = parser === 'sanitizeWorldSeeds' ? `${parser}(${literalOf(entries)})` : `${parser}(${literalOf(entries)}) ?? []`;
  return {
    type,
    parser,
    parsed: !empty,
    source: `export const ${name}: ${type}[] = ${empty ? '[]' : call};`,
  };
}

function importsFor(sections: readonly Section[]): string[] {
  const parsers = sections
    .filter((held) => held.parsed)
    .map((held) => `import { ${held.parser} } from '${PARSER_MODULES[held.parser]}';`);
  const types = sections.map(
    (held) => `import type { ${held.type} } from '${TYPE_MODULES[held.type]}';`,
  );
  return [...parsers, ...types];
}

function literalOf(entries: readonly unknown[]): string {
  return JSON.stringify(entries, null, 2);
}
