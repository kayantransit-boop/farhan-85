import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./public/logo.svg');

const sizes = [192, 512];

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`./public/icon-${size}.png`);
  console.log(`✅ icon-${size}.png généré`);
}

console.log('✅ Icônes PWA mises à jour');
