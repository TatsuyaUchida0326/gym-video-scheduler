// PWA用アイコンPNGを生成するスクリプト
import { createCanvas } from 'canvas';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size / 512;

  // 背景
  const r = 80 * s;
  ctx.fillStyle = '#1a1a2e';
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
  ctx.closePath();
  ctx.fill();

  // ダンベル左側
  ctx.fillStyle = '#6c63ff';
  roundRect(ctx, 60*s, 220*s, 80*s, 72*s, 16*s);
  ctx.fill();
  // ダンベル右側
  roundRect(ctx, 372*s, 220*s, 80*s, 72*s, 16*s);
  ctx.fill();
  // 左グリップ
  ctx.fillStyle = '#8b83ff';
  roundRect(ctx, 100*s, 236*s, 48*s, 40*s, 10*s);
  ctx.fill();
  // 右グリップ
  roundRect(ctx, 364*s, 236*s, 48*s, 40*s, 10*s);
  ctx.fill();
  // バー
  ctx.fillStyle = '#6c63ff';
  roundRect(ctx, 148*s, 248*s, 216*s, 16*s, 8*s);
  ctx.fill();

  // 再生ボタン（円）
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 6 * s;
  ctx.beginPath();
  ctx.arc(256*s, 256*s, 72*s, 0, Math.PI * 2);
  ctx.stroke();

  // 再生ボタン（三角）
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.moveTo(240*s, 232*s);
  ctx.lineTo(240*s, 280*s);
  ctx.lineTo(282*s, 256*s);
  ctx.closePath();
  ctx.fill();

  return canvas.toBuffer('image/png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

mkdirSync(join(publicDir, 'icons'), { recursive: true });

for (const size of [192, 512]) {
  const buf = drawIcon(size);
  writeFileSync(join(publicDir, `icons/icon-${size}.png`), buf);
  console.log(`✓ icon-${size}.png`);
}
