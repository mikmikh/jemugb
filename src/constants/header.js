// HEADER
// 0x0100-0x0103 entry point (nop jp 0x0150)
// 0x0104-0x0133 nintendo logo
// 0x0134-0x0143 title
// 0x013F-0x0142 manufacturer code
// 0x0143 color ?
// 0x0144–0x0145 - licence (used if Old licensee is exactly 0x33)
// 0x0146 SGB flag
// 0x0147 Cartridge type
// 0x0148 ROM size
// 0x0149 RAM size
// 0x014A Destination code
// 0x014B Old licensee code
// 0x014C Mask ROM version number
// 0x014D Header checksum (header 0x0134–0x014C)
// 0x014E-0x014F — Global checksum

export const HEADER_ADDRS = {
  R_ENTRY: [0x0100, 0x0103],
  R_LOGO: [0x0104, 0x0133],
  R_TITLE: [0x0134, 0x0143],
  R_MANUFACTURER_CODE: [0x013f, 0x0142],
  R_GLOBAL_CHECKSUM: [0x014e, 0x014f],
  R_LICENCE: [0x0144, 0x0145],
  COLOR: 0x0143,
  SGB_F: 0x0146,
  CARTRIDGE_TYPE: 0x0147,
  ROM_SIZE: 0x0148, // Kib
  RAM_SIZE: 0x0149, // Kib
  DESTINATION_CODE: 0x014a, // 0x00 Japan, 0x01 overseas
  OLD_LICENCE_CODE: 0x014b,
  MASK_ROM_VERSION_NUMBER: 0x014c,
  HEADER_CHECKSUM: 0x014d,
};
export const mapROMSizeKib = {
  0x00: 32,
  0x01: 64,
  0x02: 128,
  0x03: 256,
  0x04: 512,
  0x05: 1024,
  0x06: 1024 * 2,
  0x07: 1024 * 4,
  0x08: 1024 * 8,
};
export const mapRAMSizeKib = {
  0x00: 0,
  0x02: 8,
  0x03: 32,
  0x04: 128,
  0x05: 64,
};
export const mapDestinationCode = {
  0x00: "Japan (and possibly overseas)",
  0x01: "Overseas only",
};
export const mapCartridgeType = {
    0x00: "ROM ONLY",
    0x01: "MBC1",
    0x02: "MBC1+RAM",
    0x03: "MBC1+RAM+BATTERY",
    0x05: "MBC2",
    0x06: "MBC2+BATTERY",
    0x08: "ROM+RAM 1",
    0x09: "ROM+RAM+BATTERY 1",
    0x0B: "MMM01",
    0x0C: "MMM01+RAM",
    0x0D: "MMM01+RAM+BATTERY",
    0x0F: "MBC3+TIMER+BATTERY",
    0x10: "MBC3+TIMER+RAM+BATTERY 2",
    0x11: "MBC3",
    0x12: "MBC3+RAM 2",
    0x13: "MBC3+RAM+BATTERY 2",
    0x19: "MBC5",
    0x1A: "MBC5+RAM",
    0x1B: "MBC5+RAM+BATTERY",
    0x1C: "MBC5+RUMBLE",
    0x1D: "MBC5+RUMBLE+RAM",
    0x1E: "MBC5+RUMBLE+RAM+BATTERY",
    0x20: "MBC6",
    0x22: "MBC7+SENSOR+RUMBLE+RAM+BATTERY",
    0xFC: "POCKET CAMERA",
    0xFD: "BANDAI TAMA5",
    0xFE: "HuC3",
    0xFF: "HuC1+RAM+BATTERY",
};
