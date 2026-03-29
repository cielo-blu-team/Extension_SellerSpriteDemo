/**
 * ビルドスクリプト
 * 実行: node build.js
 * Content Scripts は ES import が使えないため esbuild でバンドル
 * Service Worker は "type": "module" で ES import をそのまま使用
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const EXT = path.join(__dirname, 'extension');
const DIST = path.join(EXT, 'dist');

if (!fs.existsSync(DIST)) fs.mkdirSync(DIST);

async function build() {
  // Content Scripts をバンドル（IIFE形式）
  await esbuild.build({
    entryPoints: [
      path.join(EXT, 'content-scripts/search.js'),
      path.join(EXT, 'content-scripts/asin.js'),
    ],
    bundle: true,
    outdir: DIST,
    format: 'iife',
    target: 'chrome100',
    sourcemap: false,
    minify: false,
  });
  console.log('✓ content scripts バンドル完了');

  // Service Worker をバンドル（IIFE形式 — type:module不要、export文なし）
  await esbuild.build({
    entryPoints: [
      path.join(EXT, 'background/service-worker.js'),
    ],
    bundle: true,
    outfile: path.join(DIST, 'service-worker.js'),
    format: 'iife',
    target: 'chrome100',
    sourcemap: false,
    minify: false,
  });
  console.log('✓ service worker バンドル完了');

  console.log('ビルド完了 → extension/dist/');
}

build().catch(err => { console.error(err); process.exit(1); });
