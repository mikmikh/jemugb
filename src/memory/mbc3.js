import { M_HARDWARE_REGISTERS } from "../constants/registers.js";
import { checkMemoryWriteAction } from "../utils/debug.js";

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

export class MBC3 {
  constructor(engine, ramSizeKB = 32) {
    this.engine = engine;
    this.data = new Uint8Array(0xffff + 1);
    this.ram = new Uint8Array((0x2000 * ramSizeKB) / 8);
    this.rom = null;
    this.romBoot = null;

    this.memory_mode = 0;
    this.rom_bank_number = 0;
    this.ram_bank_number = 0;
    this.ram_enabled = 1;
  }
  setRom(rom) {
    this.rom = rom;
  }
  setRomBoot(romBoot) {
    this.romBoot = romBoot;
  }
  rd(addr) {
    if (this.romBoot && 0x0000 <= addr && addr < this.romBoot.length) {
      if (this.data[M_HARDWARE_REGISTERS.DMG] === 0) {
        // boot rom enabled if DMG = 0
        return this.romBoot[addr];
      }
    }
    if (0x0000 <= addr && addr <= 0x3fff) {
      // ROM BANK 0 (16kB)
      return this.rom[addr];
    } else if (0x4000 <= addr && addr <= 0x7fff) {
      // ROM BANK N (16kB)
      const i = this.rom_bank_number || 1;
      return this.rom[addr + (i-1) * 0x4000];
    } else if (0x8000 <= addr && addr <= 0x9fff) {
      // VRAM (8kB)
      return this.data[addr];
    } else if (0xa000 <= addr && addr <= 0xbfff) {
      // RAM BANK (8kB)
      return this.ram[this.ram_bank_number * 0x2000 + addr - 0xa000];
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
    if (addr === M_HARDWARE_REGISTERS.P1_JOIP) {
      // console.warn(this.data[M_HARDWARE_REGISTERS.P1_JOIP].toString(2))

      const res = this.engine.onJoypadRead();
      // console.warn(res.toString(2))
      return res;
    }
    return this.data[addr];
  }
  wr(addr, byte) {
    if (0x0000 <= addr && addr <= 0x3fff) {
      // ROM BANK 0 (16kB)
      if (0x0000 <= addr && addr <= 0x1fff) {
        this.ram_enabled = (byte & 0b1111) === 0b1010 ? 1 : 0;
      } else if (0x2000 <= addr && addr <= 0x3fff) {
        this.rom_bank_number = byte;
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
      this.ram[addr + this.ram_bank_number * 0x2000 - 0xa000] = byte;
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
    }  else {
      if (addr === M_HARDWARE_REGISTERS.DMG && byte !== 0) {
        console.warn("Disabling Boot rom");
      } else if (addr === M_HARDWARE_REGISTERS.DMA) {
        // console.log("Write DMA (initialte OAM transfer)");
        if (byte >= 0x00 && byte <= 0xdf) {
          const srcStart = byte << 8;
          for (let i = 0; i < 0xff; i++) {
            this.data[0xfe00 + i] = this.data[srcStart + i];
          }
        } else {
          console.warn("Wrong DMA Address", byte.toString(16));
        }
      } else if (addr === M_HARDWARE_REGISTERS.P1_JOIP) {
        byte |= 0xf;
      }
      this.data[addr] = byte;
    }
  }
}
