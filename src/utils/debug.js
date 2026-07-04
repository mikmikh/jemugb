import { toHexStr } from "./bit_utils.js";

export function drawTileData(tileData, lcanvas) {
  const htile = lcanvas.height / 16;
  const wtile = lcanvas.width / 16;
  tileData.forEach((tdata, i) => {
    const r = Math.floor(i / 16);
    const c = i % 16;
    drawTile(tdata, lcanvas, wtile, htile, wtile * c, htile * r);
  });
}

function drawTile(pixels, lcanvas, width, height, wstart, hstart) {
  const hpixel = height / 8;
  const wpixel = width / 8;
  const colors = ["black", "red", "green", "blue"];
  pixels.forEach((pixel, i) => {
    const r = Math.floor(i / 8);
    const c = i % 8;
    const color = colors[pixel];
    lcanvas.drawRect(
      wstart + c * wpixel,
      hstart + r * hpixel,
      wpixel,
      hpixel,
      color,
      false
    );
  });
  // if (pxs.length) console.log(pxs);
}

// Interrupt Enable Register
// --------------------------- FFFF
// Internal RAM
// --------------------------- FF80
export function formatStack(registers, memory) {
  // 0xFFFE
  const valid = registers.SP >= 0xff80 && registers.SP <= 0xfffe;
  const sp = toHexStr(registers.SP);
  if (!valid) {
    return { valid, sp };
  }
  const bytes = [];
  let addr = registers.SP;
  while (addr < 0xfffe) {
    const byte = memory.rd(++addr);
    bytes.push(byte);
  }
  const stack = bytes.map((b) => toHexStr(b));
  return { valid, sp, stack };
}
export function formatRegisters(registers) {
  const res = Object.keys(registers).reduce(
    (s, k) => ({ ...s, [k]: toHexStr(registers[k]) }),
    {}
  );
  return res;
}

export function checkMemoryWriteAction(addr, byte) {
  if (0x0000 <= addr && addr <= 0x3fff) {
    // ROM BANK 0 (16kB)
    if (0x0000 <= addr && addr <= 0x1fff) {
      const ram_enabled = (byte & 0b1111) === 0b1010 ? 1 : 0;
      return { ram_enabled };
    } else if (0x2000 <= addr && addr <= 0x3fff) {
      const rom_bank_number = byte & 0b11111;
      return { rom_bank_number };
    }
  } else if (0x4000 <= addr && addr <= 0x7fff) {
    // ROM BANK N (16kB)
    if (0x4000 <= addr && addr <= 0x5fff) {
      const ram_bank_number = byte & 0b11;
      return { ram_bank_number };
    } else if (0x6000 <= addr && addr <= 0x7fff) {
      const memory_mode = byte & 0x1 ? 1 : 0;
      return { memory_mode };
    }
  } else if (0x8000 <= addr && addr <= 0x9fff) {
    // VRAM (8kB)
    return { type: "vram", addr: toHexStr(addr), byte: toHexStr(byte) };
  } else if (0xa000 <= addr && addr <= 0xbfff) {
    // RAM BANK (8kB)
    return { type: "ram_bank", addr: toHexStr(addr), byte: toHexStr(byte) };
  } else if (0xc000 <= addr && addr <= 0xdfff) {
    // Internal RAM (8kB)
    return { type: "ram", addr: toHexStr(addr), byte: toHexStr(byte) };
  } else if (0xe000 <= addr && addr <= 0xfdff) {
    // Echo of 0xC000-0xDDFF
    return { type: "echo_ram", addr: toHexStr(addr), byte: toHexStr(byte) };
  } else if (0xfe00 <= addr && addr <= 0xfe9f) {
    // Object attribute memory (OAM)
    return { type: "oam", addr: toHexStr(addr), byte: toHexStr(byte) };
  } else if (0xfea0 <= addr && addr <= 0xfeff) {
    // Not usable
    return { type: "unusable", addr: toHexStr(addr), byte: toHexStr(byte) };
  } else if (0xfea0 <= addr && addr <= 0xfeff) {
    // Not usable
    return { type: "unusable", addr: toHexStr(addr), byte: toHexStr(byte) };
  }
  return null;
}

export function drawTileMap(lcanvas, tileData, tileMap) {
  const htile = lcanvas.height / 32;
  const wtile = lcanvas.width / 32;
  tileMap.forEach((idx, i) => {
    const r = Math.floor(i / 32);
    const c = i % 32;
    drawTile(tileData[idx], lcanvas, wtile, htile, wtile * c, htile * r);
  });
}

function drawTileMapTile(lcanvas, pixels, width, height, wstart, hstart) {
  const hpixel = height / 8;
  const wpixel = width / 8;
  const colors = ["black", "red", "green", "blue"];
  const yflip = tmap & (1 << 6) ? 1 : 0;
  const xflip = tmap & (1 << 5) ? 1 : 0;
  tdata.forEach((pixel, i) => {
    let r = Math.floor(i / 8);
    let c = i % 8;
    r = yflip ? 7 - r : r;
    c = xflip ? 7 - c : c;
    const color = colors[pixel];
    lcanvas.drawRect(
      wstart + c * wpixel,
      hstart + r * hpixel,
      wpixel,
      hpixel,
      color,
      false
    );
  });
}

function _createRanges(start, end) {
  const res = [];
  if (start < end) {
    res.push([start, end]);
  } else {
    res.push([0, end], [start, 255]);
  }
  return res;
}

export function drawBGWindow(lcanvas, y, x, color = "lime") {
  const ch = lcanvas.height / 256;
  const cw = lcanvas.width / 256;
  // 160x144
  const bgYLimits = [y, (y + 144) % 256];
  const bgXLimits = [x, (x + 160) % 256];
  const bgYRanges = _createRanges(bgYLimits[0], bgYLimits[1]);
  const bgXRanges = _createRanges(bgXLimits[0], bgXLimits[1]);
  for (const yrange of bgYRanges) {
    const ys = yrange.map((v) => v * ch);
    for (const xrange of bgXRanges) {
      const xs = xrange.map((v) => v * cw);
      lcanvas.drawLine(xs[0], ys[0], xs[1], ys[0], color, false);
      lcanvas.drawLine(xs[0], ys[1], xs[1], ys[1], color, false);
      lcanvas.drawLine(xs[0], ys[0], xs[0], ys[1], color, false);
      lcanvas.drawLine(xs[1], ys[0], xs[1], ys[1], color, false);
    }
  }
}
