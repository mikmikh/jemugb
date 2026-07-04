import { toHexStr } from "../utils/bit_utils.js";
import { INSTRUCTION_DATA } from "./instruction-definitions.js";

export function getOpcode2ins() {
  const opcode2ins = {};
  const opcode2insCB = {};

  INSTRUCTION_DATA.forEach((ins) => {
    if (ins.args + (ins.cb ? 1 : 0) + 1 !== ins.len) {
      throw new Error(`Invalid instruction data ${ins.name}`);
    }
    const opcodeMap = ins.cb ? opcode2insCB : opcode2ins;
    Object.keys(ins.opcodes).forEach((opcode) => {
      // opcode = parseInt(opcode, 16);
      if (opcode in opcodeMap) {
        console.log(ins);
        console.log(opcodeMap[opcode]);
        console.log(opcodeMap);
        throw new Error(
          `Opcode already defined: ${toHexStr(opcode)} ${ins.name}`
        );
      }
      opcodeMap[opcode] = ins;
    });
  });
  return [opcode2ins, opcode2insCB];
}

// export function parseRom(rom) {
//   const [opcode2ins, opcode2insCB] = getOpcode2ins();
//   const res = [];
//   let pc = 0;
//   while (pc < rom.length) {
//     const pc_init = pc;
//     let opcode = rom[pc++];
//     let cb = opcode === 0xcb;
//     let opcodeMap = cb ? opcode2insCB : opcode2ins;
//     if (cb) {
//       opcode = rom[pc++];
//     } else {
//     }

//     if (!(opcode in opcode2ins)) {
//       console.log(
//         `opcode ${cb ? "0xCB" : ""}${toHexStr(opcode)} not implemented`
//       );
//     }
//     const ins = opcodeMap[opcode];

//     const args = [];
//     for (let i = 0; i < ins.args; i++) {
//       args.push(rom[pc++]);
//     }
//     const data = ins.opcodes[opcode];
//     const format = ins.format(data, args);
//     console.log(format);
//     res.push({ pc: pc_init, format });
//   }
//   return res;
// }
