// Generates solid-color placeholder PNG icons for the extension.
// Usage: node scripts/generate-icons.js
//
// Creates icons/icon16.png, icon48.png, icon128.png.

const zlib = require("node:zlib");
const fs = require("node:fs");

const ICON_COLOR = [0x1a, 0x56, 0xdb]; // blue #1a56db

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function createPNG(width, height, r, g, b) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const off = y * (1 + width * 3);
    raw[off] = 0; // filter byte: None
    for (let x = 0; x < width; x++) {
      const p = off + 1 + x * 3;
      raw[p] = r;
      raw[p + 1] = g;
      raw[p + 2] = b;
    }
  }

  const compressed = zlib.deflateSync(raw);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  // bytes 10-12 are 0 (compression, filter, interlace)

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdrData),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const [r, g, b] = ICON_COLOR;

fs.writeFileSync("icons/icon16.png", createPNG(16, 16, r, g, b));
fs.writeFileSync("icons/icon48.png", createPNG(48, 48, r, g, b));
fs.writeFileSync("icons/icon128.png", createPNG(128, 128, r, g, b));

console.log("icons/icon16.png, icon48.png, icon128.png generated.");
