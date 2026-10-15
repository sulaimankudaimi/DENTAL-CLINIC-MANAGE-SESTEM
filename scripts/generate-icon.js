import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

const width = 256;
const height = 256;
const png = new PNG({ width, height });

// Create an aesthetic dental tooth + medical cross icon
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const idx = (width * y + x) << 2;

    // Rounded rectangle background
    const rx = 32;
    const cornerDx = Math.max(0, Math.max(rx - x, x - (width - rx)));
    const cornerDy = Math.max(0, Math.max(rx - y, y - (height - rx)));
    const isInsideCorner = cornerDx * cornerDx + cornerDy * cornerDy <= rx * rx;

    if (!isInsideCorner) {
      // transparent outside
      png.data[idx] = 0;
      png.data[idx + 1] = 0;
      png.data[idx + 2] = 0;
      png.data[idx + 3] = 0;
      continue;
    }

    // Gradient background: #0A192F to #1E3A8A
    const t = (x + y) / (width + height);
    const bgR = Math.round(10 * (1 - t) + 30 * t);
    const bgG = Math.round(25 * (1 - t) + 58 * t);
    const bgB = Math.round(47 * (1 - t) + 138 * t);

    // Centered Tooth silhouette geometry
    const cx = x - 128;
    const cy = y - 128;

    // Medical Cross in center
    const inCrossV = Math.abs(cx) <= 14 && Math.abs(cy) <= 44;
    const inCrossH = Math.abs(cx) <= 44 && Math.abs(cy) <= 14;
    const inCross = inCrossV || inCrossH;

    // Glowing border circle around cross
    const distFromCenter = Math.sqrt(cx * cx + cy * cy);
    const inRing = distFromCenter >= 64 && distFromCenter <= 72;

    if (inCross) {
      // Crisp Cyan/White medical cross
      png.data[idx] = 56;
      png.data[idx + 1] = 189;
      png.data[idx + 2] = 248;
      png.data[idx + 3] = 255;
    } else if (inRing) {
      // Cyan Ring
      png.data[idx] = 96;
      png.data[idx + 1] = 165;
      png.data[idx + 2] = 250;
      png.data[idx + 3] = 200;
    } else {
      // Background gradient
      png.data[idx] = bgR;
      png.data[idx + 1] = bgG;
      png.data[idx + 2] = bgB;
      png.data[idx + 3] = 255;
    }
  }
}

const buffer = PNG.sync.write(png);

// Save to public and electron directories
fs.mkdirSync(path.join(process.cwd(), 'electron', 'assets'), { recursive: true });
fs.mkdirSync(path.join(process.cwd(), 'public'), { recursive: true });

fs.writeFileSync(path.join(process.cwd(), 'public', 'icon.png'), buffer);
fs.writeFileSync(path.join(process.cwd(), 'electron', 'assets', 'icon.png'), buffer);

console.log('Successfully generated icon.png in public/ and electron/assets/');
