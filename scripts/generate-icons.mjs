import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicIconsDir = join(__dirname, '..', 'public', 'icons');

// Ensure icons directory exists
if (!existsSync(publicIconsDir)) {
  mkdirSync(publicIconsDir, { recursive: true });
}

// FIPADOC logo: half square (L-shape) in bottom-right corner on white background
function createFipadocLogoSVG(size) {
  // The logo is a thick L-shape (half square) positioned at bottom-right
  // Proportions: the L takes about 60% of the canvas width/height
  // Line thickness: about 18-20% of the canvas

  const padding = Math.round(size * 0.12); // 12% padding from edges
  const thickness = Math.round(size * 0.18); // 18% line thickness

  // The L shape starts from bottom-right and goes up and left
  const right = size - padding;
  const bottom = size - padding;
  const left = padding;
  const top = padding;

  // L-shape path: starts at bottom-left of the L, goes around
  // This creates an L in the bottom-right corner
  const lWidth = right - left; // full width minus padding
  const lHeight = bottom - top; // full height minus padding

  // Position the L so it's centered but weighted towards bottom-right
  const lLeft = size * 0.25;
  const lTop = size * 0.25;
  const lRight = size - padding;
  const lBottom = size - padding;

  // SVG path for L-shape (half square)
  // Outer L path and inner cutout
  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="white"/>
  <path d="
    M ${lLeft} ${lBottom}
    L ${lLeft} ${lTop}
    L ${lLeft + thickness} ${lTop}
    L ${lLeft + thickness} ${lBottom - thickness}
    L ${lRight - thickness} ${lBottom - thickness}
    L ${lRight - thickness} ${lTop}
    L ${lRight} ${lTop}
    L ${lRight} ${lBottom}
    Z
  " fill="black"/>
</svg>`;

  return svg;
}

// Alternative: Create FIPADOC style logo - the half square bracket shape
function createFipadocBracketSVG(size) {
  const padding = Math.round(size * 0.15);
  const thickness = Math.round(size * 0.15);

  const left = padding;
  const top = padding;
  const right = size - padding;
  const bottom = size - padding;

  // The FIPADOC logo looks like a square bracket [ rotated and positioned
  // It's essentially the bottom-right corner of a square outline
  // Drawing an L-shape in the bottom-right

  const svg = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="white"/>
  <path d="
    M ${left} ${bottom}
    L ${left} ${bottom - thickness}
    L ${right - thickness} ${bottom - thickness}
    L ${right - thickness} ${top}
    L ${right} ${top}
    L ${right} ${bottom}
    Z
  " fill="black"/>
</svg>`;

  return svg;
}

async function generateIcon(size) {
  const svg = createFipadocBracketSVG(size);
  const outputPath = join(publicIconsDir, `icon-${size}x${size}.png`);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${outputPath}`);
}

// Generate PWA icons
await generateIcon(192);
await generateIcon(512);

// Generate favicon (icon.png in app directory for Next.js)
async function generateFavicon(size) {
  const svg = createFipadocBracketSVG(size);
  const outputPath = join(__dirname, '..', 'app', `icon.png`);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`Generated favicon: ${outputPath}`);
}

// Generate Apple touch icon
async function generateAppleIcon(size) {
  const svg = createFipadocBracketSVG(size);
  const outputPath = join(__dirname, '..', 'app', `apple-icon.png`);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`Generated Apple icon: ${outputPath}`);
}

await generateFavicon(32);
await generateAppleIcon(180);

console.log('Done! FIPADOC icons generated.');
