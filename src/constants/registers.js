export const M_HARDWARE_REGISTERS = {
  P1_JOIP: 0xff00,
  DIV: 0xff04,
  TIMA: 0xff05,
  TMA: 0xff06,
  TAC: 0xff07,
  IF: 0xff0f,
  LCDC: 0xff40,
  STAT: 0xff41,
  SCY: 0xff42,
  SCX: 0xff43,
  LY: 0xff44,
  LYC: 0xff45,
  DMA: 0xff46,
  BGP: 0xff47,
  OBP0: 0xff48,
  OBP1: 0xff49,
  WY: 0xff4a,
  WX: 0xff4b,
  DMG: 0xFF50, // set to nonzero to disable boot
  IE: 0xffff,
};

// INT 0x40 - VBlank interrupt
// - every time at start Mode 1
// INT 0x48 - STAT interrupt
// - LYC=LY, Modes 0-2
// INT 0x50 - Timer interrupt
// - every time Timer overflows (TIMA exceeds 0xFF)
// INT 0x58 - Serial interrupt
// INT 0x60 - Joypad interrupt

export const M_INTERRUPTS = {
  VBlank: "VBlank", // 0x40
  STAT: "STAT", // 0x48
  Timer: "Timer", // 0x50
  Joypad: "Joypad", // 0x60
};
export const M_INTERRUPT_TO_INFO = {
  [M_INTERRUPTS.VBlank]: {addr: 0x40, i: 0},
  [M_INTERRUPTS.STAT]: {addr: 0x48, i: 1},
  [M_INTERRUPTS.Timer]: {addr: 0x50, i: 2},
  [M_INTERRUPTS.Joypad]: {addr: 0x60, i: 4},
};
