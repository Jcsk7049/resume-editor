/**
 * Generates minimal valid PNG icons for PWA without any npm dependencies.
 * Run: node scripts/gen-icons.mjs
 */
import { createWriteStream, mkdirSync } from 'fs';
import { createCanvas } from 'canvas'; // optional — falls back to SVG copy if not available

const sizes = [192, 512];
mkdirSync('public/icons', { recursive: true });

// Try to use canvas module; if unavailable, just log instructions
let canvas;
try {
  canvas = (await import('canvas')).createCanvas;
} catch {
  console.log('canvas module not found — using SVG icon instead (works in Chrome/Edge).');
  console.log('For iOS Safari PNG support, run: npm install canvas && node scripts/gen-icons.mjs');
  process.exit(0);
}

for (const size of sizes) {
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const r = size * 0.215;

  // Background
  ctx.fillStyle = '#1a8917';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.fill();

  // White doc
  const dx = size * 0.234, dy = size * 0.156, dw = size * 0.531, dh = size * 0.688;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(dx, dy, dw, dh, size * 0.039);
  ctx.fill();

  // Lines
  const lx = dx + dw * 0.147, lw = dw * 0.852;
  ctx.fillStyle = '#1a8917';
  ctx.fillRect(lx, dy + dh * 0.21, lw * 0.55, size * 0.035);
  ctx.fillStyle = '#d0ead0';
  [[0.32, 1], [0.4, 0.9], [0.49, 0.95], [0.61, 0.5], [0.69, 1], [0.77, 0.78]].forEach(([yo, wm]) => {
    ctx.fillRect(lx, dy + dh * yo, lw * wm, size * 0.027);
  });

  const buf = c.toBuffer('image/png');
  const out = createWriteStream(`public/icons/icon-${size}.png`);
  out.write(buf);
  out.end();
  console.log(`✓ public/icons/icon-${size}.png`);
}
