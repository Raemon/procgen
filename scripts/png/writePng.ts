import { deflateSync } from 'node:zlib';

export interface RgbImage {
  width: number;
  height: number;
  pixelAt: (x: number, y: number) => [number, number, number];
}

export function pngBuffer(image: RgbImage): Buffer {
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', headerBytes(image)),
    pngChunk('IDAT', deflateSync(scanlineBytes(image))),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function headerBytes(image: RgbImage): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return header;
}

function scanlineBytes(image: RgbImage): Buffer {
  const rows = Array.from({ length: image.height }, (_, y) => rowBytes(image, y));
  return Buffer.concat(rows);
}

function rowBytes(image: RgbImage, y: number): Buffer {
  const row = Buffer.alloc(1 + image.width * 3);
  for (let x = 0; x < image.width; x++) row.set(image.pixelAt(x, y), 1 + x * 3);
  return row;
}

function pngChunk(type: string, body: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length, 0);
  const typed = Buffer.concat([Buffer.from(type, 'ascii'), body]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed), 0);
  return Buffer.concat([length, typed, crc]);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => crcEntry(index));

function crcEntry(index: number): number {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
