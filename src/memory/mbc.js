// Interrupt Enable Register
// --------------------------- FFFF
// Internal RAM
// --------------------------- FF80
// Empty but unusable for I/O
// --------------------------- FF4C
// I/O ports
// --------------------------- FF00
// Empty but unusable for I/O
// --------------------------- FEA0
// Sprite Attrib Memory (OAM)
// --------------------------- FE00
// Echo of 8kB Internal RAM
// --------------------------- E000
// 8kB Internal RAM
// --------------------------- C000
// 8kB switchable RAM bank          (inside Cartridge)
// --------------------------- A000
// 8kB Video RAM
// --------------------------- 8000 --
// 16kB switchable ROM bank |
// --------------------------- 4000 |= 32kB Cartrigbe
// 16kB ROM bank #0 |
// --------------------------- 0000 --
// * NOTE: b = bit, B = byte

export class MBC {
  constructor(ramSizeKiB = 16) {
    this.data = new Uint8Array(0xffff);
    this.ram = new Uint8Array(ramSizeKiB * 0x4000);
    this.rom = null;

    this.memory_mode = 0;
    this.rom_bank_number = 0;
    this.ram_bank_number = 0;
    this.ram_enabled = 1;
  }
  setRom(rom) {
    this.rom = rom;
  }
  write(addr, byte) {
    if (0x0000 <= addr && addr <= 0x3fff) {
      // ROM BANK 0 (16kB)
      if (0x0000 <= addr && addr <= 0x1fff) {
        this.ram_enabled = (byte & 0b1111) === 0b1010 ? 1 : 0;
      } else if (0x2000 <= addr && addr <= 0x3fff) {
        this.rom_bank_number = byte & 0b11111;
      }
    } else if (0x4000 <= addr && addr <= 0x7fff) {
      // ROM BANK N (16kB)
      if (0x4000 <= addr && addr <= 0x5fff) {
        this.ram_bank_number = byte & 0b11;
      } else if (0x6000 <= addr && addr <= 0x7fff) {
        this.memory_mode = byte & 0x1 ? 1 : 0;
      }
    } else if (0x8000 <= addr && addr <= 0x9fff) {
      // VRAM (8kB)
      this.data[addr] = byte;
    } else if (0xa000 <= addr && addr <= 0xbfff) {
      // RAM BANK (8kB)
      this.ram[addr + this.ram_bank_number * 0x4000] = byte;
    } else if (0xc000 <= addr && addr <= 0xdfff) {
      // Internal RAM (8kB)
      this.data[addr] = byte;
    } else if (0xe000 <= addr && addr <= 0xfdff) {
      // Echo of 0xC000-0xDDFF
      this.data[addr - 0x2000] = byte;
    } else if (0xfe00 <= addr && addr <= 0xfe9f) {
      // Object attribute memory (OAM)
      this.data[addr] = byte;
    } else if (0xfea0 <= addr && addr <= 0xfeff) {
      // Not usable
      this.data[addr] = byte;
    } else if (0xfea0 <= addr && addr <= 0xfeff) {
      // Not usable
      this.data[addr] = byte;
    }
  }
  read(addr) {
    if (0x0000 <= addr && addr <= 0x3fff) {
      // ROM BANK 0 (16kB)
      return this.rom[addr];
    } else if (0x4000 <= addr && addr <= 0x7fff) {
      // ROM BANK N (16kB)
      const i = this.rom_bank_number !== 0 ? this.rom_bank_number : 1;
      return this.rom[addr + i * 0x4000];
    } else if (0x8000 <= addr && addr <= 0x9fff) {
      // VRAM (8kB)
      return this.data[addr];
    } else if (0xa000 <= addr && addr <= 0xbfff) {
      // RAM BANK (8kB)
      return this.ram[addr + this.ram_bank_number * 0x4000];
    } else if (0xc000 <= addr && addr <= 0xdfff) {
      // Internal RAM (8kB)
      return this.data[addr];
    } else if (0xe000 <= addr && addr <= 0xfdff) {
      // Echo of 0xC000-0xDDFF
      return this.data[addr - 0x2000];
    } else if (0xfe00 <= addr && addr <= 0xfe9f) {
      // Object attribute memory (OAM)
      return this.data[addr];
    } else if (0xfea0 <= addr && addr <= 0xfeff) {
      // Not usable
      return this.data[addr];
    } else if (0xfea0 <= addr && addr <= 0xfeff) {
      // Not usable
      return this.data[addr];
    }
  }
}
