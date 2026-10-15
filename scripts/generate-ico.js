import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const SIZES = [16, 32, 48, 64, 128, 256];

function renderIconPNG(size) {
  const png = new PNG({ width: size, height: size });
  const rx = Math.max(2, Math.round(size * 0.125)); // corner radius

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;

      // Rounded rectangle test
      const cornerDx = Math.max(0, Math.max(rx - x, x - (size - rx)));
      const cornerDy = Math.max(0, Math.max(rx - y, y - (size - rx)));
      const isInside = cornerDx * cornerDx + cornerDy * cornerDy <= rx * rx;

      if (!isInside) {
        png.data[idx] = 0;
        png.data[idx + 1] = 0;
        png.data[idx + 2] = 0;
        png.data[idx + 3] = 0;
        continue;
      }

      // Background gradient: dark navy to royal medical blue
      const t = (x + y) / (2 * size);
      const bgR = Math.round(10 * (1 - t) + 30 * t);
      const bgG = Math.round(25 * (1 - t) + 58 * t);
      const bgB = Math.round(47 * (1 - t) + 138 * t);

      // Centered coordinates
      const cx = x - size / 2;
      const cy = y - size / 2;

      // Medical cross dimensions
      const crossThick = Math.max(1, Math.round(size * 0.11));
      const crossLen = Math.max(2, Math.round(size * 0.35));

      const inCrossV = Math.abs(cx) <= crossThick && Math.abs(cy) <= crossLen;
      const inCrossH = Math.abs(cx) <= crossLen && Math.abs(cy) <= crossThick;
      const inCross = inCrossV || inCrossH;

      // Circle ring around cross
      const dist = Math.sqrt(cx * cx + cy * cy);
      const ringRadius = size * 0.28;
      const ringThick = Math.max(1, size * 0.03);
      const inRing = Math.abs(dist - ringRadius) <= ringThick;

      if (inCross) {
        // Bright cyan cross
        png.data[idx] = 56;
        png.data[idx + 1] = 189;
        png.data[idx + 2] = 248;
        png.data[idx + 3] = 255;
      } else if (inRing && size >= 32) {
        // Soft blue ring
        png.data[idx] = 96;
        png.data[idx + 1] = 165;
        png.data[idx + 2] = 250;
        png.data[idx + 3] = 210;
      } else {
        png.data[idx] = bgR;
        png.data[idx + 1] = bgG;
        png.data[idx + 2] = bgB;
        png.data[idx + 3] = 255;
      }
    }
  }

  return PNG.sync.write(png);
}

// Generate multi-resolution ICO file
function createIcoFile(pngBuffers, sizes) {
  const count = sizes.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const totalDirSize = headerSize + dirEntrySize * count;

  let currentOffset = totalDirSize;
  const dirEntries = [];

  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const widthByte = size === 256 ? 0 : size;
    const heightByte = size === 256 ? 0 : size;

    const entry = Buffer.alloc(16);
    entry.writeUInt8(widthByte, 0);       // Width
    entry.writeUInt8(heightByte, 1);      // Height
    entry.writeUInt8(0, 2);               // Color count (0 = >= 8bpp)
    entry.writeUInt8(0, 3);               // Reserved
    entry.writeUInt16LE(1, 4);            // Color planes
    entry.writeUInt16LE(32, 6);           // Bits per pixel
    entry.writeUInt32LE(buf.length, 8);    // Size of image data
    entry.writeUInt32LE(currentOffset, 12); // Offset to image data

    dirEntries.push(entry);
    currentOffset += buf.length;
  }

  // Header: 2 bytes reserved (0), 2 bytes type (1 = ICO), 2 bytes count
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

const resourcesDir = path.join(process.cwd(), 'resources');
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
}

console.log('Rendering icon sizes: 16, 32, 48, 64, 128, 256...');
const pngBuffers = SIZES.map((s) => renderIconPNG(s));
const icoBuffer = createIcoFile(pngBuffers, SIZES);

const icoPath = path.join(resourcesDir, 'icon.ico');
fs.writeFileSync(icoPath, icoBuffer);

console.log(`Successfully generated ${icoPath} (${icoBuffer.length} bytes, 6 resolutions)!`);
