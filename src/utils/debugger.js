import { M_HARDWARE_REGISTERS, M_INTERRUPTS } from "../constants/registers.js";
import {
  parseIE,
  parseJOYP,
  parseLCDC,
  parseSTAT,
  parseTAC,
} from "../constants/lcd.js";
import { getSigned, toHexStr } from "./bit_utils.js";
import {
  drawBGWindow,
  drawTileData,
  drawTileMap,
  formatStack,
} from "./debug.js";
import { parseOAM, readTileData, readTileMap } from "./graphics_utils.js";

function fregs(registers, verbose = false) {
  const parts = [];
  Object.keys(registers).forEach((name) => {
    const val = registers[name];
    let repr = `${name}: ${toHexStr(val)}`;
    if (verbose) {
      if (name === "F") {
        const z = val & (1 << 7) ? 1 : 0;
        const n = val & (1 << 6) ? 1 : 0;
        const h = val & (1 << 5) ? 1 : 0;
        const c = val & (1 << 4) ? 1 : 0;
        repr += ` z${z} n${n} h${h} c${c}`;
      } else if (name === "PC") {
        repr += ` (${val})`;
      }
    }

    parts.push(repr);
  });
  return parts;
}

export class JDebugger {
  constructor(engine, lcanvas = null, ppuCanvas = null) {
    this.engine = engine;
    this.lcanvas = lcanvas;
    this.ppuCanvas = ppuCanvas;
    this.breakpoints = {
      // 0x0003: "Zero VRAM",
      // 0x000c: "Setup Audio",
      // 0x001d: "Setup BG palette",
      // 0x0021: "Convert and load logo data from cart into Video RAM",
      // 0x0024: "BG TD",
      // 0x002e: "----",
      // 0x0034: "Load 8 additional bytes into Video RAM",
      // 0x0040: "Setup background tilemap",
      // 0x0055: "Initialize scroll count, H=0",
      // 0x0058: "set loop count, D=$64",
      // 0x0059: "Set vertical scroll register",
      // 0x005d: "Turn on LCD, showing Background",
      // 0x005f: "Set B=1",
      // 0x0064: "wait for screen frame",
      // 0x0072: "increment scroll count",
      // 0x0076: "$62 counts in, play sound #1",
      // 0x007e: "$64 counts in, play sound #2",
      // 0x0080: "play sound",
      // 0x0089: "scroll logo up if B=1",
      // 0x008e: "set B=0 first time",
      // 0x008f: "... next time, cause jump to Nintendo Logo check",
      // 0x0091: "use scrolling loop to pause",
      // 0x0095: "Double up all the bits of the graphics data",
      // 0x0096: "and store in Video RAM",
      //   0x0098: "push",
      // 0x00a7: "RET",
      // 0x00e0: "point HL to Nintendo logo in cart",
      // 0x00e3: "point DE to Nintendo logo in DMG rom",
      // 0x00e8: "compare logo data in cart to DMG rom",
      // 0x00e9: "if not a match, lock up here",
      // 0x00ed: "do this for $30 bytes",
      // 0x00fa: "if $19 + bytes from $0134-$014D  don't add to $00 lock up",
      // 0x00fe: "turn off DMG rom",
      0x0100: "ROM START",
      0x01e2: "Halt",
      0x01e5: "jump back to halt",
      0x01e7: "After halt",
      0x01e9: "CALL 0423",
      0x01ec: "CALL 0338",
      0x01ef: "CALL FF80",

      0x0423: "JOYP Setup",
    };
    this.pc2ins = {};
    this.events = [];

    this.init();
  }
  init() {
    this.engine.setLCanvas(this.ppuCanvas);
  }
  step() {
    if (this.engine.is_halt) {
      const vblank = this.engine._updateCycles(4);
      this.engine.checkInterrupts();
      return vblank;
    }
    // const pc = this.engine.registers.PC;
    const { nextPC, ins, args, data } = this.engine._fetchNextInstruction();
    // const format = ins.format(data, args);
    // this.pc2ins[pc] = format;

    const vblank = this.engine._executeInstruction({ nextPC, ins, args, data });
    this.engine.checkInterrupts();
    return vblank;
  }
  step_old() {
    const pc = this.engine.registers.PC;
    const { nextPC, ins, args, data } = this.engine._fetchNextInstruction();
    const format = ins.format(data, args);
    this.pc2ins[pc] = format;

    this.engine._executeInstruction({ nextPC, ins, args, data });
  }
  // render() {
  //   const dots = this.engine.cycles;
  // }
  // show() {
  //   // const registers = formatRegisters(this.engine.registers);
  //   const stack = formatStack(this.engine.registers, this.engine.memory);
  //   return { registers, stack };
  // }
  // console
  s() {
    this.step();
    const pc = this.engine.registers.PC;
    this.f();
    if (this.breakpoints[pc]) {
      console.log(`bp: ${toHexStr(pc)} : ${this.breakpoints[pc]}`);
    }
  }
  c(limit = 10000000, noBreak = false) {
    let i = 0;
    const intpt = this.step();
    while (i < limit - 1 && !this.engine.is_halt) {
      const pc = this.engine.registers.PC;
      if (this.breakpoints[pc]) {
        console.log(`bp: ${toHexStr(pc)} : ${this.breakpoints[pc]}`);
        if (!noBreak) {
          break;
        }
      }
      this.step();
      i++;
    }
    return i;
  }
  r() {
    const { registers } = this.engine;
    const parts = fregs(registers, true);

    // Object.keys(registers).forEach((name) => {
    //   const val = registers[name];
    //   let repr = `${name}: ${toHexStr(val)}`;
    //   if (name === "F") {
    //     const z = val & (1 << 7) ? 1 : 0;
    //     const n = val & (1 << 6) ? 1 : 0;
    //     const h = val & (1 << 5) ? 1 : 0;
    //     const c = val & (1 << 4) ? 1 : 0;
    //     repr += ` z${z} n${n} h${h} c${c}`;
    //   } else if (name === "PC") {
    //     repr += ` (${val})`;
    //   }

    //   parts.push(repr);
    // });
    console.log(parts.join("\n"));
  }
  l() {
    const pc = this.engine.registers.PC;
    const { nextPC, ins, args, data } = this.engine._fetchNextInstruction();
    const format = ins.format(data, args);
    console.log(`${toHexStr(pc)}: ${format}`);
  }
  m(addr, w = 1) {
    const minAddr = Math.max(0, addr - w);
    const maxAddr = Math.min(0xffff, addr + w);
    const parts = [];
    const len = maxAddr - minAddr + 1;
    for (let i = 0; i < len; i++) {
      const a = minAddr + i;
      const b = this.engine.memory.rd(a);
      parts.push(
        `${toHexStr(a)}: ${toHexStr(b)} (0b${b.toString(
          2
        )}) (${b}) s(${getSigned(b)})`
      );
    }
    console.log(parts.join("\n"));
  }
  f(len = 3, addr = null) {
    const { registers } = this.engine;
    const rparts = fregs(registers);

    const parts = [];
    const prevPC = registers.PC;
    if (addr !== null) {
      registers.PC = addr;
    }
    try {
      for (let i = 0; i < len; i++) {
        const { nextPC, ins, args, data } = this.engine._fetchNextInstruction();
        const format = ins.format(data, args);
        parts.push(`${toHexStr(registers.PC)}: ${format}`);
        registers.PC = nextPC;
      }
    } catch (e) {
      console.error(e);
    }
    registers.PC = prevPC;
    console.log(rparts.join(", ") + "\n" + parts.join("\n"));
  }
  st() {
    const { registers, memory } = this.engine;
    const stack = formatStack(registers, memory);
    console.log(stack.valid ? stack.stack.join("|") : "invalid");
  }
  abp(bp, name = "bp") {
    this.breakpoints[bp] = name;
  }
  rbp(bp) {
    this.breakpoints[bp] = null;
  }
  lbp() {
    const parts = [];
    Object.keys(this.breakpoints).forEach((addr) => {
      if (this.breakpoints[addr]) {
        parts.push(`${toHexStr(addr)}: ${this.breakpoints[addr]}`);
      }
    });
    console.log(parts.join("\n"));
  }
  hwr() {
    const { memory } = this.engine;
    const lcdcByte = memory.rd(M_HARDWARE_REGISTERS.LCDC);
    const lcdc = parseLCDC(lcdcByte);
    const bgbByte = memory.rd(M_HARDWARE_REGISTERS.BGP);
    const bgb = parseTAC(bgbByte);
    const scy = memory.rd(M_HARDWARE_REGISTERS.SCY);
    const scx = memory.rd(M_HARDWARE_REGISTERS.SCX);
    const wy = memory.rd(M_HARDWARE_REGISTERS.WY);
    const wx = memory.rd(M_HARDWARE_REGISTERS.WX);

    const statByte = memory.rd(M_HARDWARE_REGISTERS.STAT);
    const stat = parseSTAT(statByte);

    const joypByte = memory.rd(M_HARDWARE_REGISTERS.P1_JOIP);
    const joyp = parseJOYP(joypByte);
    const tacByte = memory.rd(M_HARDWARE_REGISTERS.TAC);
    const tac = parseTAC(tacByte);
    const div = memory.rd(M_HARDWARE_REGISTERS.DIV);

    const ieByte = memory.rd(M_HARDWARE_REGISTERS.IE);
    const ifByte = memory.rd(M_HARDWARE_REGISTERS.IF);
    const ie = parseIE(ieByte);
    const if_ = parseIE(ifByte);

    const res = { lcdc, bgb, scy, scx, wy, wx, stat, joyp, tac, div, ie, if_ };
    return res;
  }
  td(lcdc4 = null) {
    const { memory } = this.engine;
    if (lcdc4 === null) {
      const lcdcByte = memory.rd(M_HARDWARE_REGISTERS.LCDC);
      lcdc4 = lcdcByte & (1 << 4) ? 1 : 0;
      console.log("lcdc4:", lcdc4);
    }
    // tile data
    const tileData = readTileData(memory, lcdc4);
    if (this.lcanvas) {
      drawTileData(
        tileData,
        this.lcanvas,
        this.lcanvas.width,
        this.lcanvas.height
      );
    }
    return tileData;
  }
  tm(lcdc4 = null, lcdc3 = null) {
    const { memory } = this.engine;
    const lcdcByte = memory.rd(M_HARDWARE_REGISTERS.LCDC);
    if (lcdc4 === null) {
      lcdc4 = lcdcByte & (1 << 4) ? 1 : 0;
    }
    if (lcdc3 === null) {
      lcdc3 = lcdcByte & (1 << 3) ? 1 : 0;
    }
    // tile data
    const tileData = readTileData(memory, lcdc4);
    const tileMap = readTileMap(memory, lcdc3);
    if (this.lcanvas) {
      drawTileMap(this.lcanvas, tileData, tileMap);
    }
    return tileMap;
    // const { memory } = this.engine;
    // const lcdcByte = memory.rd(M_HARDWARE_REGISTERS.LCDC);
    // if (lcdc4 === null) {
    //   lcdc4 = lcdcByte & (1 << 4) ? 1 : 0;
    // }
    // if (lcdc3 === null) {
    //   lcdc3 = lcdcByte & (1 << 3) ? 1 : 0;
    // }
    // const tileData = readTileData(memory, lcdc4);
    // const tileMap = readTileMap(memory, lcdc3);
    // if (this.lcanvas) {
    //   drawTileMap(
    //     this.lcanvas,
    //     tileData,
    //     tileMap,
    //   );
    // }
    // return tileMap;
  }
  oam() {
    const { memory } = this.engine;
    const oam = parseOAM(memory);
    return oam;
  }
  w() {
    // draw window (wy,wx)
    // draw bg viewport (SCY,SCX-7)
    const { memory } = this.engine;
    const scy = memory.rd(M_HARDWARE_REGISTERS.SCY);
    const scx = memory.rd(M_HARDWARE_REGISTERS.SCX);
    const wy = memory.rd(M_HARDWARE_REGISTERS.WY);
    const wx = memory.rd(M_HARDWARE_REGISTERS.WX);
    drawBGWindow(this.lcanvas, scy, scx - 7, "lime");
    drawBGWindow(this.lcanvas, wy, wx, "red");
  }
  joyp(btns) {
    this.engine.updateJoypad(btns);
    //this.engine.requestInterrupt(M_INTERRUPTS.Joypad);
  }
}
