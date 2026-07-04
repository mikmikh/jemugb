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

// const colors = ["black", "red", "green", "blue"];
// const colors = ['#ffffff',  '#aeaeae', '#a0a0a0', "#000000"];
const colors = ['#9bbc0f',  '#8bac0f', '#306230', "#0f380f"];

// 1 - waiting next frame (4560d - 10 scanlines)
const mode2dots = {
  2: 80,
  3: 172,
  0: 376,
  1: 4560,
};
export class PPU2 {
  constructor(engine) {
    this.engine = engine;
    this.dots = 0;
    this.mode = 2;
    this.lcanvas = null;
    this.frame = 0;
  }
  setLCanvas(lcanvas) {
    this.lcanvas = lcanvas;
  }

  update(deltaCycles) {
    this.dots += deltaCycles;
    let vblank = false;

    const thld = mode2dots[this.mode];

    const { memory, requestInterrupt } = this.engine;
    let ly = memory.rd(M_HARDWARE_REGISTERS.LY);
    if (this.mode === 0) {
      // HBLANK
      if (this.dots >= thld) {
        this.dots -= thld;
        ly++;
        this._updateLY(ly);
        if (ly === 144) {
          this._updateMode(1);
          vblank = true;
          requestInterrupt(M_INTERRUPTS.VBlank);
          // draw frame
        } else {
          this._updateMode(2);
        }
      }
    } else if (this.mode === 1) {
      if (this.dots >= thld / 10) {
        this.dots -= thld / 10;
        ly++;
        if (ly > 153) {
          ly = 0;
          this._updateMode(2);
        }
        this._updateLY(ly);
      }
    } else if (this.mode === 2) {
      if (this.dots >= thld) {
        this.dots -= thld;
        this._updateMode(3);
      }
    } else if (this.mode === 3) {
      if (this.dots >= thld) {
        this.dots -= thld;
        this._updateMode(0);
        this.drawLine();
      }
    }

    return vblank;
  }

  // STAT
  // 6 LYC int select
  // 5 Mode 2 int select
  // 4 Mode 1 int select
  // 3 Mode 0 int select
  // 2 LYC == LY
  // 1-0 PPU mode
  _updateMode(mode) {
    this.mode = mode;
    const { memory, requestInterrupt } = this.engine;
    let statByte = memory.rd(M_HARDWARE_REGISTERS.STAT);
    statByte &= 0xfc;
    statByte |= this.mode;
    memory.wr(M_HARDWARE_REGISTERS.STAT, statByte);
    if (this.mode === 3) {
      return;
    }
    if (statByte & (1 << (mode + 3))) {
      requestInterrupt(M_INTERRUPTS.STAT);
    }
  }
  _updateLY(ly) {
    const { memory, requestInterrupt } = this.engine;
    let statByte = memory.rd(M_HARDWARE_REGISTERS.STAT);
    const lyc = memory.rd(M_HARDWARE_REGISTERS.LYC);
    memory.wr(M_HARDWARE_REGISTERS.LY, ly);
    statByte &= 0xfb;

    if (ly === lyc) {
      statByte |= 1 << 2;
    }
    memory.wr(M_HARDWARE_REGISTERS.STAT, statByte);
    if (statByte & (1 << 6) && ly == lyc) {
      requestInterrupt(M_INTERRUPTS.STAT);
    }
  }

  drawLine() {
    const { memory } = this.engine;
    const ly = memory.rd(M_HARDWARE_REGISTERS.LY);
    const bgp = memory.rd(M_HARDWARE_REGISTERS.BGP);
    // FF47 BGP
    //   76 54 32 10
    //id  3  2  1  0
    // 0w 1l 2d 3b
    const bgWindowColors = [
      (bgp >> 0) & 0x3,
      (bgp >> 2) & 0x3,
      (bgp >> 4) & 0x3,
      (bgp >> 6) & 0x3,
    ];

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
    const bWindowEnabled = lcdc & (1 << 5) ? 1 : 0;

    const rowPixels = [...new Array(160)].map(() => null);
    if (bBGWindowEnable) {
      // BG & Window
      // BG
      const bBgWindowTiles = lcdc & (1 << 4) ? 1 : 0;
      const bBgTileMap = lcdc & (1 << 3) ? 1 : 0;

      const tdAddrStarts = bBgWindowTiles ? [0x8000, 0x8800] : [0x9000, 0x8800];
      const tmBGAddrStart = bBgTileMap ? 0x9c00 : 0x9800;

      const scy = memory.rd(M_HARDWARE_REGISTERS.SCY);
      const scx = memory.rd(M_HARDWARE_REGISTERS.SCX);

      const bgPixels = this._getBGWindowPixels(
        memory,
        ly,
        tdAddrStarts,
        tmBGAddrStart,
        scy,
        scx
      );

      bgPixels.forEach((pixel, i) => {
        // if (pixel) {
          rowPixels[i] = bgWindowColors[pixel];
        // }
      });

      if (bWindowEnabled) {
        const bWindowTileMap = lcdc & (1 << 6) ? 1 : 0;
        const tmWindowAddrStart = bWindowTileMap ? 0x9c00 : 0x9800;
        const wy = memory.rd(M_HARDWARE_REGISTERS.WY);
        const wx = memory.rd(M_HARDWARE_REGISTERS.WX);

        if (ly >= wy) {
        const windowPixels = this._getBGWindowPixels(
          memory,
          ly,
          tdAddrStarts,
          tmWindowAddrStart,
          wy,
          wx-7,
        );

        windowPixels.forEach((pixel, i) => {
          // if (pixel) {
            rowPixels[i] = bgWindowColors[pixel];
          // }
        });
        }
      }
    }

    if (bObjEnabled) {
      const objectPixels = this._getObjPixels(memory, ly, lcdc);
      objectPixels.forEach((pixel, i) => {
        if (pixel !== null){// && !rowPixels[i]) {
          rowPixels[i] = pixel;
        }
      });
    }

    this.drawRowPixels(rowPixels, ly);
  }
  _getBGWindowPixels(
    memory,
    ly,
    tdAddrStarts,
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
      const ti = ty * 32 + tx;

      let idx = memory.rd(tmAddrStart + ti);

      let px = x % 8;
      const py = y % 8;

      let tdAddrStart = tdAddrStarts[0];
      if (idx > 128) {
        tdAddrStart = tdAddrStarts[1];
        idx-=128;
      }

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
    const obp0 = memory.rd(M_HARDWARE_REGISTERS.OBP0);
    const obp1 = memory.rd(M_HARDWARE_REGISTERS.OBP1);
    const palettas = [
      [
        (obp0 >> 0) & 0x3,
        (obp0 >> 2) & 0x3,
        (obp0 >> 4) & 0x3,
        (obp0 >> 6) & 0x3,
      ],
      [
        (obp1 >> 0) & 0x3,
        (obp1 >> 2) & 0x3,
        (obp1 >> 4) & 0x3,
        (obp1 >> 6) & 0x3,
      ],
    ];
    const res = [...new Array(160)].map(() => null );
    const bObjSize = lcdc & (1 << 2) ? 1 : 0;
    const objHeight = bObjSize ? 16 : 8;
    // read objecrs
    // 0xFE00 - 0xFE9F | OAM 40 objects 4 byte each
    // 0 - ypos, 1 - xpos, 2 - tileIdx, 3 - attrs
    // attrs
    // 7 - priority, 6 - yflip, 5 - xflip, 4 - dmg palette, 3 - blank, 210 - SGB palette
    const objs = [];
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

      const palette = palettas[dmgPalette];

      const row = readTileRowSpecific(tileIdx, py, memory, tdAddrStart);
      const pixels = [];
      for (let j = 0; j < 8; j++) {
        const lx = xpos + j;
        const px = xflip ? 7 - j : j;
        // if (0 <= lx && lx < 160 && row[px]) {
          pixels.push(row[px] ? palette[row[px]] : null);
        // }
        // if (0 <= lx && lx < 160 && priority >= res[lx].priority && row[px]) {
        //   pixels.push(palette[row[px]]);
        //   res[lx] = { priority, pixel: palette[row[px]] };
        // }
      }
      const obj = {
        xpos,
        priority,
        i,
        pixels,
      };
      objs.push(obj);
    }
    objs.sort((lhs,rhs) => {
      // priority , xpos, i DESC
      if (lhs.priority === rhs.priority) {
        if (lhs.xpos === rhs.xpos) {
          return rhs.i - lhs.i;
        }
        return rhs.xpos - lhs.xpos;
      }
      return lhs.priority - rhs.priority;
    });
    objs.forEach(({xpos, pixels}) => {
      pixels.forEach((p,i) => {
        const lx = xpos + i;
        if (0 <= lx && lx < 160 && p !== null) {
          res[lx] = p;
        }
      })
    })
    return res;
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
        colors[pixels[i] ?? 0],
        false
      );
    });
  }
}

// FF44 - LY
// FF45 - LYC
