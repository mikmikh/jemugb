// FF04
// TIMA
// TMA
// TAC

import { M_HARDWARE_REGISTERS, M_INTERRUPTS } from "../constants/registers.js";

const timerThdMap = {
    0: 64,
    1: 1,
    2: 4,
    3: 16,
};

export class JTimer {
  constructor(engine) {
    this.engine = engine;
    this.timerTT = 0;
    this.timerTTL = 64;
    this.divTT = 0;
    this.divTTL = 256; // 16KHz
  }

  update(cycles) {
    this._updateDiv(cycles);
    this._updateTimer(cycles);
  }

  _updateDiv(dt) {
    this.divTT += dt;
    if (this.divTT < this.divTTL) {
      return;
    }
    this.divTT -= this.divTTL;
    const { memory } = this.engine;
    const divByte = memory.rd(M_HARDWARE_REGISTERS.DIV);
    memory.wr(M_HARDWARE_REGISTERS.DIV, (divByte+1)&0xFF);
  }
  resetDiv() {
    this.divTT=0;
    const { memory } = this.engine;
    memory.wr(M_HARDWARE_REGISTERS.DIV, 0);
  }
  _updateTimer(dt) {
    const { memory, requestInterrupt } = this.engine;
    const tacByte = memory.rd(M_HARDWARE_REGISTERS.TAC);
    const enabled = tacByte & (1<<2);
    if (!enabled) {
        return;
    }
    this.timerTT += dt;
    const thd = timerThdMap[tacByte&0b11] * 16;
    while (this.timerTT >= thd) {
        this.timerTT-=thd;
        const timaByte = memory.rd(M_HARDWARE_REGISTERS.TIMA);
        const nextTima = timaByte+1;
        if (nextTima > 0xFF) {
            const tmaByte = memory.rd(M_HARDWARE_REGISTERS.TMA);
            memory.wr(M_HARDWARE_REGISTERS.TIMA, tmaByte);
            requestInterrupt(M_INTERRUPTS.Timer);
        } else {
            memory.wr(M_HARDWARE_REGISTERS.TIMA, timaByte+1);
        }
    }
  }
}
