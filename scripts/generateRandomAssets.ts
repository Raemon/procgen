import { generateAssetKit } from '../assets/generation/assetKit';
import { appendKitToDataFiles } from './assetKit/appendKitToDataFiles';
import {
  CULTURES_PATH,
  PIECES_PATH,
  TILES_PATH,
  libraryOfDataFiles,
  readAssetDataFiles,
} from './assetKit/assetDataFiles';
import { generatorOptionsOf } from './assetKit/generatorOptions';
import { printKitSummary } from './assetKit/printKitSummary';

const options = generatorOptionsOf(process.argv.slice(2));
const files = readAssetDataFiles();
const kit = generateAssetKit(options.seed, libraryOfDataFiles(files));

printKitSummary(kit, options.seed);
if (options.dry) console.log('\ndry run: data files left untouched');
else appendAndReport();

function appendAndReport(): void {
  appendKitToDataFiles(kit, files);
  console.log(`\nappended to ${TILES_PATH}, ${PIECES_PATH}, ${CULTURES_PATH}`);
}
