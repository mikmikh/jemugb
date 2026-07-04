import { parseByte } from "./bit_utils.js";

// VRAM Tile Data
// block0 (0x8000-0x87FF) 0-127 (mode 1)
// block1 (0x8800-0x8FFF) 128-255
// block2 (0x9000-0x97FF) 0-127  (mode 0)
// 256x256 pixel BG

// LCDC.4 (bg_window_tyle_data_area)
export function readTileData(memory, lcdc4 = 0) {
  const blockStarts = lcdc4 ? [0x8000, 0x8800] : [0x9000, 0x8800];
  const res = [];
  for (const blockStart of blockStarts) {
    for (let i = 0; i < 128; i++) {
      const tile = readTile(i, memory, blockStart);
      res.push(tile);
    }
  }
  return res;
}
// TILE MAP
// 1st tile set 0x8000-0x8FFF (4096)
// each tile 16 bytes (row 2 bytes) (total 256 tiles)
// 1st tile set:
// 1 part: 0x8000-0x87FF
// 2 part: 0x8800-0x8FFF
// 2nd tile set:
// 1 part: 0x8800-0x8FFF
// 2 part: 0x9000-0x97FF
// colors: b,d,l,w
// 0b00,0b10,0b01,0b00
// 8x8 pixel tile
//       76543210
//0x8000 10110101
//0x8001 01100101
//       dlwdbwbw
// each row of tile 2 bytes,

function readTile(ti, memory, start = 0x8000) {
  const startAddr = ti * 16 + start;
  const pixels = [];
  for (let i = 0; i < 8; i++) {
    const addr = 2 * i + startAddr;
    const b0 = memory.rd(addr);
    const b1 = memory.rd(addr + 1);
    for (let j = 0; j < 8; j++) {
      const mask = 1 << (7 - j);
      const b0i = b0 & mask ? 1 : 0;
      const b1i = b1 & mask ? 1 : 0;
      const pixel = (b0i << 1) + b1i;
      pixels.push(pixel);
    }
  }
  return pixels;
}

// VRAM Tile Maps
// 2 32x32 tile maps
// select by lcdc.3
// 0x9800-0x9BFF
// 0x9C00-0x9FFF
// 7 Priority
// 6 Y flip
// 5 X flip
// 3 Bank
// 2 1 0 Color palette

export function readTileMap(memory, lcdc3 = 0) {
  const start = lcdc3 ? 0x9c00 : 0x9800;
  return memory.data.slice(start, start + 32 * 32);
}

// export function parseTileMap(memory, lcdc3 = 0) {
//   const start = lcdc3 ? 0x9c00 : 0x9800;
//   const mask = [
//     { i: 7, name: "priority" },
//     { i: 6, name: "yflip" },
//     { i: 5, name: "xflip" },
//     { i: 3, name: "bank" },
//   ];
//   const res = [];
//   for (let i = 0; i < 16 * 16; i++) {
//     const byte = memory.rd(start + i);
//     const attributes = parseByte(byte, mask);
//     attributes["palette"] = byte & 0b111;
//     res.push(attributes);
//   }
//   return res;
// }

// OAM - 40 objs 8x8 or8x16
// 0xFE00-0xFE9F
// 4 bytes per obj
// byte 0 - Y pos
// byte 1 - X pos
// byte 2 - Tile idx
// byte 3 - Attr flags
// Priority
// Y flip
// X flip
// DMG palette
// Bank
// CGB palette
export function parseOAM(memory) {
  const res = [];
  for (let i = 0; i < 40; i++) {
    const obj = parseOAMObj(i, memory);
    res.push(obj);
  }
  return res;
}
function parseOAMObj(i, memory) {
  const start = 0xfe00;
  const addr = i * 4 + start;
  const xpos = memory.rd(addr);
  const ypos = memory.rd(addr);
  const idx = memory.rd(addr);
  const flag = memory.rd(addr);
  const mask = [
    { i: 7, name: "priority" },
    { i: 6, name: "yflip" },
    { i: 5, name: "xflip" },
    { i: 4, name: "dmg_palette" },
    { i: 3, name: "bank" },
  ];
  const attributes = parseByte(flag, mask);
  attributes["cgb_palette"] = flag & 0b111;
  return { xpos, ypos, idx, attributes };
}

// Universal function to read tile data
export function readTileRowSpecific(idx, r, memory, start=0x8000) {
  // const start = 0x8000; // VRAM Tiledata start
  const addr = idx * 16 + r * 2 + start;
  const b0 = memory.rd(addr);
  const b1 = memory.rd(addr+1);
  const row = [];
  for (let i = 0; i < 8; i++) {
    const mask = 1 << (7-i);
    const b0i = b0 & mask ? 1 : 0;
    const b1i = b1 & mask ? 1 : 0;
    const pixel = (b0i << 1) + b1i;
    row.push(pixel);
  }
  return row;
}
// export function readTileMapSpecific(idx, memory, start = 0) {
//   const lcdcByte = memory.rd(M_HARDWARE_REGISTERS.LCDC);
//   const startAddr = lcdcByte & (1<<3) ? 0x9C00 : 0x9800;
//   const byte = memory.rd(start + idx);
  
//   for (let i = 0; i < 32 * 32; i++) {
    
//     const attributes = parseByte(byte, mask);
//     attributes["palette"] = byte & 0b111;
//     res.push(attributes);
//   }
//   return res;
// }
