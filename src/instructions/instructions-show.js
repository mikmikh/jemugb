import { getOpcode2ins } from "./interpreter.js";

const [opcode2ins, opcode2insCB] = getOpcode2ins();

function createTable(o2i) {
  const res = [];
  for (let r = 0; r <= 0xf; r++) {
    const row = [];
    for (let c = 0; c <= 0xf; c++) {
      const opcode = (r << 4) | c;
      if (!(opcode in o2i)) {
        row.push(null);
        continue;
      }
      const ins = o2i[opcode];
      const args = [];
      for (let i = 0; i < ins.args; i++) {
        args.push('a');
      }

      const data = ins.opcodes[opcode];
      const format = ins.format(data, args);
      row.push(format);
    }
    res.push(row);
  }
  return res;
}
function formatTable(rows) {
    let maxLen = 0;
    rows.forEach(row => {
        row.forEach(cell => {
            maxLen = Math.max(maxLen, cell?.length ?? 0);
        });
    });
    const parts = rows.map(row => {
        const rowParts = row.map(cell => {
            if (!cell) {
                return ' '.repeat(maxLen);
            }
            return cell + ' '.repeat(maxLen-cell.length);
        });
        return rowParts.join('|');
    });
    return parts.join('\n');
}
export function showInstructions(cb=false) {
    const o2i = cb ? opcode2insCB : opcode2ins;
    const rows = createTable(o2i);
    const str = formatTable(rows);
    console.log([str]);
}
