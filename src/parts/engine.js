import { MBC0 } from "../memory/mbc0.js";
import { toHexStr } from "../utils/bit_utils.js";
import { getOpcode2ins } from "../instructions/interpreter.js";
import { NotImplementedError } from "../errors/not-implemented.error.js";
import { JTimer } from "./timer.js";
import {
  M_HARDWARE_REGISTERS,
  M_INTERRUPT_TO_INFO,
  M_INTERRUPTS,
} from "../constants/registers.js";
import { _PUSH_PC } from "../instructions/instruction-definitions.js";
// import { PPU } from "./ppu.js";
import { PPU2 } from "./ppu2.js";
import { MBC1 } from "../memory/mbc1.js";
import { getHeaderInfo } from "../utils/header_utils.js";
import { MBC3 } from "../memory/mbc3.js";

const [OPCODE_TO_INS, CB_OPCODE_TO_INS] = getOpcode2ins();

const registers = {
  A: 0x00, // Accumulator
  F: 0x00, // Flags 4c 5h 6n 7z
  B: 0x00,
  C: 0x00,
  D: 0x00,
  E: 0x00,
  H: 0x00,
  L: 0x00,
  SP: 0x0000, // Stack Pointer
  PC: 0x0000, // Program Counter/Pointer
};

const INTERRUPT_TO_NAME = ["VBlank", "STAT", "Timer", "Serial", "Joypad"];
export class JEngine {
  constructor() {
    this.registers = { ...registers };
    // this.memory = new MBC0(this);
    // this.memory = new MBC1(this);
    this.memory = null;
    this.timer = new JTimer(this);
    this.ppu = new PPU2(this);
    this.halt = this.halt_.bind(this);
    this.disableInterrupts = this.disableInterrupts_.bind(this);
    this.enableInterrupts = this.enableInterrupts_.bind(this);
    this.requestInterrupt = this.requestInterrupt_.bind(this);
    this.onJoypadRead = this.onJoypadRead_.bind(this);
    this.headerInfo = null;
    this.is_halt = false;
    this.debug = false;
    this.cycles = 0;
    this.ime = 1;

    this.joypadButtons = {};
    this.info = null;
    this.speed = 1;
  }
  async setRom(rom) {
    const info = getHeaderInfo(rom);
    this.info = info;
    if (info.cartridge_type.includes("MBC1")) {
      this.memory = new MBC1(this, info.ram_size);
    }  if (info.cartridge_type.includes("MBC3") || info.cartridge_type.includes("MBC5")) {
      this.memory = new MBC3(this, info.ram_size);
    } else {
      this.memory = new MBC0(this);
    }
    this.memory.setRom(rom);
  }
  async setRomBoot(romBoot) {
    this.memory.setRomBoot(romBoot);
  }
  saveRam() {
    if (!this.info) {
      console.warn("Failed to save RAM: no info found");
      return;
    }
    const key = "jgb-save-ram-" + this.info.title.replaceAll('\x00','').replaceAll(' ','_');
    if (this.memory.ram && this.info) {
      console.log("Saving RAM", this.memory.ram.length, key);
      localStorage.setItem(key, JSON.stringify(Array.from(this.memory.ram)));
    } else {
      console.warn("Failed to save RAM", key);
    }
  }
  loadRam() {
    if (!this.info) {
      console.warn("Failed to load RAM: no info found");
      return;
    }
    const key = "jgb-save-ram-" + this.info.title.replaceAll('\x00','').replaceAll(' ','_');
    console.log("info",this.info);
    const ramStr = localStorage.getItem(key);
    if (this.memory.ram && ramStr) {
      this.memory.ram = new Uint8Array(JSON.parse(ramStr));
      console.log("Loaded RAM", this.memory.ram.length, key);
    } else {
      console.warn("Failed to load RAM", key);
    }
  }
  clearRam() {
    if (!this.info) {
      console.warn("Failed to clear RAM: no info found");
      return;
    }
    const key = "jgb-save-ram-" + this.info.title.replaceAll('\x00','').replaceAll(' ','_');
    localStorage.removeItem(key);
    console.log('Cleared RAM', key);
  }
  setLCanvas(lcanvas) {
    this.ppu.setLCanvas(lcanvas);
  }
  _fetchNextInstruction() {
    let pc = this.registers.PC;
    let opcode = this.memory.rd(pc++);
    const cb = opcode === 0xcb;
    const opcodeMap = cb ? CB_OPCODE_TO_INS : OPCODE_TO_INS;
    if (cb) {
      opcode = this.memory.rd(pc++);
    }
    if (!(opcode in opcodeMap)) {
      throw new NotImplementedError(`${toHexStr(opcode)}`);
    }
    const ins = opcodeMap[opcode];
    const args = [];
    for (let i = 0; i < ins.args; i++) {
      const arg = this.memory.rd(pc++);
      args.push(arg);
    }
    const data = ins.opcodes[opcode];

    const res = {
      nextPC: pc,
      ins,
      args,
      data,
    };
    return res;
  }
  _executeInstruction({ nextPC, ins, args, data }) {
    this.registers.PC = nextPC;
    ins.exec(data, args, this);
    this.registers.F &= 0xf0;
    const deltaCycles = ins.cycles;
    this.cycles += deltaCycles;
    // this.timer.update(deltaCycles);
    // this.ppu.update(deltaCycles);
    return this._updateCycles(deltaCycles);
  }
  executeNextInstrution() {
    const instructionInfo = this._fetchNextInstruction();
    this._executeInstruction(instructionInfo);
  }
  _updateCycles(deltaCycles) {
    this.timer.update(deltaCycles);
    return this.ppu.update(deltaCycles * 2  / this.speed);
  }
  halt_() {
    // stop CPU untill next Interrupt (some i: IE[i]=1 && IF[i]=1)
    // IME handles interrupts, not related to condition of resuming halt state
    this.running = false;
    this.is_halt = true;
    // console.warn("halt");
  }
  disableInterrupts_() {
    // console.warn("disableInterrupts_");
    this.ime = 0;
  }
  enableInterrupts_() {
    // console.warn("enableInterrupts_");
    this.ime = 1;
  }
  requestInterrupt_(name) {
    // console.warn("requestInterrupt_", name, "ime", this.ime);

    const { memory } = this;
    const interruptInfo = M_INTERRUPT_TO_INFO[name];
    if (!interruptInfo) {
      throw Error(`Unknown interrupt: ${name}`);
    }
    let ifByte = memory.rd(M_HARDWARE_REGISTERS.IF);

    ifByte |= 1 << interruptInfo.i;
    memory.wr(M_HARDWARE_REGISTERS.IF, ifByte);
  }
  checkInterrupts() {
    if (!this.ime) {
      return;
    }
    const { memory, registers, disableInterrupts } = this;
    const ifByte = memory.rd(M_HARDWARE_REGISTERS.IF);
    const ieByte = memory.rd(M_HARDWARE_REGISTERS.IE);
    const interruptAddresses = [
      0x40, // VBlank
      0x48, // STAT
      0x50, // Timer
      0x58, // Serial
      0x60, // Joypad
    ];
    for (let i = 0; i < 5; i++) {
      const iSelect = 1 << i;
      const handleInterrupt = ifByte & ieByte & iSelect ? 1 : 0;
      if (!handleInterrupt) {
        continue;
      }
      // console.warn(
      //   `>> handling interrupt ${i}`,
      //   ifByte.toString(2),
      //   ieByte.toString(2),
      //   iSelect.toString(2)
      // );
      // if (i > 2) {
      //   console.warn(`Interrupt ${INTERRUPT_TO_NAME[i]}`);
      // }
      this.is_halt = false; // NOTE: remove halt
      const deselectMask = 0xff - iSelect;
      const newIfByte = ifByte & deselectMask;
      memory.wr(M_HARDWARE_REGISTERS.IF, newIfByte);
      disableInterrupts();
      _PUSH_PC(this);
      registers.PC = interruptAddresses[i];
      this._updateCycles(4);
      return true;
    }
    return false;
  }
  onJoypadRead_() {
    let joyp = this.memory.data[M_HARDWARE_REGISTERS.P1_JOIP];
    // joyp &= 0x3f;
    joyp |= 0xcf;
    if ((joyp & (1 << 5)) === 0) {
      if (this.joypadButtons.start) joyp -= 1 << 3;
      if (this.joypadButtons.select) joyp -= 1 << 2;
      if (this.joypadButtons.b) joyp -= 1 << 1;
      if (this.joypadButtons.a) joyp -= 1 << 0;
    } else if ((joyp & (1 << 4)) === 0) {
      if (this.joypadButtons.down) joyp -= 1 << 3;
      if (this.joypadButtons.up) joyp -= 1 << 2;
      if (this.joypadButtons.left) joyp -= 1 << 1;
      if (this.joypadButtons.right) joyp -= 1 << 0;
    }
    this.memory.data[M_HARDWARE_REGISTERS.P1_JOIP] = joyp;
    return joyp;
  }
  updateJoypad(buttons) {
    this.joypadButtons = buttons;
    this.requestInterrupt_(M_INTERRUPTS.Joypad);
  }
}
