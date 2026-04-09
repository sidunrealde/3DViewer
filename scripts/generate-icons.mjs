import { writeFileSync, mkdirSync, existsSync } from "fs";
import { deflateSync } from "zlib";

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeB, data])), 0);
  return Buffer.concat([len, typeB, data, crcVal]);
}

function createPNG(size, bgR, bgG, bgB) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // color type RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const rowSize = 1 + size * 3;
  const rawData = Buffer.alloc(rowSize * size);

  const pad = size * 0.1; // padding for maskable safe zone

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const px = rowOffset + 1 + x * 3;
      const nx = x / size;
      const ny = y / size;

      // 3D cube/box icon shape
      // Triangle (represents 3D model)
      const inTriangle =
        ny > 0.2 && ny < 0.75 &&
        nx > 0.5 - (ny - 0.2) * 0.5 &&
        nx < 0.5 + (ny - 0.2) * 0.5;

      // Small circle in center
      const cx = nx - 0.5;
      const cy = ny - 0.45;
      const inCircle = Math.sqrt(cx * cx + cy * cy) < 0.08;

      // Rounded rectangle background
      const margin = 0.08;
      const inBounds = nx > margin && nx < 1 - margin && ny > margin && ny < 1 - margin;

      if (inCircle) {
        // Bright violet center
        rawData[px] = 167;
        rawData[px + 1] = 139;
        rawData[px + 2] = 250;
      } else if (inTriangle) {
        // Violet
        rawData[px] = 124;
        rawData[px + 1] = 58;
        rawData[px + 2] = 237;
      } else {
        // Background
        rawData[px] = bgR;
        rawData[px + 1] = bgG;
        rawData[px + 2] = bgB;
      }
    }
  }

  const compressed = deflateSync(rawData);
  return Buffer.concat([
    signature,
    makeChunk("IHDR", ihdrData),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

const iconsDir = "public/icons";
if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });

writeFileSync(`${iconsDir}/icon-192.png`, createPNG(192, 10, 10, 10));
writeFileSync(`${iconsDir}/icon-512.png`, createPNG(512, 10, 10, 10));
writeFileSync(`${iconsDir}/icon-maskable-512.png`, createPNG(512, 24, 24, 27));

console.log("Generated PWA icons in public/icons/");
