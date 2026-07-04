// PPU modes:
// 2 - searching for OBJs overlap this line (80d)
// 3 - drawing line (172-289d)
// 0 - wait until end of scanline (376d)

import { M_HARDWARE_REGISTERS, M_INTERRUPTS } from "../constants/registers.js";
import { readTileRowSpecific } from "../utils/graphics_utils.js";

// FF0F - IF - Interrupt flag
// 4 joypad
// 3 serial
// 2 timer
// 1 lcd
// 0 vblank
// FF40 - LCDC - LCD control
// 7 LCD & PPU enable
// - if 0 cannot access VRAM, OAM
// 6 Window tile map
// - 0 - 0x9800-9BFF, 1 - 0x9C00-9FFF
// 5 Window enable
// 4 BG & Window tiles
//   0 (0-127) 9000-97FF, (128-255) 8800-8FFF
//   1 (0-127) 8000-87FF, (128-255) 8800-8FFF
// 3 BG tile map
// - 0 - 0x9800-9BFF, 1 - 0x9C00-9FFF
// 2 OBJ size
// - 8 rows, 16 rows
// 1 OBJ enable
// 0 BG & Window enable / priority
// FF41 - STAT
// 6 LYC int select	(LYC == LY -> STAT interrupt)
// 5 Mode 2 int select
// 4 Mode 1 int select
// 3 Mode 0 int select
// 2 LYC == LY (readonly)
// 1 0 PPU mode (readonly)
//   2 - searching for OBJs overlap this line (80d)
//   3 - drawing line (172-289d)
//   0 - wait until end of scanline (376d)
//   1 - waiting next frame (4560d - 10 scanlines)
// FF42 - SCY
// FF43 - SCX
// FF44 - LY
// FF45 - LYC

const colors = ["black", "red", "green", "blue"];

// 1 - waiting next frame (4560d - 10 scanlines)
const mode2dots = {
  2: 80,
  3: 172,
  0: 376,
  1: 4560,
};
export class PPU {
  constructor(engine) {
    this.engine = engine;
    this.prevCycles = 0;
    this.dots = 0;
    this.mode = 2;
    this.lcanvas = null;
    this.frame = 0;
  }
  setLCanvas(lcanvas) {
    this.lcanvas = lcanvas;
  }
  update(deltaCycles) {
    const { memory, requestInterrupt } = this.engine;
    const lcdcByte = memory.rd(M_HARDWARE_REGISTERS.LCDC);
    if (!(lcdcByte & (1 << 7))) {
      return;
    }
    this.dots += deltaCycles;
    const dotsThld = mode2dots[this.mode];
    // console.log("PPU", this.dots, dotsThld);
    if (this.dots < dotsThld) {
      return;
    }
    this.dots -= dotsThld;

    let ly = memory.rd(M_HARDWARE_REGISTERS.LY);
    if (this.mode === 0) {
      if (ly < 144) {
        this.mode = 2;
        ly += 1;
      } else {
        // last line
        this.mode = 1;
        ly = 0;
        requestInterrupt(M_INTERRUPTS.VBlank);
      }
    } else {
      this.mode = (this.mode + 1) % 4;
    }
    memory.wr(M_HARDWARE_REGISTERS.LY, ly);
    const lyc = memory.rd(M_HARDWARE_REGISTERS.LYC);
    const statByte = memory.rd(M_HARDWARE_REGISTERS.STAT);

    const lycEqLy = ly === lyc ? 1 : 0;
    const newStatByte = (statByte & 0b11111000) | (lyc << 2) | this.mode;
    memory.wr(M_HARDWARE_REGISTERS.STAT, newStatByte);

    const lycSelect = statByte & (1 << 6) ? 1 : 0;
    const modeSelect = {
      2: statByte & (1 << 5) ? 1 : 0,
      1: statByte & (1 << 4) ? 1 : 0,
      0: statByte & (1 << 3) ? 1 : 0,
    };

    if (lycEqLy && lycSelect) {
      requestInterrupt(M_INTERRUPTS.STAT);
    }
    if (this.mode === 3) {
      // draw line
      if (this.lcanvas) {
        this.drawLine();
      }
    } else if (modeSelect[this.mode]) {
      requestInterrupt(M_INTERRUPTS.STAT);
    }
  }

  drawLine() {
    const { memory } = this.engine;
    const ly = memory.rd(M_HARDWARE_REGISTERS.LY);
    const lcdc = memory.rd(M_HARDWARE_REGISTERS.LCDC);
    // FF40 - LCDC - LCD control
    // 7 LCD & PPU enable
    // - if 0 cannot access VRAM, OAM
    // 6 Window tile map
    // - 0 - 0x9800-9BFF, 1 - 0x9C00-9FFF
    // 5 Window enable
    // 4 BG & Window tiles
    //   0 (0-127) 9000-97FF, (128-255) 8800-8FFF
    //   1 (0-127) 8000-87FF, (128-255) 8800-8FFF
    // 3 BG tile map
    // - 0 - 0x9800-9BFF, 1 - 0x9C00-9FFF
    // 2 OBJ size
    // - 8 rows, 16 rows
    // 1 OBJ enable
    // 0 BG & Window enable / priority
    const bBGWindowEnable = lcdc & (1 << 0) ? 1 : 0;
    const bObjEnabled = lcdc & (1 << 1) ? 1 : 0;
    const bWindowEnabled = lcdc & (1 << 6) ? 1 : 0;

    const rowPixels = [...new Array(160)].map(() => 0);
    if (bBGWindowEnable) {
      // BG & Window
      // BG
      const bBgWindowTiles = lcdc & (1 << 4) ? 1 : 0;
      const bBgTileMap = lcdc & (1 << 3) ? 1 : 0;

      const tdIdxOffset = bBgWindowTiles ? 0 : -128;
      const tdAddrStart = bBgWindowTiles ? 0x8000 : 0x9000;
      const tmAddrStart = bBgTileMap ? 0x9c00 : 0x9800;

      const scy = memory.rd(M_HARDWARE_REGISTERS.SCY);
      const scx = memory.rd(M_HARDWARE_REGISTERS.SCX);

      const bgPixels = this._getBGWindowPixels(
        memory,
        ly,
        tdIdxOffset,
        tdAddrStart,
        tmAddrStart,
        scy,
        scx - 7
      );

      bgPixels.forEach((pixel, i) => {
        if (pixel) {
          rowPixels[i] = pixel;
        }
      });

      if (bWindowEnabled) {
        const bWindowTileMap = lcdc & (1 << 6) ? 1 : 0;
        const tmWindowAddrStart = bWindowTileMap ? 0x9c00 : 0x9800;
        const windowPixels = this._getBGWindowPixels(
          memory,
          ly,
          tdIdxOffset,
          tdAddrStart,
          tmWindowAddrStart,
          scy,
          scx - 7
        );

        windowPixels.forEach((pixel, i) => {
          if (pixel) {
            rowPixels[i] = pixel;
          }
        });
      }
    }

    if (bObjEnabled) {
      const objectPixels = this._getObjPixels(memory, ly, lcdc);
      objectPixels.forEach((pixel, i) => {
        if (pixel) {
          rowPixels[i] = pixel;
        }
      });
    }

    this.drawRowPixels(rowPixels, ly);
  }
  _getBGWindowPixels(
    memory,
    ly,
    tdIdxOffset,
    tdAddrStart,
    tmAddrStart,
    yoff,
    xoff
  ) {
    const res = [];

    const y = (yoff + ly) % 256;
    const ty = Math.floor(y / 8);
    let i = 0;
    while (i < 160) {
      const x = (256 + i + xoff) % 256;
      const tx = Math.floor(x / 8);
      const ti = ty * 32 + tx + tdIdxOffset;
      const idx = memory.rd(tmAddrStart + ti);

      let px = x % 8;
      const py = y % 8;

      const row = readTileRowSpecific(idx, py, memory, tdAddrStart);
      while (px >= 0 && px < 8 && i < 160) {
        const pixel = row[px];
        res.push(pixel);
        px++;
        i++;
      }
    }

    return res;
  }
  _getObjPixels(memory, ly, lcdc) {
    const res = [...new Array(160)].map(() => ({ priority: 0, pixel: 0 }));
    const bObjSize = lcdc & (1 << 2) ? 1 : 0;
    const objHeight = bObjSize ? 16 : 8;
    // read objecrs
    // 0xFE00 - 0xFE9F | OAM 40 objects 4 byte each
    // 0 - ypos, 1 - xpos, 2 - tileIdx, 3 - attrs
    // attrs
    // 7 - priority, 6 - yflip, 5 - xflip, 4 - dmg palette, 3 - blank, 210 - SGB palette
    for (let i = 0; i < 40; i++) {
      const addrStart = 0xfe00 + i * 4;
      const ypos = memory.rd(addrStart) - 16;
      const xpos = memory.rd(addrStart + 1) - 8;

      // check if intersect line
      if (ly < ypos || ypos + objHeight <= ly) {
        continue;
      }
      if (xpos + 8 < 0 || xpos >= 160) {
        continue;
      }

      const tdAddrStart = 0x8000;
      let tileIdx = memory.rd(addrStart + 2);
      const attrs = memory.rd(addrStart + 3);
      const priority = attrs & (1 << 7) ? 1 : 0;
      const yflip = attrs & (1 << 6) ? 1 : 0;
      const xflip = attrs & (1 << 5) ? 1 : 0;
      const dmgPalette = attrs & (1 << 4) ? 1 : 0;
      let py = ly - ypos;
      if (yflip) {
        py = objHeight - py - 1;
      }
      if (objHeight === 16) {
        const t1 = tileIdx & 0xfe;
        const t2 = (tileIdx & 0xfe) | 0x1;
        if (py < 8) {
          tileIdx = t1;
        } else {
          tileIdx = t2;
          py -= 8;
        }
      }

      const xstep = xflip ? -1 : 1;
      const row = readTileRowSpecific(tileIdx, py, memory, tdAddrStart);
      for (let j = 0; j < 8; j++) {
        const lx = xpos + j;
        const px = j * xstep;
        if (0 <= lx && lx < 160 && priority >= res[lx].priority) {
          res[lx] = { priority, pixel: row[px] };
        }
      }
    }
    return res.map((r) => r.pixel);
  }
  drawRowPixels(pixels, ly) {
    if (ly === 143) {
      this.frame++;
    }
    const hpixel = this.lcanvas.height / 144;
    const wpixel = this.lcanvas.width / 160;
    const offset = this.frame % 2 === 0 ? 0 : 1;
    pixels.forEach((pixel, i) => {
      this.lcanvas.drawRect(
        i * wpixel + offset,
        ly * hpixel,
        wpixel,
        hpixel,
        colors[pixels[i]],
        false
      );
    });
  }
}

// FF44 - LY
// FF45 - LYC
