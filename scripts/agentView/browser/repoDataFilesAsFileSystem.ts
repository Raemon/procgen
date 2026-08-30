import creatures from '../../../data/creatures.json';
import cultures from '../../../data/cultures.json';
import pieces from '../../../data/pieces.json';
import pipeline from '../../../data/pipeline.json';
import tiles from '../../../data/tiles.json';

const bundledRepoDataFiles: Record<string, unknown> = {
  'data/creatures.json': creatures,
  'data/cultures.json': cultures,
  'data/pieces.json': pieces,
  'data/pipeline.json': pipeline,
  'data/tiles.json': tiles,
};

export function existsSync(path: string): boolean {
  return path in bundledRepoDataFiles;
}

export function readFileSync(path: string): string {
  return JSON.stringify(bundledRepoDataFiles[path]);
}
