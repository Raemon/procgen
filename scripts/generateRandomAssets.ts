import { generateAssetKit } from '@/features/asset-library/generation/assetKit';
import { appendKitToTheLibrary, generatorViewOf } from './assetKit/appendKitToTheLibrary';
import { withTheAssetLibrary } from './assetKit/assetLibraryInTheDatabase';
import { generatorOptionsOf } from './assetKit/generatorOptions';
import { printKitSummary } from './assetKit/printKitSummary';

const options = generatorOptionsOf(process.argv.slice(2));

await withTheAssetLibrary((library) => {
  const kit = generateAssetKit(options.seed, generatorViewOf(library));
  printKitSummary(kit, options.seed);
  if (options.dry) {
    console.log('\ndry run: the library is left as it stands');
    return false;
  }
  appendKitToTheLibrary(kit, library);
  console.log(`\nadded ${kit.tiles.length} tiles, ${kit.pieces.length} pieces and 1 culture to the asset library`);
  return true;
});
