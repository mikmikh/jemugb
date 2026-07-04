import {
  makeWord,
  toHexStr,
  word2nibbles,
  getSigned,
} from "../utils/bit_utils.js";

export const INSTRUCTION_DATA = [
  {
    name: "LD r8 n8",
    len: 2,
    cycles: 2,
    args: 1,
    opcodes: {
      0x06: "B",
      0x16: "D",
      0x26: "H",
      0x0e: "C",
      0x1e: "E",
      0x2e: "L",
      0x3e: "A",
    },
    format: (data, args) => `LD ${data[0]} ${toHexStr(args[0])}`,
    exec: (data, args, ctx) => {
      const { registers } = ctx;
      registers[data] = args[0];
    },
  },
  {
    name: "LD r8 r8",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x40: ["B", "B"],
      0x50: ["D", "B"],
      0x60: ["H", "B"],
      0x41: ["B", "C"],
      0x51: ["D", "C"],
      0x61: ["H", "C"],
      0x42: ["B", "D"],
      0x52: ["D", "D"],
      0x62: ["H", "D"],
      0x43: ["B", "E"],
      0x53: ["D", "E"],
      0x63: ["H", "E"],
      0x44: ["B", "H"],
      0x54: ["D", "H"],
      0x64: ["H", "H"],
      0x45: ["B", "L"],
      0x55: ["D", "L"],
      0x65: ["H", "L"],
      0x47: ["B", "A"],
      0x57: ["D", "A"],
      0x67: ["H", "A"],
      0x48: ["C", "B"],
      0x58: ["E", "B"],
      0x68: ["L", "B"],
      0x78: ["A", "B"],
      0x49: ["C", "C"],
      0x59: ["E", "C"],
      0x69: ["L", "C"],
      0x79: ["A", "C"],
      0x4a: ["C", "D"],
      0x5a: ["E", "D"],
      0x6a: ["L", "D"],
      0x7a: ["A", "D"],
      0x4b: ["C", "E"],
      0x5b: ["E", "E"],
      0x6b: ["L", "E"],
      0x7b: ["A", "E"],
      0x4c: ["C", "H"],
      0x5c: ["E", "H"],
      0x6c: ["L", "H"],
      0x7c: ["A", "H"],
      0x4d: ["C", "L"],
      0x5d: ["E", "L"],
      0x6d: ["L", "L"],
      0x7d: ["A", "L"],
      0x4f: ["C", "A"],
      0x5f: ["E", "A"],
      0x6f: ["L", "A"],
      0x7f: ["A", "A"],
    },
    format: (data, args) => `LD ${data[0]} ${data[1]}`,
    exec: (data, args, ctx) => {
      const { registers } = ctx;
      const [r1, r2] = data;
      registers[r1] = registers[r2];
    },
  },
  {
    name: "LD r16 n16",
    len: 3,
    cycles: 3,
    args: 2,
    opcodes: {
      0x01: ["B", "C"],
      0x11: ["D", "E"],
      0x21: ["H", "L"],
      0x31: ["S", "P"],
    },
    format: (data, args) =>
      `LD ${data[0]}${data[1]} ${toHexStr(makeWord(args[1], args[0]))}`,
    exec: (data, args, ctx) => {
      const { registers } = ctx;
      const [r1, r2] = data;
      if (r1 === "S" && r2 === "P") {
        registers.SP = makeWord(args[1], args[0]);
        return;
      }
      registers[r1] = args[1];
      registers[r2] = args[0];
    },
  },
  {
    name: "LD (HL) r8",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x70: "B",
      0x71: "C",
      0x72: "D",
      0x73: "E",
      0x74: "H",
      0x75: "L",
      0x77: "A",
    },
    format: (data, args) => `LD (HL) ${data}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, registers[data]);
    },
  },
  {
    name: "LD r8 (HL)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x46: "B",
      0x56: "D",
      0x66: "H",
      0x4e: "C",
      0x5e: "E",
      0x6e: "L",
      0x7e: "A",
    },
    format: (data, args) => `LD ${data} (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      registers[data] = memory.rd(addr);
    },
  },
  {
    name: "LD (HL) d8",
    len: 2,
    cycles: 3,
    args: 1,
    opcodes: {
      0x36: "",
    },
    format: (data, args) => `LD (HL) ${toHexStr(args[0])}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, args[0]);
    },
  },
  {
    name: "LD (r16) A",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x02: ["B", "C"],
      0x12: ["D", "E"],
    },
    format: (data, args) => `LD (${data[0]}${data[1]}) A`,
    exec: (data, args, ctx) => {
      const [r1, r2] = data;
      const { registers, memory } = ctx;
      const addr = makeWord(registers[r1], registers[r2]);
      memory.wr(addr, registers.A);
    },
  },
  {
    name: "LD A (r16)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x0a: ["B", "C"],
      0x1a: ["D", "E"],
    },
    format: (data, args) => `LD A (${data[0]}${data[1]})`,
    exec: (data, args, ctx) => {
      const [r1, r2] = data;
      const { registers, memory } = ctx;
      const addr = makeWord(registers[r1], registers[r2]);
      registers.A = memory.rd(addr);
    },
  },
  {
    name: "LD (HL+-) A",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x22: 1,
      0x32: -1,
    },
    format: (data, args) => `LD (HL${data === 1 ? "+" : "-"}) A`,
    exec: (data, args, ctx) => {
      const inc = data;
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, registers.A);
      const addri = (addr + inc) & 0xffff;
      [registers.H, registers.L] = word2nibbles(addri);
    },
  },
  {
    name: "LD A (HL+-)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x2a: 1,
      0x3a: -1,
    },
    format: (data, args) => `LD A (HL${data === 1 ? "+" : "-"})`,
    exec: (data, args, ctx) => {
      const inc = data;
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      registers.A = memory.rd(addr);
      const addri = (addr + inc) & 0xffff;
      [registers.H, registers.L] = word2nibbles(addri);
    },
  },
  {
    name: "LD (a8) A",
    len: 2,
    cycles: 3,
    args: 1,
    opcodes: {
      0xe0: "",
    },
    format: (data, args) => `LD (${toHexStr(args[0])}+0xFF00) A`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = args[0] + 0xff00;
      memory.wr(addr, registers.A);
    },
  },
  {
    name: "LD A (a8)",
    len: 2,
    cycles: 3,
    args: 1,
    opcodes: {
      0xf0: "",
    },
    format: (data, args) => `LD A (${toHexStr(args[0])}+0xFF00)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = args[0] + 0xff00;
      registers.A = memory.rd(addr);
    },
  },
  {
    name: "LD (C) A",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0xe2: "",
    },
    format: (data, args) => `LD (0xFF00+C) A`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = registers.C + 0xff00;
      memory.wr(addr, registers.A);
    },
  },
  {
    name: "LD A (C)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0xf2: "",
    },
    format: (data, args) => `LD A (C)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = registers.C + 0xff00;
      registers.A = memory.rd(addr);
    },
  },
  {
    name: "LD (a16) A",
    len: 3,
    cycles: 4,
    args: 2,
    opcodes: {
      0xea: "",
    },
    format: (data, args) => `LD (${toHexStr(makeWord(args[1], args[0]))}) A`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(args[1], args[0]);
      memory.wr(addr, registers.A);
    },
  },
  {
    name: "LD A (a16)",
    len: 3,
    cycles: 4,
    args: 2,
    opcodes: {
      0xfa: "",
    },
    format: (data, args) => `LD A (${toHexStr(makeWord(args[1], args[0]))})`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(args[1], args[0]);
      registers.A = memory.rd(addr);
    },
  },
  {
    name: "LD (a16) SP",
    len: 3,
    cycles: 5,
    args: 2,
    opcodes: {
      0x08: "",
    },
    format: (data, args) => `LD (${toHexStr(makeWord(args[1], args[0]))}) SP`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(args[1], args[0]);
      const [n1, n2] = word2nibbles(registers.SP);
      memory.wr(addr, n2);
      memory.wr(addr + 1, n1);
    },
  },
  {
    name: "LD HL SP+s8",
    len: 2,
    cycles: 3,
    args: 1,
    opcodes: {
      0xf8: "",
    },
    format: (data, args) =>
      `LD HL SP+${toHexStr(args[0])} (${getSigned(args[0])})`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const value = _ADD_SP_s8(args[0], ctx);
      registers.H = (value >> 8) & 0xff;
      registers.L = value & 0xff;
    },
  },
  {
    name: "LD SP HL",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0xf9: "",
    },
    format: (data, args) => `LD SP HL`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      registers.SP = makeWord(registers.H, registers.L);
    },
  },
  {
    name: "ADD SP s8",
    len: 2,
    cycles: 4,
    args: 1,
    opcodes: {
      0xe8: "",
    },
    format: (data, args) =>
      `ADD SP ${toHexStr(args[0])} (${getSigned(args[0])})`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      registers.SP = _ADD_SP_s8(args[0], ctx);
    },
  },

  {
    name: "INC r8",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x04: "B",
      0x14: "D",
      0x24: "H",
      0x0c: "C",
      0x1c: "E",
      0x2c: "L",
      0x3c: "A",
    },
    format: (data, args) => `INC ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      const h = ((registers[r] & 0xf) + 1) & 0x10;
      registers[r] = (registers[r] + 1) & 0xff;
      const z = registers[r] === 0;
      registers.F &= 0x10; // n = 0
      if (h) {
        registers.F |= 0x20;
      }
      if (z) {
        registers.F |= 0x80;
      }
    },
  },
  {
    name: "DEC r8",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x05: "B",
      0x15: "D",
      0x25: "H",
      0x0d: "C",
      0x1d: "E",
      0x2d: "L",
      0x3d: "A",
    },
    format: (data, args) => `DEC ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      const h = (registers[r] & 0xf) < 1;
      registers[r] = (registers[r] - 1) & 0xff;
      const z = registers[r] === 0;
      registers.F &= 0x10;
      if (h) {
        registers.F |= 0x20;
      }
      if (z) {
        registers.F |= 0x80;
      }
      registers.F |= 0x40;
    },
  },
  {
    name: "INC r16",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x03: ["B", "C"],
      0x13: ["D", "E"],
      0x23: ["H", "L"],
      0x33: ["S", "P"],
    },
    format: (data, args) => `INC ${data[0]}${data[1]}`,
    exec: (data, args, ctx) => {
      const [r1, r2] = data;
      const { registers } = ctx;
      if (r1 === "S" && r2 === "P") {
        registers.SP = (registers.SP + 1) & 0xffff;
        return;
      }
      const w = makeWord(registers[r1], registers[r2]);
      const wi = (w + 1) & 0xffff;
      const [r1i, r2i] = word2nibbles(wi);
      registers[r1] = r1i;
      registers[r2] = r2i;
    },
  },
  {
    name: "DEC r16",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x0b: ["B", "C"],
      0x1b: ["D", "E"],
      0x2b: ["H", "L"],
      0x3b: ["S", "P"],
    },
    format: (data, args) => `DEC ${data[0]}${data[1]}`,
    exec: (data, args, ctx) => {
      const [r1, r2] = data;
      const { registers } = ctx;
      if (r1 === "S" && r2 === "P") {
        registers.SP = (registers.SP - 1) & 0xffff;
        return;
      }
      const w = makeWord(registers[r1], registers[r2]);
      const wi = (w - 1) & 0xffff;
      const [r1i, r2i] = word2nibbles(wi);
      registers[r1] = r1i;
      registers[r2] = r2i;
    },
  },
  {
    name: "INC (HL)",
    len: 1,
    cycles: 3,
    args: 0,
    opcodes: {
      0x34: "",
    },
    format: (data, args) => `INC (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      const value = memory.rd(addr);
      const ivalue = (value + 1) & 0xff;
      // const value = (memory.rd(addr) + 1) & 0xffff;
      const z = ivalue === 0;
      const h = (value & 0xf) + 1 > 0xf;
      memory.wr(addr, ivalue);
      registers.F &= 0x10; // n = 0
      if (h) {
        registers.F |= 0x20;
      }
      if (z) {
        registers.F |= 0x80;
      }
    },
  },
  {
    name: "DEC (HL)",
    len: 1,
    cycles: 3,
    args: 0,
    opcodes: {
      0x35: "",
    },
    format: (data, args) => `DEC (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      const value = (memory.rd(addr) - 1) & 0xffff;
      const z = value === 0;
      const h = (memory.rd(addr) & 0xf) < 1;
      memory.wr(addr, value);
      registers.F &= 0x10;
      if (h) {
        registers.F |= 0x20;
      }
      if (z) {
        registers.F |= 0x80;
      }
      registers.F |= 0x40;
    },
  },
  {
    name: "ADD A r8",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x80: "B",
      0x81: "C",
      0x82: "D",
      0x83: "E",
      0x84: "H",
      0x85: "L",
      0x87: "A",
    },
    format: (data, args) => `ADD A ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      const n = registers[r];
      _ADD_A_n(n, ctx);
    },
  },
  {
    name: "ADD A (HL)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x86: "",
    },
    format: (data, args) => `ADD A (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      const n = memory.rd(addr);
      _ADD_A_n(n, ctx);
    },
  },
  {
    name: "ADD A d8",
    len: 2,
    cycles: 2,
    args: 1,
    opcodes: {
      0xc6: "",
    },
    format: (data, args) => `ADD A ${toHexStr(args[0])}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const n = args[0];
      _ADD_A_n(n, ctx);
    },
  },
  {
    name: "ADC A r8",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x88: "B",
      0x89: "C",
      0x8a: "D",
      0x8b: "E",
      0x8c: "H",
      0x8d: "L",
      0x8f: "A",
    },
    format: (data, args) => `ADC A ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      const n = registers[r];
      _ADC_A_n(n, ctx);
    },
  },
  {
    name: "ADC A (HL)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x8e: "",
    },
    format: (data, args) => `ADC A (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      const n = memory.rd(addr);
      _ADC_A_n(n, ctx);
    },
  },
  {
    name: "ADC A d8",
    len: 2,
    cycles: 2,
    args: 1,
    opcodes: {
      0xce: "",
    },
    format: (data, args) => `ADC A ${toHexStr(args[0])}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const n = args[0];
      _ADC_A_n(n, ctx);
    },
  },
  {
    name: "SUB A r8",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x90: "B",
      0x91: "C",
      0x92: "D",
      0x93: "E",
      0x94: "H",
      0x95: "L",
      0x97: "A",
    },
    format: (data, args) => `SUB A ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      const n = registers[r];
      _SUB_n(n, ctx);
    },
  },
  {
    name: "SUB A (HL)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x96: "",
    },
    format: (data, args) => `SUB A (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      const n = memory.rd(addr);
      _SUB_n(n, ctx);
    },
  },
  {
    name: "SUB A d8",
    len: 2,
    cycles: 2,
    args: 1,
    opcodes: {
      0xd6: "",
    },
    format: (data, args) => `SUB A ${toHexStr(args[0])}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const n = args[0];
      _SUB_n(n, ctx);
    },
  },
  {
    name: "SBC A r8",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x98: "B",
      0x99: "C",
      0x9a: "D",
      0x9b: "E",
      0x9c: "H",
      0x9d: "L",
      0x9f: "A",
    },
    format: (data, args) => `SBC A ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      const n = registers[r];
      _SBC_A_n(n, ctx);
    },
  },
  {
    name: "SBC A (HL)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x9e: "",
    },
    format: (data, args) => `SBC A (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      const n = memory.rd(addr);
      _SBC_A_n(n, ctx);
    },
  },
  {
    name: "SBC A d8",
    len: 2,
    cycles: 2,
    args: 1,
    opcodes: {
      0xde: "",
    },
    format: (data, args) => `SBC A ${toHexStr(args[0])}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const n = args[0];
      _SBC_A_n(n, ctx);
    },
  },
  {
    name: "ADD HL r16",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0x09: ["B", "C"],
      0x19: ["D", "E"],
      0x29: ["H", "L"],
      0x39: ["S", "P"],
    },
    format: (data, args) => `ADD HL ${data[0]}${data[1]}`,
    exec: (data, args, ctx) => {
      const [r1, r2] = data;
      const { registers } = ctx;
      if (r1 === "S" && r2 === "P") {
        _ADD_HL_nn(registers.SP, ctx);
      } else {
        const n = makeWord(registers[r1], registers[r2]);
        _ADD_HL_nn(n, ctx);
      }
    },
  },
  {
    name: "OR r8",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0xb0: "B",
      0xb1: "C",
      0xb2: "D",
      0xb3: "E",
      0xb4: "H",
      0xb5: "L",
      0xb7: "A",
    },
    format: (data, args) => `OR ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      const n = registers[r];
      _OR_n(n, ctx);
    },
  },
  {
    name: "OR (HL)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0xb6: "",
    },
    format: (data, args) => `OR (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      const n = memory.rd(addr);
      _OR_n(n, ctx);
    },
  },
  {
    name: "OR d8",
    len: 2,
    cycles: 2,
    args: 1,
    opcodes: {
      0xf6: "",
    },
    format: (data, args) => `OR ${toHexStr(args[0])}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const n = args[0];
      _OR_n(n, ctx);
    },
  },
  {
    name: "AND r8",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0xa0: "B",
      0xa1: "C",
      0xa2: "D",
      0xa3: "E",
      0xa4: "H",
      0xa5: "L",
      0xa7: "A",
    },
    format: (data, args) => `AND ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      const n = registers[r];
      _AND_n(n, ctx);
    },
  },
  {
    name: "AND (HL)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0xa6: "",
    },
    format: (data, args) => `AND ${data}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      const n = memory.rd(addr);
      _AND_n(n, ctx);
    },
  },
  {
    name: "AND d8",
    len: 2,
    cycles: 2,
    args: 1,
    opcodes: {
      0xe6: "",
    },
    format: (data, args) => `AND ${toHexStr(args[0])}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const n = args[0];
      _AND_n(n, ctx);
    },
  },
  {
    name: "XOR r8",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0xa8: "B",
      0xa9: "C",
      0xaa: "D",
      0xab: "E",
      0xac: "H",
      0xad: "L",
      0xaf: "A",
    },
    format: (data, args) => `XOR ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      const n = registers[r];
      _XOR_n(n, ctx);
    },
  },
  {
    name: "XOR (HL)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0xae: "",
    },
    format: (data, args) => `XOR (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      const n = memory.rd(addr);
      _XOR_n(n, ctx);
    },
  },
  {
    name: "XOR d8",
    len: 2,
    cycles: 2,
    args: 1,
    opcodes: {
      0xee: "",
    },
    format: (data, args) => `XOR ${toHexStr(args[0])}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const n = args[0];
      _XOR_n(n, ctx);
    },
  },
  {
    name: "CP r8",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0xb8: "B",
      0xb9: "C",
      0xba: "D",
      0xbb: "E",
      0xbc: "H",
      0xbd: "L",
      0xbf: "A",
    },
    format: (data, args) => `CP ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      const n = registers[r];
      _CP_n(n, ctx);
    },
  },
  {
    name: "CP (HL)",
    len: 1,
    cycles: 2,
    args: 0,
    opcodes: {
      0xbe: "",
    },
    format: (data, args) => `CP (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      const n = memory.rd(addr);
      _CP_n(n, ctx);
    },
  },
  {
    name: "CP d8",
    len: 2,
    cycles: 2,
    args: 1,
    opcodes: {
      0xfe: "",
    },
    format: (data, args) => `CP ${toHexStr(args[0])}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const n = args[0];
      _CP_n(n, ctx);
    },
  },
  // ===================================
  // ============= 16 BIT =============
  // ===================================
  {
    cb: true,
    name: "RRC r8",
    len: 2,
    cycles: 2,
    args: 0,
    opcodes: {
      0x08: "B",
      0x09: "C",
      0x0a: "D",
      0x0b: "E",
      0x0c: "H",
      0x0d: "L",
      0x0f: "A",
    },
    format: (data, args) => `RRC ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      registers[r] = _RRC_n(registers[r], ctx);
    },
  },
  {
    cb: true,
    name: "RRC (HL)",
    len: 2,
    cycles: 4,
    args: 0,
    opcodes: {
      0x0e: "",
    },
    format: (data, args) => `RRC (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, _RRC_n(memory.rd(addr), ctx));
    },
  },
  {
    cb: true,
    name: "RLC r8",
    len: 2,
    cycles: 2,
    args: 0,
    opcodes: {
      0x00: "B",
      0x01: "C",
      0x02: "D",
      0x03: "E",
      0x04: "H",
      0x05: "L",
      0x07: "A",
    },
    format: (data, args) => `RLC ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      registers[r] = _RLC_n(registers[r], ctx);
    },
  },
  {
    cb: true,
    name: "RLC (HL)",
    len: 2,
    cycles: 4,
    args: 0,
    opcodes: {
      0x06: "",
    },
    format: (data, args) => `RLC (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, _RLC_n(memory.rd(addr), ctx));
    },
  },
  {
    cb: true,
    name: "RR r8",
    len: 2,
    cycles: 2,
    args: 0,
    opcodes: {
      0x18: "B",
      0x19: "C",
      0x1a: "D",
      0x1b: "E",
      0x1c: "H",
      0x1d: "L",
      0x1f: "A",
    },
    format: (data, args) => `RR ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      registers[r] = _RR_n(registers[r], ctx);
    },
  },
  {
    cb: true,
    name: "RR (HL)",
    len: 2,
    cycles: 4,
    args: 0,
    opcodes: {
      0x1e: "",
    },
    format: (data, args) => `RR (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, _RR_n(memory.rd(addr), ctx));
    },
  },
  {
    cb: true,
    name: "RL r8",
    len: 2,
    cycles: 2,
    args: 0,
    opcodes: {
      0x10: "B",
      0x11: "C",
      0x12: "D",
      0x13: "E",
      0x14: "H",
      0x15: "L",
      0x17: "A",
    },
    format: (data, args) => `RL ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      registers[r] = _RL_n(registers[r], ctx);
    },
  },
  {
    cb: true,
    name: "RL (HL)",
    len: 2,
    cycles: 4,
    args: 0,
    opcodes: {
      0x16: "",
    },
    format: (data, args) => `RL (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, _RL_n(memory.rd(addr), ctx));
    },
  },
  {
    cb: true,
    name: "SRA r8",
    len: 2,
    cycles: 2,
    args: 0,
    opcodes: {
      0x28: "B",
      0x29: "C",
      0x2a: "D",
      0x2b: "E",
      0x2c: "H",
      0x2d: "L",
      0x2f: "A",
    },
    format: (data, args) => `SRA ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      registers[r] = _SRA_n(registers[r], ctx);
    },
  },
  {
    cb: true,
    name: "SRA (HL)",
    len: 2,
    cycles: 4,
    args: 0,
    opcodes: {
      0x2e: "",
    },
    format: (data, args) => `SRA (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, _SRA_n(memory.rd(addr), ctx));
    },
  },
  {
    cb: true,
    name: "SRL r8",
    len: 2,
    cycles: 2,
    args: 0,
    opcodes: {
      0x38: "B",
      0x39: "C",
      0x3a: "D",
      0x3b: "E",
      0x3c: "H",
      0x3d: "L",
      0x3f: "A",
    },
    format: (data, args) => `SRL ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      registers[r] = _SRL_n(registers[r], ctx);
    },
  },
  {
    cb: true,
    name: "SRL (HL)",
    len: 2,
    cycles: 4,
    args: 0,
    opcodes: {
      0x3e: "",
    },
    format: (data, args) => `SRL (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, _SRL_n(memory.rd(addr), ctx));
    },
  },
  {
    cb: true,
    name: "SLA r8",
    len: 2,
    cycles: 2,
    args: 0,
    opcodes: {
      0x20: "B",
      0x21: "C",
      0x22: "D",
      0x23: "E",
      0x24: "H",
      0x25: "L",
      0x27: "A",
    },
    format: (data, args) => `SLA ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      registers[r] = _SLA_n(registers[r], ctx);
    },
  },
  {
    cb: true,
    name: "SLA (HL)",
    len: 2,
    cycles: 4,
    args: 0,
    opcodes: {
      0x26: "",
    },
    format: (data, args) => `SLA (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, _SLA_n(memory.rd(addr), ctx));
    },
  },
  {
    cb: true,
    name: "BIT i r8",
    len: 2,
    cycles: 2,
    args: 0,
    opcodes: {
      0x40: [0, "B"],
      0x41: [0, "C"],
      0x42: [0, "D"],
      0x43: [0, "E"],
      0x44: [0, "H"],
      0x45: [0, "L"],
      0x47: [0, "A"],

      0x48: [1, "B"],
      0x49: [1, "C"],
      0x4a: [1, "D"],
      0x4b: [1, "E"],
      0x4c: [1, "H"],
      0x4d: [1, "L"],
      0x4f: [1, "A"],

      0x50: [2, "B"],
      0x51: [2, "C"],
      0x52: [2, "D"],
      0x53: [2, "E"],
      0x54: [2, "H"],
      0x55: [2, "L"],
      0x57: [2, "A"],

      0x58: [3, "B"],
      0x59: [3, "C"],
      0x5a: [3, "D"],
      0x5b: [3, "E"],
      0x5c: [3, "H"],
      0x5d: [3, "L"],
      0x5f: [3, "A"],

      0x60: [4, "B"],
      0x61: [4, "C"],
      0x62: [4, "D"],
      0x63: [4, "E"],
      0x64: [4, "H"],
      0x65: [4, "L"],
      0x67: [4, "A"],

      0x68: [5, "B"],
      0x69: [5, "C"],
      0x6a: [5, "D"],
      0x6b: [5, "E"],
      0x6c: [5, "H"],
      0x6d: [5, "L"],
      0x6f: [5, "A"],

      0x70: [6, "B"],
      0x71: [6, "C"],
      0x72: [6, "D"],
      0x73: [6, "E"],
      0x74: [6, "H"],
      0x75: [6, "L"],
      0x77: [6, "A"],

      0x78: [7, "B"],
      0x79: [7, "C"],
      0x7a: [7, "D"],
      0x7b: [7, "E"],
      0x7c: [7, "H"],
      0x7d: [7, "L"],
      0x7f: [7, "A"],
    },
    format: (data, args) => `BIT ${data[0]} ${data[1]}`,
    exec: (data, args, ctx) => {
      const [i, r] = data;
      const { registers } = ctx;
      _BIT_i_n(i, registers[r], ctx);
    },
  },
  {
    cb: true,
    name: "BIT i (HL)",
    len: 2,
    cycles: 3,
    args: 0,
    opcodes: {
      0x46: 0,
      0x4e: 1,
      0x56: 2,
      0x5e: 3,
      0x66: 4,
      0x6e: 5,
      0x76: 6,
      0x7e: 7,
    },
    format: (data, args) => `BIT ${data} (HL)`,
    exec: (data, args, ctx) => {
      const i = data;
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      _BIT_i_n(i, memory.rd(addr), ctx);
    },
  },
  {
    cb: true,
    name: "SET i r8",
    len: 2,
    cycles: 2,
    args: 0,
    opcodes: {
      0xc0: [0, "B"],
      0xc1: [0, "C"],
      0xc2: [0, "D"],
      0xc3: [0, "E"],
      0xc4: [0, "H"],
      0xc5: [0, "L"],
      0xc7: [0, "A"],

      0xc8: [1, "B"],
      0xc9: [1, "C"],
      0xca: [1, "D"],
      0xcb: [1, "E"],
      0xcc: [1, "H"],
      0xcd: [1, "L"],
      0xcf: [1, "A"],

      0xd0: [2, "B"],
      0xd1: [2, "C"],
      0xd2: [2, "D"],
      0xd3: [2, "E"],
      0xd4: [2, "H"],
      0xd5: [2, "L"],
      0xd7: [2, "A"],

      0xd8: [3, "B"],
      0xd9: [3, "C"],
      0xda: [3, "D"],
      0xdb: [3, "E"],
      0xdc: [3, "H"],
      0xdd: [3, "L"],
      0xdf: [3, "A"],

      0xe0: [4, "B"],
      0xe1: [4, "C"],
      0xe2: [4, "D"],
      0xe3: [4, "E"],
      0xe4: [4, "H"],
      0xe5: [4, "L"],
      0xe7: [4, "A"],

      0xe8: [5, "B"],
      0xe9: [5, "C"],
      0xea: [5, "D"],
      0xeb: [5, "E"],
      0xec: [5, "H"],
      0xed: [5, "L"],
      0xef: [5, "A"],

      0xf0: [6, "B"],
      0xf1: [6, "C"],
      0xf2: [6, "D"],
      0xf3: [6, "E"],
      0xf4: [6, "H"],
      0xf5: [6, "L"],
      0xf7: [6, "A"],

      0xf8: [7, "B"],
      0xf9: [7, "C"],
      0xfa: [7, "D"],
      0xfb: [7, "E"],
      0xfc: [7, "H"],
      0xfd: [7, "L"],
      0xff: [7, "A"],
    },
    format: (data, args) => `SET ${data[0]} ${data[1]}`,
    exec: (data, args, ctx) => {
      const [i, r] = data;
      const mask = 1 << i;
      const { registers, memory } = ctx;
      registers[r] |= mask;
    },
  },
  {
    cb: true,
    name: "SET i (HL)",
    len: 2,
    cycles: 4,
    args: 0,
    opcodes: {
      0xc6: 0,
      0xce: 1,
      0xd6: 2,
      0xde: 3,
      0xe6: 4,
      0xee: 5,
      0xf6: 6,
      0xfe: 7,
    },
    format: (data, args) => `SET ${data} (HL)`,
    exec: (data, args, ctx) => {
      const i = data;
      const { registers, memory } = ctx;
      const mask = 1 << i;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, memory.rd(addr) | mask);
    },
  },
  {
    cb: true,
    name: "RES i r8",
    len: 2,
    cycles: 2,
    args: 0,
    opcodes: {
      0x80: [0, "B"],
      0x81: [0, "C"],
      0x82: [0, "D"],
      0x83: [0, "E"],
      0x84: [0, "H"],
      0x85: [0, "L"],
      0x87: [0, "A"],

      0x88: [1, "B"],
      0x89: [1, "C"],
      0x8a: [1, "D"],
      0x8b: [1, "E"],
      0x8c: [1, "H"],
      0x8d: [1, "L"],
      0x8f: [1, "A"],

      0x90: [2, "B"],
      0x91: [2, "C"],
      0x92: [2, "D"],
      0x93: [2, "E"],
      0x94: [2, "H"],
      0x95: [2, "L"],
      0x97: [2, "A"],

      0x98: [3, "B"],
      0x99: [3, "C"],
      0x9a: [3, "D"],
      0x9b: [3, "E"],
      0x9c: [3, "H"],
      0x9d: [3, "L"],
      0x9f: [3, "A"],

      0xa0: [4, "B"],
      0xa1: [4, "C"],
      0xa2: [4, "D"],
      0xa3: [4, "E"],
      0xa4: [4, "H"],
      0xa5: [4, "L"],
      0xa7: [4, "A"],

      0xa8: [5, "B"],
      0xa9: [5, "C"],
      0xaa: [5, "D"],
      0xab: [5, "E"],
      0xac: [5, "H"],
      0xad: [5, "L"],
      0xaf: [5, "A"],

      0xb0: [6, "B"],
      0xb1: [6, "C"],
      0xb2: [6, "D"],
      0xb3: [6, "E"],
      0xb4: [6, "H"],
      0xb5: [6, "L"],
      0xb7: [6, "A"],

      0xb8: [7, "B"],
      0xb9: [7, "C"],
      0xba: [7, "D"],
      0xbb: [7, "E"],
      0xbc: [7, "H"],
      0xbd: [7, "L"],
      0xbf: [7, "A"],
    },
    format: (data, args) => `RES ${data[0]} ${data[1]}`,
    exec: (data, args, ctx) => {
      const [i, r] = data;
      const mask = 0xff - (1 << i);
      const { registers } = ctx;
      registers[r] &= mask;
    },
  },
  {
    cb: true,
    name: "RES i (HL)",
    len: 2,
    cycles: 4,
    args: 0,
    opcodes: {
      0x86: 0,
      0x8e: 1,
      0x96: 2,
      0x9e: 3,
      0xa6: 4,
      0xae: 5,
      0xb6: 6,
      0xbe: 7,
    },
    format: (data, args) => `RES ${data} (HL)`,
    exec: (data, args, ctx) => {
      const i = data;
      const { registers, memory } = ctx;
      const mask = 0xff - (1 << i);
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, memory.rd(addr) & mask);
    },
  },
  {
    cb: true,
    name: "SWAP r8",
    len: 2,
    cycles: 2,
    args: 0,
    opcodes: {
      0x30: "B",
      0x31: "C",
      0x32: "D",
      0x33: "E",
      0x34: "H",
      0x35: "L",
      0x37: "A",
    },
    format: (data, args) => `SWAP ${data}`,
    exec: (data, args, ctx) => {
      const r = data;
      const { registers } = ctx;
      registers[r] = _SWAP_n(registers[r], ctx);
    },
  },
  {
    cb: true,
    name: "SWAP (HL)",
    len: 2,
    cycles: 4,
    args: 0,
    opcodes: {
      0x36: "",
    },
    format: (data, args) => `SWAP (HL)`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      memory.wr(addr, _SWAP_n(memory.rd(addr), ctx));
    },
  },
  // /16bit
  // 8bit
  {
    name: "JP a16",
    len: 3,
    cycles: 4,
    args: 2,
    opcodes: {
      0xc3: "",
    },
    format: (data, args) => `JP ${toHexStr(makeWord(args[1], args[0]))}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(args[1], args[0]);
      registers.PC = addr;
    },
  },
  {
    name: "JP cc a16",
    len: 3,
    cycles: 4, // 4/3
    args: 2,
    opcodes: {
      0xc2: [0, 0x80, "NZ"],
      0xd2: [0, 0x10, "NC"],
      0xca: [1, 0x80, "Z"],
      0xda: [1, 0x10, "C"],
    },
    format: (data, args) =>
      `JP ${data[2]} ${toHexStr(makeWord(args[1], args[0]))}`,
    exec: (data, args, ctx) => {
      const [check, mask, _] = data;
      const { registers, memory } = ctx;
      const res = registers.F & mask ? 1 : 0;
      if (res === check) {
        registers.PC = makeWord(args[1], args[0]);
      }
    },
  },
  {
    name: "JP HL",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0xe9: "",
    },
    format: (data, args) => `JP HL`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(registers.H, registers.L);
      registers.PC = addr;
    },
  },
  {
    name: "JP s8",
    len: 2,
    cycles: 3,
    args: 1,
    opcodes: {
      0x18: "",
    },
    format: (data, args) => `JP s${toHexStr(args[0])} (${getSigned(args[0])})`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const s = getSigned(args[0]);
      registers.PC += s;
    },
  },
  {
    name: "JR c s8",
    len: 2,
    cycles: 3, // 3/2
    args: 1,
    opcodes: {
      0x20: [0, 0x80, "NZ"],
      0x30: [0, 0x10, "NC"],
      0x28: [1, 0x80, "Z"],
      0x38: [1, 0x10, "C"],
    },
    format: (data, args) =>
      `JP ${data[2]} s${toHexStr(args[0])} (${getSigned(args[0])})`,
    exec: (data, args, ctx) => {
      const [check, mask, _] = data;
      const { registers, memory } = ctx;
      const s = getSigned(args[0]);
      const res = registers.F & mask ? 1 : 0;
      if (res === check) {
        registers.PC += s;
      }
    },
  },
  {
    name: "PUSH r16",
    len: 1,
    cycles: 4,
    args: 0,
    opcodes: {
      0xc5: ["B", "C"],
      0xd5: ["D", "E"],
      0xe5: ["H", "L"],
      0xf5: ["A", "F"],
    },
    format: (data, args) => `PUSH ${data[0]}${data[1]}`,
    exec: (data, args, ctx) => {
      const [r1, r2] = data;
      const { registers, memory } = ctx;
      memory.wr(--registers.SP, registers[r1]);
      memory.wr(--registers.SP, registers[r2]);
    },
  },
  {
    name: "POP r16",
    len: 1,
    cycles: 3,
    args: 0,
    opcodes: {
      0xc1: ["B", "C"],
      0xd1: ["D", "E"],
      0xe1: ["H", "L"],
      0xf1: ["A", "F"],
    },
    format: (data, args) => `POP ${data[0]}${data[1]}`,
    exec: (data, args, ctx) => {
      const [r1, r2] = data;
      const { registers, memory } = ctx;
      registers[r2] = memory.rd(registers.SP++);
      registers[r1] = memory.rd(registers.SP++);
    },
  },
  {
    name: "RST p",
    len: 1,
    cycles: 4,
    args: 0,
    opcodes: {
      0xc7: 0x00,
      0xcf: 0x08,
      0xd7: 0x10,
      0xdf: 0x18,
      0xe7: 0x20,
      0xef: 0x28,
      0xf7: 0x30,
      0xff: 0x38,
    },
    format: (data, args) => `RST ${toHexStr(data)}`,
    exec: (data, args, ctx) => {
      const n = data;
      const { registers, memory } = ctx;
      _PUSH_PC(ctx);
      registers.PC = n;
    },
  },
  {
    name: "RET",
    len: 1,
    cycles: 4,
    args: 0,
    opcodes: {
      0xc9: "",
    },
    format: (data, args) => `RET`,
    exec: (data, args, ctx) => {
      _POP_PC(ctx);
    },
  },
  {
    name: "RET cc",
    len: 1,
    cycles: 5, // 5/2
    args: 0,
    opcodes: {
      0xc0: [0, 0x80, "NZ"],
      0xd0: [0, 0x10, "NC"],
      0xc8: [1, 0x80, "Z"],
      0xd8: [1, 0x10, "C"],
    },
    format: (data, args) => `RET ${data[2]}`,
    exec: (data, args, ctx) => {
      const [check, mask, _] = data;
      const { registers, memory } = ctx;
      const res = registers.F & mask ? 1 : 0;
      if (res === check) {
        _POP_PC(ctx);
      }
    },
  },
  {
    name: "CALL a16",
    len: 3,
    cycles: 6,
    args: 2,
    opcodes: {
      0xcd: "",
    },
    format: (data, args) => `CALL ${toHexStr(makeWord(args[1], args[0]))}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const addr = makeWord(args[1], args[0]);
      _PUSH_PC(ctx);
      registers.PC = addr;
    },
  },
  {
    name: "CALL cc a16",
    len: 3,
    cycles: 6, // 6/3
    args: 2,
    opcodes: {
      0xc4: [0, 0x80, "NZ"],
      0xd4: [0, 0x10, "NC"],
      0xcc: [1, 0x80, "Z"],
      0xdc: [1, 0x10, "C"],
    },
    format: (data, args) =>
      `CALL ${data[2]} ${toHexStr(makeWord(args[1], args[0]))}`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const [check, mask, _] = data;

      const addr = makeWord(args[1], args[0]);

      const res = registers.F & mask ? 1 : 0;
      if (res === check) {
        _PUSH_PC(ctx);
        registers.PC = addr;
      }
    },
  },
  {
    name: "CPL A",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x2f: "",
    },
    format: (data, args) => `CPL A`,
    exec: (data, args, ctx) => {
      const { registers } = ctx;
      registers.A = ~registers.A & 0xff;
      registers.F &= 0b10010000;
      registers.F |= 0x60;
    },
  },
  {
    name: "CCF",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x3f: "",
    },
    format: (data, args) => `CCF`,
    exec: (data, args, ctx) => {
      const { registers } = ctx;
      registers.F &= 0x9f;
      if (registers.F & 0x10) {
        registers.F &= 0xef;
      } else {
        registers.F |= 0x10;
      }
    },
  },
  {
    name: "SCF",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x37: "",
    },
    format: (data, args) => `SCF`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      registers.F &= 0x80;
      registers.F |= 0x10;
    },
  },
  {
    name: "RLCA",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x07: "",
    },
    format: (data, args) => `RLCA`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      registers.A = _RLC_n(registers.A, ctx);
      // registers.F &= 0xef;
      registers.F &= 0x10;
    },
  },
  {
    name: "RLA",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x17: "",
    },
    format: (data, args) => `RLA`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      registers.A = _RL_n(registers.A, ctx);
      // registers.F &= 0xef;
      registers.F &= 0x10;
    },
  },
  {
    name: "RRCA",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x0f: "",
    },
    format: (data, args) => `RRCA`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      registers.A = _RRC_n(registers.A, ctx);
      // registers.F &= 0xef;
      registers.F &= 0x10;
    },
  },
  {
    name: "RRA",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x1f: "",
    },
    format: (data, args) => `RRA`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      registers.A = _RR_n(registers.A, ctx);
      // registers.F &= 0xef;
      registers.F &= 0x10;
    },
  },
  {
    name: "DAA",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x27: "",
    },
    format: (data, args) => `DAA`,
    exec: (data, args, ctx) => {
      const { registers, memory } = ctx;
      const sub = registers.F & 0x40 ? 1 : 0;
      const h = registers.F & 0x20 ? 1 : 0;
      let c = registers.F & 0x10 ? 1 : 0;
      if (sub) {
        if (h) {
          registers.A = (registers.A - 0x6) & 0xff;
        }
        if (c) {
          registers.A -= 0x60;
        }
      } else {
        if ((registers.A & 0xf) > 9 || h) {
          registers.A += 0x6;
        }
        if (registers.A > 0x9f || c) {
          registers.A += 0x60;
        }
      }
      if (registers.A & 0x100) {
        c = 1;
      }
      registers.A &= 0xff;
      registers.F &= 0x40;
      if (registers.A === 0) {
        registers.F |= 0x80;
      }
      if (c) {
        registers.F |= 0x10;
      }
    },
  },
  {
    name: "HALT",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x76: "",
    },
    format: (data, args) => `HALT`,
    exec: (data, args, ctx) => {
      const { halt } = ctx;
      halt();
    },
  },
  {
    name: "DI",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0xf3: "",
    },
    format: (data, args) => `DI`,
    exec: (data, args, ctx) => {
      const { disableInterrupts } = ctx;
      disableInterrupts();
    },
  },
  {
    name: "EI",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0xfb: "",
    },
    format: (data, args) => `EI`,
    exec: (data, args, ctx) => {
      const { enableInterrupts } = ctx;
      enableInterrupts();
    },
  },
  {
    name: "RETI",
    len: 1,
    cycles: 4,
    args: 0,
    opcodes: {
      0xd9: "",
    },
    format: (data, args) => `RETI`,
    exec: (data, args, ctx) => {
      const { enableInterrupts } = ctx;
      enableInterrupts();
      _POP_PC(ctx);
    },
  },
  {
    name: "NOP",
    len: 1,
    cycles: 1,
    args: 0,
    opcodes: {
      0x0: "",
    },
    format: (data, args) => `NOP`,
    exec: (data, args, ctx) => {},
  },
  {
    name: "STOP",
    len: 2,
    cycles: 1,
    args: 1,
    opcodes: {
      0x10: "",
    },
    format: (data, args) => `STOP`,
    exec: (data, args, ctx) => {},
  },
];

/*
{
  name: "LD r8 n8",
  len: 2,
  cycles: 2,
  args: 0,
  opcodes: {},
  format: (data, args) => `LD ${data[0]} ${args[0]}`,
  exec: (data, args, ctx) => {

  },
},
*/

export function _PUSH_PC(ctx) {
  const { registers, memory } = ctx;
  const [n1, n2] = word2nibbles(registers.PC);
  memory.wr(--registers.SP, n1);
  memory.wr(--registers.SP, n2);
}
function _POP_PC(ctx) {
  const { registers, memory } = ctx;
  const n2 = memory.rd(registers.SP++);
  const n1 = memory.rd(registers.SP++);
  registers.PC = makeWord(n1, n2);
}

function _BIT_i_n(i, n, ctx) {
  const { registers, memory } = ctx;
  const mask = 1 << i;
  const z = n & mask;
  registers.F &= 0x10;
  registers.F |= 0x20;
  if (!z) {
    registers.F |= 0x80;
  }
}
function _SWAP_n(n, ctx) {
  const { registers, memory } = ctx;
  registers.F = 0;
  if (n === 0) {
    registers.F |= 0x80;
  }
  return (((n & 0xf0) >> 4) & 0xf) | ((n & 0xf) << 4);
}

function _RRC_n(n, ctx) {
  const { registers } = ctx;
  const c = n & 0x1;
  n >>= 1;
  registers.F = 0;
  if (c) {
    n |= 0x80;
    registers.F |= 0x10;
  }
  if (n === 0) {
    registers.F |= 0x80;
  }
  return n;
}
function _RLC_n(n, ctx) {
  const { registers } = ctx;
  registers.F = 0;
  const c = n & 0x80 ? 1 : 0;
  n = ((n << 1) + c) & 0xff;
  const z = n === 0;
  if (z) {
    registers.F |= 0x80;
  }
  if (c) {
    registers.F |= 0x10;
  }
  return n;
}
function _RR_n(n, ctx) {
  const { registers } = ctx;
  const c = registers.F & 0x10 ? 1 : 0;
  registers.F = 0;
  const out = n & 0x01;
  n >>= 1;
  if (c) {
    n |= 0x80;
  }
  if (out) {
    // n |= 0x80;
    registers.F |= 0x10;
  }
  if (n === 0) {
    registers.F |= 0x80;
  }
  return n;
}
function _RL_n(n, ctx) {
  const { registers } = ctx;
  const c = registers.F & 0x10 ? 1 : 0;
  registers.F = 0;
  const out = n & 0x80;
  if (out) {
    registers.F |= 0x10;
  }
  n = ((n << 1) + c) & 0xff;
  if (n === 0) {
    registers.F |= 0x80;
  }
  return n;
}
function _SRA_n(n, ctx) {
  const { registers } = ctx;
  registers.F = 0;
  if (n & 0x01) {
    registers.F |= 0x10;
  }
  const msb = n & 0x80;
  n = (n >> 1) | msb;
  if (n === 0) {
    registers.F |= 0x80;
  }
  return n;
}
function _SRL_n(n, ctx) {
  const { registers } = ctx;
  registers.F = 0;
  if (n & 0x01) {
    registers.F |= 0x10;
  }
  n = n >> 1;
  if (n === 0) {
    registers.F |= 0x80;
  }
  return n;
}
function _SLA_n(n, ctx) {
  const { registers, memory } = ctx;
  registers.F = 0;
  if (n & 0x80) {
    registers.F |= 0x10;
  }
  n = (n << 1) & 0xff;
  if (n === 0) {
    registers.F |= 0x80;
  }
  return n;
}

/////////////

function _ADD_A_n(n, ctx) {
  const r1 = "A";
  const { registers } = ctx;
  const h = ((registers[r1] & 0xf) + (n & 0xf)) & 0x10;
  registers[r1] += n;
  const c = registers[r1] & 0x100;
  registers[r1] &= 0xff;
  const z = registers[r1] === 0;
  registers.F = 0;
  if (c) {
    registers.F |= 0x10;
  }
  if (h) {
    registers.F |= 0x20;
  }
  if (z) {
    registers.F |= 0x80;
  }
}
function _ADD_HL_nn(n, ctx) {
  const { registers } = ctx;
  const hl = makeWord(registers.H, registers.L);
  const h = ((hl & 0xfff) + (n & 0xfff)) & 0x1000;
  let res = hl + n;
  const c = res & 0x10000;
  res &= 0xffff;
  const z = res === 0;
  [registers.H, registers.L] = word2nibbles(res);
  registers.F &= 0x80;
  if (h) {
    registers.F |= 0x20;
  }
  if (c) {
    registers.F |= 0x10;
  }
}
function _ADC_A_n(n, ctx) {
  const r1 = "A";
  const { registers, memory } = ctx;
  let c = registers.F & 0x10 ? 1 : 0;
  const h = ((registers[r1] & 0xf) + (n & 0xf) + c) & 0x10;
  registers[r1] += n + c;
  c = registers[r1] & 0x100;
  registers[r1] &= 0xff;
  const z = registers[r1] === 0;
  registers.F = 0;
  if (c) {
    registers.F |= 0x10;
  }
  if (h) {
    registers.F |= 0x20;
  }
  if (z) {
    registers.F |= 0x80;
  }
}
function _SUB_n(n, ctx) {
  const { registers } = ctx;
  const c = registers.A < n;
  const h = (registers.A & 0xf) < (n & 0xf);
  registers.A -= n;
  registers.A &= 0xff;
  const z = registers.A === 0;
  registers.F = 0;
  if (c) {
    registers.F |= 0x10;
  }
  if (h) {
    registers.F |= 0x20;
  }
  if (z) {
    registers.F |= 0x80;
  }
  registers.F |= 0x40;
}
function _SBC_A_n(n, ctx) {
  const r1 = "A";
  const { registers } = ctx;
  const carry = registers.F & 0x10 ? 1 : 0;
  const c = registers.A < n + carry;
  const h = (registers[r1] & 0xf) < (n & 0xf) + carry;
  registers[r1] -= n + carry;
  registers[r1] &= 0xff;
  const z = registers[r1] === 0;
  registers.F = 0;
  if (c) {
    registers.F |= 0x10;
  }
  if (h) {
    registers.F |= 0x20;
  }
  if (z) {
    registers.F |= 0x80;
  }
  registers.F |= 0x40;
}
function _OR_n(n, ctx) {
  const { registers } = ctx;
  registers.A |= n;
  registers.F = 0;
  if (registers.A === 0) {
    registers.F |= 0x80;
  }
}
function _AND_n(n, ctx) {
  const { registers } = ctx;
  registers.A &= n;
  registers.F = 0;
  if (registers.A === 0) {
    registers.F |= 0x80;
  }
  registers.F |= 0x20;
}
function _XOR_n(n, ctx) {
  const { registers } = ctx;
  registers.A ^= n;
  registers.F = 0;
  if (registers.A === 0) {
    registers.F |= 0x80;
  }
}

function _CP_n(n, ctx) {
  const { registers } = ctx;
  const c = registers.A < n;
  const z = registers.A === n;
  const h = (registers.A & 0xf) < (n & 0xf);
  registers.F = 0x40;
  if (c) {
    registers.F |= 0x10;
  }
  if (h) {
    registers.F |= 0x20;
  }
  if (z) {
    registers.F |= 0x80;
  }
}

function _ADD_SP_s8(n, ctx) {
  const { registers } = ctx;
  const rel = getSigned(n);
  const value = (registers.SP + rel) & 0xffff;
  const c = (registers.SP & 0xff) + (rel & 0xff) > 0xff;
  const h = (registers.SP & 0xf) + (rel & 0xf) > 0xf;
  registers.F = 0;
  if (h) {
    registers.F |= 0x20;
  }
  if (c) {
    registers.F |= 0x10;
  }
  return value;
}
