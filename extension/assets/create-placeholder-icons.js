/**
 * canvasなしで最小限のPNGプレースホルダーを生成
 * 実行: node create-placeholder-icons.js
 */

const fs = require('fs');

// 最小限の1x1 PNG (透過) をベースに指定サイズの単色PNGを生成
function createSolidPng(width, height, r, g, b) {
  // PNGヘッダー + IHDR + IDAT + IEND を手動構築
  function crc32(buf) {
    const table = (() => {
      const t = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[i] = c;
      }
      return t;
    })();
    let crc = 0xFFFFFFFF;
    for (const byte of buf) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crcInput = Buffer.concat([typeBytes, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(crcInput));
    return Buffer.concat([len, typeBytes, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // IDAT（各行: filter byte + RGB×width）
  // zlib deflate (非圧縮ブロック)
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const base = y * rowSize;
    rawData[base] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      rawData[base + 1 + x * 3] = r;
      rawData[base + 2 + x * 3] = g;
      rawData[base + 3 + x * 3] = b;
    }
  }

  // zlib header + deflate non-compressed
  function adler32(data) {
    let s1 = 1, s2 = 0;
    for (const b of data) { s1 = (s1 + b) % 65521; s2 = (s2 + s1) % 65521; }
    return (s2 << 16) | s1;
  }

  const blocks = [];
  let offset = 0;
  while (offset < rawData.length) {
    const blockSize = Math.min(65535, rawData.length - offset);
    const last = offset + blockSize >= rawData.length ? 1 : 0;
    const blockHeader = Buffer.alloc(5);
    blockHeader[0] = last;
    blockHeader.writeUInt16LE(blockSize, 1);
    blockHeader.writeUInt16LE(~blockSize & 0xFFFF, 3);
    blocks.push(blockHeader);
    blocks.push(rawData.slice(offset, offset + blockSize));
    offset += blockSize;
  }

  const adler = adler32(rawData);
  const adlerBuf = Buffer.alloc(4);
  adlerBuf.writeUInt32BE(adler);

  const idat = Buffer.concat([Buffer.from([0x78, 0x01]), ...blocks, adlerBuf]);

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const sizes = [16, 48, 128];
sizes.forEach(size => {
  // ネイビーブルー #1A237E = rgb(26, 35, 126)
  const buf = createSolidPng(size, size, 26, 35, 126);
  fs.writeFileSync(`${__dirname}/icon-${size}.png`, buf);
  console.log(`生成: icon-${size}.png (${size}x${size})`);
});
console.log('完了（単色プレースホルダー）');
