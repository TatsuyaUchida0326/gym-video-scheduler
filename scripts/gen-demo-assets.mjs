// デモ版（GitHub Pages）用のサンプル素材を作る。
//   CM 素材 3 枚（1920x1080 JPEG）と、音声付きのサンプル動画 1 本（15 秒 MP4）
// 使い方: node scripts/gen-demo-assets.mjs（ffmpeg が必要）
// 架空の施設名・内容で作る。実在の団体を名乗らないこと
import { createCanvas } from 'canvas';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const OUT_DIR = new URL('../src/demo/assets/', import.meta.url).pathname;
const FONT = '"Hiragino Sans", "Noto Sans CJK JP", sans-serif';
const BRAND = 'SAMPLE FITNESS';

mkdirSync(OUT_DIR, { recursive: true });

function fillGradient(ctx, width, height, from, to) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawCentered(ctx, text, y, size, color, weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, ctx.canvas.width / 2, y);
}

function drawFooter(ctx) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, height - 90, width, 90);
  ctx.font = `bold 34px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(BRAND, 60, height - 32);
  ctx.textAlign = 'right';
  ctx.fillText('※デモ用のサンプル素材です', width - 60, height - 32);
}

const POSTERS = [
  {
    file: 'poster-yoga.jpg',
    colors: ['#0f766e', '#134e4a'],
    lines: [
      ['MORNING YOGA', 250, 64, '#99f6e4'],
      ['朝ヨガ', 470, 220, '#ffffff'],
      ['毎週水曜 7:00〜7:45　スタジオA', 640, 72, '#ffffff'],
      ['初めての方も歓迎。マットは無料で貸し出しています', 780, 44, '#ccfbf1', 'normal'],
    ],
  },
  {
    file: 'poster-campaign.jpg',
    colors: ['#ea580c', '#9a3412'],
    lines: [
      ['AUTUMN CAMPAIGN', 250, 64, '#fed7aa'],
      ['入会金 0円', 470, 200, '#ffffff'],
      ['10月末までの入会で、初月の会費も半額', 640, 72, '#ffffff'],
      ['詳しくはフロントスタッフまで', 780, 44, '#ffedd5', 'normal'],
    ],
  },
  {
    file: 'poster-hydration.jpg',
    colors: ['#1d4ed8', '#1e3a8a'],
    lines: [
      ['STAY HYDRATED', 250, 64, '#bfdbfe'],
      ['こまめに水分補給', 470, 170, '#ffffff'],
      ['運動中は 15〜20分ごとに ひと口を', 640, 72, '#ffffff'],
      ['ウォーターサーバーはストレッチエリアの横にあります', 780, 44, '#dbeafe', 'normal'],
    ],
  },
];

for (const poster of POSTERS) {
  const canvas = createCanvas(1920, 1080);
  const ctx = canvas.getContext('2d');
  fillGradient(ctx, 1920, 1080, ...poster.colors);
  for (const [text, y, size, color, weight] of poster.lines) drawCentered(ctx, text, y, size, color, weight);
  drawFooter(ctx);
  writeFileSync(join(OUT_DIR, poster.file), canvas.toBuffer('image/jpeg', { quality: 0.85 }));
}

// サンプル動画: 15 秒のストレッチ。5 秒ごとに動きが変わり、残り秒数と進み具合を表示する
const VIDEO_SEC = 15;
const FPS = 24;
const STEPS = ['首をゆっくり回しましょう', '肩を大きく回しましょう', '深く息を吸って、吐きましょう'];
const frameDir = mkdtempSync(join(tmpdir(), 'gym-demo-frames-'));

try {
  const canvas = createCanvas(1280, 720);
  const ctx = canvas.getContext('2d');
  for (let frame = 0; frame < VIDEO_SEC * FPS; frame++) {
    const elapsed = frame / FPS;
    const remaining = Math.ceil(VIDEO_SEC - elapsed);
    const step = STEPS[Math.min(STEPS.length - 1, Math.floor(elapsed / (VIDEO_SEC / STEPS.length)))];

    fillGradient(ctx, 1280, 720, '#312e81', '#0f172a');
    drawCentered(ctx, 'STRETCH TIME', 110, 44, '#c7d2fe');
    drawCentered(ctx, step, 250, 64, '#ffffff');
    drawCentered(ctx, String(remaining), 480, 200, '#a5b4fc');

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(140, 560, 1000, 16);
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(140, 560, 1000 * (elapsed / VIDEO_SEC), 16);

    ctx.font = `28px ${FONT}`;
    ctx.fillStyle = '#e0e7ff';
    ctx.textAlign = 'center';
    ctx.fillText(`${BRAND}　※デモ用のサンプル動画です`, 640, 660);

    writeFileSync(join(frameDir, `frame_${String(frame).padStart(4, '0')}.png`), canvas.toBuffer('image/png'));
  }

  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', join(frameDir, 'frame_%04d.png'),
    // 1 秒ごとの短い合図音（再生中であることが音でも分かるように）
    '-f', 'lavfi', '-i', `aevalsrc=0.08*sin(2*PI*660*t)*lt(mod(t\\,1)\\,0.12):s=44100:d=${VIDEO_SEC}`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '28', '-preset', 'slow',
    '-c:a', 'aac', '-b:a', '64k',
    '-movflags', '+faststart', '-shortest',
    join(OUT_DIR, 'sample-stretch.mp4'),
  ]);
} finally {
  rmSync(frameDir, { recursive: true, force: true });
}

console.log(`demo assets written to ${OUT_DIR}`);
