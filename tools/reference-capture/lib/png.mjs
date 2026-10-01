// Minimal PNG codec (no dependencies): 8-bit, non-interlaced, gray / gray+alpha / RGB / RGBA → RGBA.
// Decode is used to measure frame-to-frame difference of Playwright screenshots; encode lets tests build fake frames.
import {deflateSync, inflateSync} from 'node:zlib';

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CRC = (() => {const t = new Uint32Array(256);for (let n = 0; n < 256; n++) {let c = n;for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;t[n] = c >>> 0;}return t;})();
const crc32 = (buf) => {let c = 0xffffffff;for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);return (c ^ 0xffffffff) >>> 0;};
const CHANNELS = {0: 1, 2: 3, 4: 2, 6: 4};

export function decodePng(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(SIG)) throw new Error('not a PNG');
  let pos = 8, width = 0, height = 0, depth = 0, ctype = 0, interlace = 0;const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString('latin1', pos + 4, pos + 8), body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {width = body.readUInt32BE(0);height = body.readUInt32BE(4);depth = body[8];ctype = body[9];interlace = body[12];}
    else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const ch = CHANNELS[ctype];
  if (!ch || depth !== 8 || interlace !== 0) throw new Error(`unsupported PNG (colorType ${ctype}, depth ${depth}, interlace ${interlace})`);
  const raw = inflateSync(Buffer.concat(idat)), stride = width * ch, px = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride, up = dst - stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? px[dst + x - ch] : 0, b = y > 0 ? px[up + x] : 0, c = x >= ch && y > 0 ? px[up + x - ch] : 0;
      let v = raw[src + x];
      if (f === 1) v += a;else if (f === 2) v += b;else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;}
      px[dst + x] = v & 255;
    }
  }
  const data = new Uint8Array(width * height * 4);
  for (let i = 0, n = width * height; i < n; i++) {
    const s = i * ch, d = i * 4;
    if (ch === 4) {data[d] = px[s];data[d + 1] = px[s + 1];data[d + 2] = px[s + 2];data[d + 3] = px[s + 3];}
    else if (ch === 3) {data[d] = px[s];data[d + 1] = px[s + 1];data[d + 2] = px[s + 2];data[d + 3] = 255;}
    else {data[d] = data[d + 1] = data[d + 2] = px[s];data[d + 3] = ch === 2 ? px[s + 1] : 255;}
  }
  return {width, height, data};
}

export function encodePng({width, height, data}) {
  const stride = width * 4, raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) {raw[y * (stride + 1)] = 0;Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);}
  const chunk = (type, body) => {
    const head = Buffer.alloc(8);head.writeUInt32BE(body.length, 0);head.write(type, 4, 'latin1');
    const tail = Buffer.alloc(4);tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
    return Buffer.concat([head, body, tail]);
  };
  const ihdr = Buffer.alloc(13);ihdr.writeUInt32BE(width, 0);ihdr.writeUInt32BE(height, 4);ihdr[8] = 8;ihdr[9] = 6;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
