/** Canvas RGBA léger (Node + navigateur) pour paper-doll. */

export class PixelCanvas {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }

  clear() {
    this.data.fill(0);
  }

  fillRect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    alpha = 255,
  ) {
    const [r, g, b] = parseColor(color);
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = Math.min(this.width, x0 + Math.max(1, Math.round(w)));
    const y1 = Math.min(this.height, y0 + Math.max(1, Math.round(h)));
    const a = Math.max(0, Math.min(255, Math.round(alpha)));
    for (let py = Math.max(0, y0); py < y1; py += 1) {
      for (let px = Math.max(0, x0); px < x1; px += 1) {
        const i = (py * this.width + px) * 4;
        const sa = a / 255;
        const dr = this.data[i]! / 255;
        const dg = this.data[i + 1]! / 255;
        const db = this.data[i + 2]! / 255;
        const da = this.data[i + 3]! / 255;
        const outA = sa + da * (1 - sa);
        if (outA <= 0) continue;
        this.data[i] = Math.round(((r / 255) * sa + dr * da * (1 - sa)) / outA * 255);
        this.data[i + 1] = Math.round(
          ((g / 255) * sa + dg * da * (1 - sa)) / outA * 255,
        );
        this.data[i + 2] = Math.round(
          ((b / 255) * sa + db * da * (1 - sa)) / outA * 255,
        );
        this.data[i + 3] = Math.round(outA * 255);
      }
    }
  }

  applyOutline(rgb: [number, number, number] = [42, 28, 18]) {
    const solid = new Uint8Array(this.width * this.height);
    for (let i = 0; i < solid.length; i += 1) {
      if (this.data[i * 4 + 3]! > 24) solid[i] = 1;
    }
    const dirs = [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const;
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const i = y * this.width + x;
        if (solid[i]) continue;
        let edge = false;
        for (const [dx, dy] of dirs) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) continue;
          if (solid[ny * this.width + nx]) {
            edge = true;
            break;
          }
        }
        if (!edge) continue;
        const p = i * 4;
        this.data[p] = rgb[0];
        this.data[p + 1] = rgb[1];
        this.data[p + 2] = rgb[2];
        this.data[p + 3] = 255;
      }
    }
  }

  /** Encode PNG (Node : zlib). */
  toPNGBuffer(deflateSync: (buf: Buffer) => Buffer): Buffer {
    const { width, height, data } = this;
    const raw = Buffer.alloc((width * 4 + 1) * height);
    for (let y = 0; y < height; y += 1) {
      const row = y * (width * 4 + 1);
      raw[row] = 0;
      for (let x = 0; x < width; x += 1) {
        const src = (y * width + x) * 4;
        const dst = row + 1 + x * 4;
        raw[dst] = data[src]!;
        raw[dst + 1] = data[src + 1]!;
        raw[dst + 2] = data[src + 2]!;
        raw[dst + 3] = data[src + 3]!;
      }
    }
    const compressed = deflateSync(raw);
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    return Buffer.concat([
      signature,
      pngChunk("IHDR", ihdr),
      pngChunk("IDAT", compressed),
      pngChunk("IEND", Buffer.alloc(0)),
    ]);
  }

  blitToCanvas(ctx: CanvasRenderingContext2D, flipX = false) {
    const copy = new Uint8ClampedArray(this.data);
    const imageData = new ImageData(copy, this.width, this.height);
    if (!flipX) {
      ctx.putImageData(imageData, 0, 0);
      return;
    }
    const tmp = document.createElement("canvas");
    tmp.width = this.width;
    tmp.height = this.height;
    const tctx = tmp.getContext("2d");
    if (!tctx) return;
    tctx.putImageData(imageData, 0, 0);
    ctx.save();
    ctx.translate(this.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  }
}

function parseColor(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    const h = color.slice(1);
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = Number.parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  return [128, 128, 128];
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}
