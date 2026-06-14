#!/usr/bin/env node
/* ============================================================
   LeadScaper Pro — SVG Icon Generator (no dependencies)
   Generates PNG-compatible SVG icons.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const SIZES = [16, 48, 128];
const OUTPUT_DIR = path.join(__dirname, 'icons');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const size of SIZES) {
  const r = Math.round(size / 4);
  const boltScale = size / 16;
  
  // Lightning bolt path scaled to the icon size
  const bolt = `M${9*boltScale},${1.5*boltScale} L${5*boltScale},${8.5*boltScale} L${7.5*boltScale},${8.5*boltScale} L${7*boltScale},${14.5*boltScale} L${11*boltScale},${7.5*boltScale} L${8.5*boltScale},${7.5*boltScale} Z`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#4338ca"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <path d="${bolt}" fill="white"/>
</svg>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, `icon-${size}.svg`), svg);
  console.log(`Created icons/icon-${size}.svg (${size}x${size})`);
}

console.log('\\nSVG icons generated. For Chrome Web Store, convert to PNG:');
console.log('  npx svgexport icons/icon-16.svg icons/icon-16.png 16:16');
console.log('  npx svgexport icons/icon-48.svg icons/icon-48.png 48:48');
console.log('  npx svgexport icons/icon-128.svg icons/icon-128.png 128:128');
