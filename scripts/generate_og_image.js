#!/usr/bin/env node

/**
 * Open Graph image generator for Knectar
 *
 * Social networks (Facebook, LinkedIn, X) do not render SVG og:image files.
 * This script rasterizes a 1200x630 PNG built from the site logo and wordmark
 * so shared links show a proper preview card.
 *
 * Usage:
 *   node scripts/generate_og_image.js
 *   npm run generate-og-image
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'assets', 'og-image.png');

const WIDTH = 1200;
const HEIGHT = 630;
const BACKGROUND = '#ffffff';   // --color-background
const PRIMARY = '#FF0000';      // --color-primary
const TEXT = '#000000';         // --color-text-primary

// Logo glyph copied from assets/logo.svg (13x16 viewBox), scaled up to sit beside the wordmark.
const LOGO_PATH = 'M0.666668 15.5834V0.416748L12.5833 8.00008L0.666668 15.5834ZM2.83333 11.6292L8.52083 8.00008L2.83333 4.37091V11.6292Z';
const LOGO_SCALE = 15; // 13x16 -> 195x240

function buildSvg() {
  const logoW = 13 * LOGO_SCALE;
  const logoH = 16 * LOGO_SCALE;
  const wordmarkSize = 150;
  const gap = 48;
  // Approximate wordmark width (7 uppercase letters, bold sans) for centering the pair.
  const wordmarkW = Math.round(wordmarkSize * 0.72 * 7);
  const groupW = logoW + gap + wordmarkW;
  const startX = Math.round((WIDTH - groupW) / 2);
  const logoY = Math.round((HEIGHT - logoH) / 2) - 30;
  const textX = startX + logoW + gap;
  const textY = logoY + logoH - 42; // baseline roughly aligned with logo bottom
  const taglineY = logoY + logoH + 70;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BACKGROUND}"/>
  <g transform="translate(${startX} ${logoY}) scale(${LOGO_SCALE})">
    <path d="${LOGO_PATH}" fill="${PRIMARY}"/>
  </g>
  <text x="${textX}" y="${textY}" font-family="Karla, Helvetica, Arial, sans-serif" font-size="${wordmarkSize}" font-weight="700" letter-spacing="6" fill="${TEXT}">KNECTAR</text>
  <text x="${WIDTH / 2}" y="${taglineY}" text-anchor="middle" font-family="Karla, Helvetica, Arial, sans-serif" font-size="40" fill="${TEXT}">Web Development, Design &amp; Product Strategy</text>
  <rect x="0" y="${HEIGHT - 14}" width="${WIDTH}" height="14" fill="${PRIMARY}"/>
</svg>`;
}

async function main() {
  console.log('Generating Open Graph image...');
  const svg = Buffer.from(buildSvg());
  await sharp(svg, { density: 144 })
    .resize(WIDTH, HEIGHT, { fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toFile(OUTPUT);

  const { size } = fs.statSync(OUTPUT);
  const meta = await sharp(OUTPUT).metadata();
  console.log(`Wrote ${path.relative(ROOT, OUTPUT)} (${meta.width}x${meta.height}, ${(size / 1024).toFixed(1)} KB)`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Failed to generate OG image:', err.message);
    process.exit(1);
  });
}

module.exports = { buildSvg };
