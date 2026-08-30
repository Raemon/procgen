import { generateAssetKit } from '@/features/asset-library/generation/assetKit';
import {
  appendKitToGeneratedAssets,
  libraryTheAppAlreadyHolds,
} from './assetKit/appendKitToGeneratedAssets';
import { GENERATED_ASSETS_PATH } from './assetKit/generatedAssetsModule';
import { generatorOptionsOf } from './assetKit/generatorOptions';
import { printKitSummary } from './assetKit/printKitSummary';

const options = generatorOptionsOf(process.argv.slice(2));
const kit = generateAssetKit(options.seed, libraryTheAppAlreadyHolds());

printKitSummary(kit, options.seed);
if (options.dry) console.log('\ndry run: no code written');
else appendAndReport();

function appendAndReport(): void {
  appendKitToGeneratedAssets(kit);
  console.log(`\nappended ${kit.tiles.length} tiles, ${kit.pieces.length} pieces and 1 culture to ${GENERATED_ASSETS_PATH}`);
}
