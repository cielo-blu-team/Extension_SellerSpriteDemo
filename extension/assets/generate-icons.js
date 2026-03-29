/**
 * アイコン生成スクリプト（Node.js + canvas）
 * 実行: node generate-icons.js  （sellersprite/ ルートから実行）
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;
const SIZES = [16, 48, 128];

SIZES.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size;

  // 角丸背景
  const r = Math.round(s * 0.17);
  ctx.fillStyle = '#1A237E';
  roundRect(ctx, 0, 0, s, s, r);
  ctx.fill();

  // レンズ（虫眼鏡）
  const cx = s * 0.44;
  const cy = s * 0.42;
  const radius = s * 0.22;
  const sw = Math.max(1, Math.round(s * 0.07));

  // 外円
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = sw;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // ハンドル
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = Math.max(1, Math.round(s * 0.09));
  ctx.lineCap = 'round';
  ctx.beginPath();
  const hx1 = cx + radius * 0.68;
  const hy1 = cy + radius * 0.68;
  ctx.moveTo(hx1, hy1);
  ctx.lineTo(s * 0.83, s * 0.83);
  ctx.stroke();

  // グラフ棒（右下エリアは小さいサイズでは省略）
  if (size >= 48) {
    const barY = s * 0.76;
    const barH = [s * 0.11, s * 0.17, s * 0.24];
    const barW = Math.max(2, Math.round(s * 0.065));
    const barGap = Math.round(s * 0.09);
    const barBaseX = Math.round(s * 0.13);

    ctx.fillStyle = '#FFD600';
    barH.forEach((h, i) => {
      ctx.fillRect(barBaseX + i * (barW + barGap), barY - h, barW, h);
    });
  }

  const buffer = canvas.toBuffer('image/png');
  const outPath = path.join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`生成: icon-${size}.png (${size}x${size})`);
});

console.log('完了');

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
