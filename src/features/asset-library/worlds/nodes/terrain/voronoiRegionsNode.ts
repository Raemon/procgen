import { registerNodeType } from '../../nodeRegistry';
import type { ChunkGenCtx } from '../../nodeType';
import { fieldValue, type ChunkValue } from '../../values/chunkValues';
import { plateContactAt, platesOverlapping, type PlateContact } from './plateLattice';

const OUTPUT_SITE_HASH = 0;
const OUTPUT_BOUNDARY_DISTANCE = 1;
const OUTPUT_SITE_DISTANCE = 2;

const OUTPUT_CHOICES = [
  {
    value: OUTPUT_SITE_HASH,
    label: 'region id',
    help: 'One steady value in 0..1 per region, the same in every cell of it. Multiply another field by this and every region gets its own strength — districts, provinces, grains of rock.',
  },
  {
    value: OUTPUT_BOUNDARY_DISTANCE,
    label: 'boundary distance',
    help: 'How far the cell is from the seam between its region and its nearest neighbour, 0 on the seam and 1 half a pitch in. The field to threshold for walls, streets, or cracks.',
  },
  {
    value: OUTPUT_SITE_DISTANCE,
    label: 'site distance',
    help: 'How far the cell is from the centre of its own region, 0 at the centre and 1 half a pitch out. Domes, craters, and anything that fades from the middle of a region outward.',
  },
] as const;

registerNodeType({
  type: 'voronoiRegions',
  title: 'voronoi regions',
  category: 'terrain',
  description:
    'Scatters one site per lattice cell and hands each cell of the world to its nearest site, giving a mosaic of irregular regions. It can report which region a cell belongs to, how far it sits from the seam with the next region, or how far it sits from its own centre.',
  whenToUse:
    'Whenever the world should be made of patches rather than gradients: city districts of differing density, basalt columns, cracked playa, farm fields, provinces that each roll their own weather. Region id is the one that matters — multiply a noise or a knob-driven constant by it and every patch comes out different while staying uniform inside itself. It is the same lattice tectonic uplift builds its plates on, without the elevation.',
  inputs: {},
  params: {
    pitch: {
      kind: 'int',
      label: 'pitch',
      help: 'Rough width of one region in tiles.',
      min: 8,
      max: 4096,
      default: 128,
    },
    jitter: {
      kind: 'number',
      label: 'jitter',
      help: 'How far each site may wander inside its lattice cell. 0 gives a plain grid of squares, 1 gives fully irregular patches.',
      min: 0,
      max: 1,
      step: 0.05,
      default: 1,
    },
    output: {
      kind: 'choice',
      label: 'output',
      help: 'Which reading of the mosaic to write into the field.',
      options: OUTPUT_CHOICES,
      default: OUTPUT_SITE_HASH,
    },
  },
  output: 'field',
  outputSemantic: (params) => (params.output === OUTPUT_SITE_HASH ? 'raw' : 'distance'),
  generateChunk: voronoiRegionsChunk,
});

function voronoiRegionsChunk(ctx: ChunkGenCtx): ChunkValue {
  const field = ctx.newField();
  const pitch = Math.max(8, Math.round(ctx.params.pitch as number));
  const sites = platesOverlapping(
    ctx.originX,
    ctx.originY,
    ctx.originX + ctx.size - 1,
    ctx.originY + ctx.size - 1,
    { plateSize: pitch, oceanFraction: 0, seed: ctx.hashSeed('regions'), jitter: ctx.params.jitter as number },
  );
  const output = ctx.params.output as number;
  for (let y = 0; y < ctx.size; y++) {
    const worldY = ctx.originY + y;
    for (let x = 0; x < ctx.size; x++) {
      const contact = plateContactAt(sites, ctx.originX + x, worldY);
      field[y * ctx.size + x] = readingOf(contact, output, pitch);
    }
  }
  return fieldValue(field);
}

function readingOf(contact: PlateContact, output: number, pitch: number): number {
  if (output === OUTPUT_SITE_HASH) return contact.plate.hash;
  const distance = output === OUTPUT_SITE_DISTANCE ? contact.siteDistance : contact.boundaryDistance;
  return Math.min(1, distance / (pitch / 2));
}
