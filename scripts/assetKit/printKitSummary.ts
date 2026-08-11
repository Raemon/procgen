import type { AssetKit } from '@/features/asset-library/generation/assetKit';
import { GABLE_ROOF } from '@/features/asset-library/cultures/cultureDef';

export function printKitSummary(kit: AssetKit, seed: number): void {
  console.log(`\n== culture kit "${kit.name}" from seed ${seed} ==`);
  printPalette(kit);
  printTiles(kit);
  printPieces(kit);
  printCulture(kit);
}

function printPalette(kit: AssetKit): void {
  console.log('\n-- materials --');
  for (const [role, material] of Object.entries(kit.palette.materials)) {
    console.log(`  ${role}: ${material}`);
  }
}

function printTiles(kit: AssetKit): void {
  console.log(`\n-- ${kit.tiles.length} tiles --`);
  for (const tile of kit.tiles) {
    console.log(`  ${tile.id} ${tile.symbol} ${tile.name} (${tile.shape}, ${tile.color})`);
  }
}

function printPieces(kit: AssetKit): void {
  console.log(`\n-- ${kit.pieces.length} pieces --`);
  for (const piece of kit.pieces) {
    console.log(`  ${piece.id} ${piece.name} (${piece.role}, ${piece.layers} layers)`);
  }
}

function printCulture(kit: AssetKit): void {
  const culture = kit.culture;
  const roof = culture.roofStyle === GABLE_ROOF ? 'gable' : 'hip';
  console.log('\n-- culture --');
  console.log(`  id ${culture.id} ${culture.name}`);
  console.log(`  roof ${roof}, storyLayers ${culture.storyLayers}, windowEvery ${culture.windowEvery}`);
}
