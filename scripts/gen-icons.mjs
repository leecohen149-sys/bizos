/**
 * Generates simple solid-brand placeholder PNG icons for the PWA manifest.
 * Replace with real artwork later. Run: node scripts/gen-icons.mjs
 */
import { deflateSync } from "node:zlib"
import { writeFileSync, mkdirSync } from "node:fs"
import { resolve } from "node:path"

// Brand indigo (≈ oklch(0.52 0.21 272))
const COLOR = [91, 83, 214, 255]

function crc32(buf) {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii")
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function makePng(size, [r, g, b, a]) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  // rows: filter byte (0) + size*4 pixels
  const row = Buffer.alloc(1 + size * 4)
  for (let x = 0; x < size; x++) {
    row[1 + x * 4] = r
    row[1 + x * 4 + 1] = g
    row[1 + x * 4 + 2] = b
    row[1 + x * 4 + 3] = a
  }
  const raw = Buffer.concat(Array.from({ length: size }, () => row))
  const idat = deflateSync(raw)
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

const outDir = resolve(process.cwd(), "public/icons")
mkdirSync(outDir, { recursive: true })

const targets = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["maskable-512.png", 512],
  ["apple-touch-icon.png", 180],
]
for (const [name, size] of targets) {
  writeFileSync(resolve(outDir, name), makePng(size, COLOR))
  console.log(`✓ ${name} (${size}×${size})`)
}
