import { parseByte } from "./bit_utils.js";


// 0xFF40
// LCDC - LCD control
// 7 LCD & PPU enable
// - if 0 cannot access VRAM, OAM
// 6 Window tile map
// - 0 - 0x9800, 1 - 0x9C00
// 5 Window enable
// 4 BG & Window tiles
// 3 BG tile map
// - 0 - 0x9800, 1 - 0x9C00
// 2 OBJ size
// - 8 rows, 16 rows
// 1 OBJ enable
// 0 BG & Window enable / priority
export function parseLCDC(byte) {
  const masks = [
    { i: 7, name: "lcd_enable" }, //
    {
      i: 6,
      name: "window_tile_map_area",
      //   mapping: [
      //     [0x9800, 0x9bff],
      //     [0x9c00, 0x9fff],
      //   ],
    },
    { i: 5, name: "window_enable" },
    {
      i: 4,
      name: "bg_window_tyle_data_area",
      //   mapping: [
      //     [0x8800, 0x97ff],
      //     [0x8000, 0x8fff],
      //   ],
    },
    {
      i: 3,
      name: "bg_tile_map_area",
      //   mapping: [
      //     [0x9800, 0x9bff],
      //     [0x9c00, 0x9fff],
      //   ],
    },
    { i: 2, name: "obj_size", mapping: [8, 16] },
    { i: 1, name: "obj_enable" },
    { i: 0, name: "bg_window_enable" },
  ];

  const res = parseByte(byte, masks);
  return res;
}

// IE - 0xFFFF - Interrupt enable
// IF - 0xFF0F - Interrupt flag
// 4 joypad
// 3 serial
// 2 timer
// 1 lcd
// 0 vblank
// if (IF[i] = 1 && IE[i] = 1) CALL iaddr
export function parseIE(byte) {
  const masks = [
    { i: 4, name: "joypad" },
    { i: 3, name: "serial" },
    { i: 2, name: "timer" },
    { i: 1, name: "lcd" },
    { i: 0, name: "vblank" },
  ];
  const res = parseByte(byte, masks);
  return res;
}

// STAT - 0xFF41 - LCD status
// 6 LYC int select	(LYC == LY -> STAT interrupt)
// 5 Mode 2 int select
// 4 Mode 1 int select
// 3 Mode 0 int select
// 2 LYC == LY (readonly)
// 1 0 PPU mode (readonly)
export function parseSTAT(byte) {
  const masks = [
    { i: 6, name: "lyc_select" },
    { i: 5, name: "mode2_select" },
    { i: 4, name: "mode1_select" },
    { i: 3, name: "mode0_select" },
    { i: 2, name: "lyc" },
  ];
  const res = parseByte(byte, masks);
  res["ppu_mode"] = byte & 0b11;
  return res;
}

// PPU modes:
// 2 - searching for OBJs overlap this line (80d)
// 3 - drawing line (172-289d)
// 0 - wait until end of scanline (376d)
// 1 - waiting next frame (4560d - 10 scanlines)

// P1/JOYP - 0xFF00 - Joypad
// 5 Select buttons
// 4 Select d-pad
// 3 Start / Down
// 2 Select / Up
// 1 B / Left
// 0 A / Right
export function parseJOYP(byte) {
  const masks = [
    { i: 5, name: "buttons_select" },
    { i: 4, name: "dpad_select" },
    { i: 3, name: "start_down" },
    { i: 2, name: "select_up" },
    { i: 1, name: "b_left" },
    { i: 0, name: "a_right" },
  ];
  const res = parseByte(byte, masks);
  return res;
}

// DIV - 0xFF04 - Divider register
// w -> 0x00
// increments at a rate of 16384Hz
// 0xFF -> 0x00

// TIMA - 0xFF05 - Timer counter
// increments at freq spec in TAC (0xFF07)
// 0xFF -> TMA (0xFF06)
// overflow -> interrupt

// TMA - 0xFF06 - Timer module

// TAC - 0xFF07 - Timer control
// 2 - enable
// 1 0 - clock select (00 - 256M, 01 - 4M, 10 - 16M, 11 - 64M)
export function parseTAC(byte) {
  const clocks = [256, 4, 16, 64];
  const enabled = byte & 0b100 ? 1 : 0;
  const clock_select = clocks[byte & 0b11];
  return { enabled, clock_select };
}

// 1) read 0xFF04,0xFF05,0xFF06,0xFF07 (DIV,TIMA,TMA,TAC)
// 2) parse TAC
// 3) if TAC.enabled -> inc TIMA, check overflow, set interrupt flag, reset to TMA
// 4) inc DIV, check overflow

// 0xFF46 - DMA
// OAM DMA Transfer
// writing to it initiates ROM/RAM -> OAM transfer
// src: 0xXX00-0xXX9F (XX=00-DF) -> dst: 0xFF00-0xFE9F

// 0xFF47 BGB
export function parseBGB(byte) {
  const colors = ["w", "l", "d", "b"];
  return [
    colors[(byte >> 0) & 0b11],
    colors[(byte >> 2) & 0b11],
    colors[(byte >> 4) & 0b11],
    colors[(byte >> 6) & 0b11],
  ];
}
