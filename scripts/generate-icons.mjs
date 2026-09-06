/**
 * NEXORA icon pipeline — Master Design Document, section 8.
 *
 * "The Electron builder configuration and Capacitor icon resources must use the
 * same source artwork so the brand does not change between platforms."
 *
 * Single source of truth: public/logo.svg. Everything below is derived.
 * Run with: node scripts/generate-icons.mjs
 */
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'public', 'logo.svg'));

/** Render the master mark at a given square size. */
const render = (size) =>
  sharp(source, { density: 384 }).resize(size, size, { fit: 'contain' }).png({ compressionLevel: 9 }).toBuffer();

/**
 * Android masks adaptive icons to a circle, squircle or rounded square and
 * keeps only the inner 80%. The master mark's own rounded corners are
 * transparent, so masking it directly would cut visible notches out of the
 * tile. The maskable variant therefore bleeds a flat obsidian ground to the
 * edges and holds the glyph inside the safe zone.
 */
const SAFE_ZONE = 0.62;

async function renderMaskable(size) {
  const glyph = await sharp(source, { density: 384 })
    .resize(Math.round(size * SAFE_ZONE), Math.round(size * SAFE_ZONE), { fit: 'contain' })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: '#0B111C' },
  })
    .composite([{ input: glyph, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Pack PNG buffers into a Windows .ico. Vista and later read PNG-compressed
 * entries directly, which keeps the file small at 256px.
 */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = [];
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const outputs = [
  // Next.js app-directory file conventions (auto-linked into <head>)
  { path: 'app/icon.svg', kind: 'svg' },
  { path: 'app/apple-icon.png', size: 180 },
  // Public assets referenced by the web manifest and the native wrappers
  { path: 'public/favicon-32.png', size: 32 },
  { path: 'public/apple-touch-icon.png', size: 180 },
  { path: 'public/android-chrome-192.png', size: 192 },
  { path: 'public/android-chrome-512.png', size: 512 },
  { path: 'public/icon-1024.png', size: 1024 }, // Capacitor / store source
  { path: 'electron/icon.png', size: 512 }, // Electron window + Linux
];

await mkdir(join(root, 'electron'), { recursive: true });

for (const out of outputs) {
  const dest = join(root, out.path);
  await mkdir(dirname(dest), { recursive: true });
  if (out.kind === 'svg') {
    await copyFile(join(root, 'public', 'logo.svg'), dest);
  } else {
    await writeFile(dest, await render(out.size));
  }
  console.log(`  ${out.path}${out.size ? `  ${out.size}x${out.size}` : '  vector'}`);
}

// Adaptive launcher icon for Android / installable PWA.
for (const size of [192, 512]) {
  const path = `public/android-chrome-maskable-${size}.png`;
  await writeFile(join(root, path), await renderMaskable(size));
  console.log(`  ${path}  ${size}x${size}  maskable`);
}

/* ---------------------------------------------------------------------------
   Android (Capacitor). Section 8 requires the Capacitor icon resources to come
   from this same master artwork.

   Adaptive icons are 108dp with only the centre 72dp guaranteed visible, so the
   foreground layer holds the glyph at two thirds and the background is a flat
   obsidian colour resource. Legacy square and round icons are rendered from the
   full mark for pre-Android 8 launchers.
   ------------------------------------------------------------------------ */
const ANDROID_DENSITIES = {
  mdpi: 1,
  hdpi: 1.5,
  xhdpi: 2,
  xxhdpi: 3,
  xxxhdpi: 4,
};

const androidRes = join(root, 'android', 'app', 'src', 'main', 'res');

if (existsSync(androidRes)) {
  for (const [density, scale] of Object.entries(ANDROID_DENSITIES)) {
    const dir = join(androidRes, `mipmap-${density}`);
    await mkdir(dir, { recursive: true });

    const legacy = Math.round(48 * scale);
    await writeFile(join(dir, 'ic_launcher.png'), await render(legacy));
    await writeFile(join(dir, 'ic_launcher_round.png'), await render(legacy));

    // Adaptive foreground: 108dp canvas, glyph inside the 72dp safe zone.
    const canvas = Math.round(108 * scale);
    const inner = Math.round(canvas * (72 / 108));
    const glyph = await sharp(source, { density: 384 }).resize(inner, inner, { fit: 'contain' }).png().toBuffer();
    const foreground = await sharp({
      create: { width: canvas, height: canvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: glyph, gravity: 'centre' }])
      .png({ compressionLevel: 9 })
      .toBuffer();
    await writeFile(join(dir, 'ic_launcher_foreground.png'), foreground);
  }

  // Adaptive background colour, matching the maskable web icon ground.
  await writeFile(
    join(androidRes, 'values', 'ic_launcher_background.xml'),
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0B111C</color>\n</resources>\n'
  );

  // Splash screens: obsidian ground with the mark centred, so launching the app
  // does not flash a light screen before the dark shell paints.
  const splashes = [
    ['drawable', 480, 320],
    ['drawable-port-mdpi', 320, 480],
    ['drawable-port-hdpi', 480, 800],
    ['drawable-port-xhdpi', 720, 1280],
    ['drawable-port-xxhdpi', 960, 1600],
    ['drawable-port-xxxhdpi', 1280, 1920],
    ['drawable-land-mdpi', 480, 320],
    ['drawable-land-hdpi', 800, 480],
    ['drawable-land-xhdpi', 1280, 720],
    ['drawable-land-xxhdpi', 1600, 960],
    ['drawable-land-xxxhdpi', 1920, 1280],
  ];

  for (const [dir, width, height] of splashes) {
    const target = join(androidRes, dir);
    if (!existsSync(target)) continue;
    const markSize = Math.round(Math.min(width, height) * 0.22);
    const mark = await render(markSize);
    const splash = await sharp({
      create: { width, height, channels: 4, background: '#080B12' },
    })
      .composite([{ input: mark, gravity: 'centre' }])
      .png({ compressionLevel: 9 })
      .toBuffer();
    await writeFile(join(target, 'splash.png'), splash);
  }

  console.log(`  android/.../mipmap-*  ${Object.keys(ANDROID_DENSITIES).join(', ')}`);
  console.log('  android/.../splash.png  obsidian ground');
}

// Multi-resolution .ico for the browser fallback and Electron packaging.
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const ico = buildIco(await Promise.all(icoSizes.map(async (size) => ({ size, data: await render(size) }))));
await writeFile(join(root, 'app', 'favicon.ico'), ico);
await writeFile(join(root, 'electron', 'icon.ico'), ico);
console.log(`  app/favicon.ico       ${icoSizes.join(', ')}`);
console.log(`  electron/icon.ico     ${icoSizes.join(', ')}`);
console.log('\nIcon set generated from public/logo.svg');
