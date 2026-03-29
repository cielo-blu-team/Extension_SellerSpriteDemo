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
  // Content Scripts をバンドル（ES importを解決）
  await esbuild.build({
    entryPoints: [
      path.join(EXT, 'content-scripts/search.js'),
      path.join(EXT, 'content-scripts/asin.js'),
    ],
    bundle: true,
    outdir: DIST,
    format: 'iife',   // content scriptはIIFE形式
    target: 'chrome100',
    sourcemap: false,
    minify: false,
    define: {
      // chrome.runtime.getURL は実行時に解決されるためそのまま
    },
  });

  console.log('✓ content scripts バンドル完了 → extension/dist/');
}

build().catch(err => { console.error(err); process.exit(1); });
