/**
 * アイコン生成スクリプト（Node.js）
 * 実行: node generate-icons.js
 * 依存: npm install canvas
 *
 * canvas未インストールの場合:
 *   npm install canvas
 *   node generate-icons.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const s = size;

  // 背景（角丸）
  const r = s * 0.17;
  ctx.fillStyle = '#1A237E';
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(s - r, 0);
  ctx.arcTo(s, 0, s, r, r);
  ctx.lineTo(s, s - r);
  ctx.arcTo(s, s, s - r, s, r);
  ctx.lineTo(r, s);
  ctx.arcTo(0, s, 0, s - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
  ctx.fill();

  // レンズ外円
  const cx = s * 0.45, cy = s * 0.42, radius = s * 0.23;
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // ハンドル
  ctx.strokeStyle = '#90CAF9';
  ctx.lineWidth = s * 0.08;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.7, cy + radius * 0.7);
  ctx.lineTo(s * 0.82, s * 0.82);
  ctx.stroke();

  const buffer = canvas.toBuffer('image/png');
  const outPath = path.join(__dirname, `icon-${size}.png`);
  fs.writeFileSync(outPath, buffer);
  console.log(`生成: icon-${size}.png`);
});

console.log('完了');
