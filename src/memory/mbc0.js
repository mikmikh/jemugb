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

export class MBC0 {
  constructor(engine) {
    this.engine = engine;
    this.data = new Uint8Array(0xffff + 1);
    this.rom = null;
    this.romBoot = null;
  }
  setRom(rom) {
    // console.log(rom.length);
    this.rom = rom;
  }
  setRomBoot(romBoot) {
    // console.log(romBoot.length);
    this.romBoot = romBoot;
  }
  rd(addr) {
    if (this.romBoot && 0x0000 <= addr && addr < this.romBoot.length) {
      if (this.data[M_HARDWARE_REGISTERS.DMG] === 0) {
        // boot rom enabled if DMG = 0
        return this.romBoot[addr];
      }
    }
    if (0x0000 <= addr && addr < this.rom.length) {
      return this.rom[addr];
    }
    if (addr === M_HARDWARE_REGISTERS.P1_JOIP) {
      // console.warn(this.data[M_HARDWARE_REGISTERS.P1_JOIP].toString(2))

      const res =this.engine.onJoypadRead();
      // console.warn(res.toString(2))
      return res;
    }
    return this.data[addr];
  }
  wr(addr, byte) {
    // const action = checkMemoryWriteAction(addr, byte);
    // if (action && action.type && action.type === 'vram') {
    //   console.warn(action);
    // }
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
    }
    this.data[addr] = byte;
  }
}
