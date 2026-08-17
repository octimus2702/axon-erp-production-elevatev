import fs from 'fs';
import zlib from 'zlib';

// Helper to generate a valid 512x512 RGBA PNG image programmatically
function generatePNG(width, height) {
  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // Helper for writing chunks with CRC32
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    
    // CRC32 implementation
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < body.length; i++) {
      crc ^= body[i];
      for (let j = 0; j < 8; j++) {
        if (crc & 1) crc = (crc >>> 1) ^ 0xEDB88320;
        else crc = crc >>> 1;
      }
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, body, crcBuf]);
  }

  // IHDR Chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // Compression
  ihdr.writeUInt8(0, 11); // Filter
  ihdr.writeUInt8(0, 12); // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data: height rows, each row has 1 filter byte + width * 4 bytes (RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const distSq = dx * dx + dy * dy;

      // Dark slate background (#020617)
      let r = 2, g = 6, b = 23, a = 255;

      // Outer glowing ring
      if (distSq <= radius * radius && distSq >= (radius - 16) * (radius - 16)) {
        // Cyan (#06b6d4)
        r = 6; g = 182; b = 212;
      } else if (distSq < (radius - 16) * (radius - 16)) {
        // Inner card gradient background (#0f172a)
        r = 15; g = 23; b = 42;
        
        // Center elevator emblem / shield shape
        if (Math.abs(dx) < 90 && Math.abs(dy) < 130) {
          // #1e293b
          r = 30; g = 41; b = 59;
          if (Math.abs(dx) < 80 && Math.abs(dy) < 120) {
            // Cyan accent border inside emblem
            if (Math.abs(dx) > 70 || Math.abs(dy) > 110) {
              r = 56; g = 189; b = 248; // #38bdf8
            } else {
              // Accent Gold/Cyan indicator dot
              if (dx * dx + dy * dy < 1200) {
                r = 251; g = 191; b = 36; // Amber gold
              }
            }
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Deflate compressed IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pngBuffer = generatePNG(512, 512);

if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public', { recursive: true });
}

fs.writeFileSync('./public/icon.png', pngBuffer);
fs.writeFileSync('./icon.png', pngBuffer);
console.log('Successfully generated 512x512 PWA icons at /public/icon.png and /icon.png');
