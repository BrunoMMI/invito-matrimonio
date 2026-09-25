import sharp from 'sharp';
import fs from 'node:fs';

const OUT = 'assets/img';
fs.mkdirSync(OUT, { recursive: true });

const webp = { quality: 80 };

// Location photos
await sharp('foto chiesa e foto ristorante castello di faicchio/1_Home_Castello.jpg')
  .resize({ width: 1600, withoutEnlargement: true }).webp(webp).toFile(`${OUT}/castello-1.webp`);

await sharp('foto chiesa e foto ristorante castello di faicchio/Chiesa Ave Gratia Pleana.jpg')
  .resize({ width: 1000, withoutEnlargement: true }).webp(webp).toFile(`${OUT}/chiesa-1.webp`);

// Illustrazione Orso e Volpe: ritaglio dal biglietto fotografato (invito cartaceo)
// Il biglietto e' leggermente inclinato: si raddrizza e si ritaglia all'interno del dipinto.
const src = 'invito cartaceo/WhatsApp Image 2026-09-22 at 10.42.10.jpeg';
const cropBox = JSON.parse(process.env.CROP || '{"left":190,"top":970,"width":520,"height":420}');
await sharp(src).extract(cropBox).resize({ width: 1000 }).webp({ quality: 85 }).toFile(`${OUT}/orso-volpe.webp`);

console.log('ok');
