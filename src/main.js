import { getHeaderInfo } from "./utils/header_utils.js";
import { LCanvas } from "./utils/canvas.js";
import { JDebugger } from "./utils/debugger.js";
import { JEngine } from "./parts/engine.js";
import { M_HARDWARE_REGISTERS } from "./constants/registers.js";
import { EventManager, KeyboardControls } from "./utils/keyboard.js";
// import { showInstructions } from "./instructions/instructions-show.js";

// showInstructions();
// showInstructions(true);

async function load(romPath) {
  const romResp = await fetch(romPath);
  const romArrayBuffer = await romResp.arrayBuffer();
  return new Uint8Array(romArrayBuffer);
}

const lcanvas = new LCanvas(".canvas");
lcanvas.resize(300, 300);

const lcanvas2 = new LCanvas(".canvas2");
lcanvas2.resize(300, 300);

const CONTEXT = {
  jdebugger: null,
  running: false,
};

const testFolder = "/static/game-boy-test-roms-v7.0/blargg/cpu_instrs";
const ROM_PATHS = {
  BOOT_ROM: "/static/boot_rom.gb",
  TETRIS: "/static/tetris.gb",
  POKE: "/static/poke_midori.gb",
  BGB_TEST: "/static/bgbtest.gb",
  TEST_1: `${testFolder}/individual/01-special.gb`, // ok
  TEST_2: `${testFolder}/individual/02-interrupts.gb`, // fail
  TEST_3: `${testFolder}/individual/03-op sp,hl.gb`, // ok
  TEST_4: `${testFolder}/individual/04-op r,imm.gb`, // ok
  TEST_5: `${testFolder}/individual/05-op rp.gb`, // ok
  TEST_6: `${testFolder}/individual/06-ld r,r.gb`, // ok
  TEST_7: `${testFolder}/individual/07-jr,jp,call,ret,rst.gb`, // ok
  TEST_8: `${testFolder}/individual/08-misc instrs.gb`, // ok
  TEST_9: `${testFolder}/individual/09-op r,r.gb`, // ok
  TEST_10: `${testFolder}/individual/10-bit ops.gb`, // ok
  TEST_11: `${testFolder}/individual/11-op a,(hl).gb`, // ok
  TEST_ALL: `${testFolder}/cpu_instrs.gb`,
};

async function main() {
  // const rom = await load("/static/tetris.gb");
  // const rom = await load(ROM_PATHS.TETRIS);
  const rom = await load(ROM_PATHS.POKE);
  // const rom = await load(ROM_PATHS.BGB_TEST);
  // const rom = await load(ROM_PATHS.TEST_2);
  const romBoot = await load(ROM_PATHS.BOOT_ROM);
  const headerInfo = getHeaderInfo(rom);
  console.log(headerInfo);
  const jengine = new JEngine();
  jengine.setRom(rom);
  jengine.setRomBoot(romBoot);
  window.jengine = jengine;
  const jdebugger = new JDebugger(jengine, lcanvas, lcanvas2);
  window.jd = jdebugger;

  CONTEXT.jdebugger = jdebugger;
}

main();
function animate() {
  if (!CONTEXT.running) {
    return;
  }
  // window.jd.c(10000, true);
  for (let i = 0; i < 20000; i++) {
    const vblank = window.jd.step();
    if (vblank) {
      break;
    }
  }
  requestAnimationFrame(animate);
}

window.rr = (pc = 0x100) => {
  CONTEXT.running = true;
  if (pc !== 0) {
    const jd = CONTEXT.jdebugger;
    jd.engine.registers.SP = 0xfffe;
    jd.engine.memory[M_HARDWARE_REGISTERS.LCDC] = 0x5b; //91;
    jd.engine.memory[M_HARDWARE_REGISTERS.STAT] = 0x55; //85;
  }
  jd.engine.registers.PC = pc;
  requestAnimationFrame(animate);
};
window.stop = () => {
  CONTEXT.running = false;
};

const eventManager = new EventManager();
const keyboard = new KeyboardControls(eventManager);
keyboard.activate();
const keymap = {
  start: "q",
  select: "e",
  b: "z",
  a: "x",
  down: "s",
  up: "w",
  left: "a",
  right: "d",
};
Object.keys(keymap).forEach((jkey) => {
  const kkey = keymap[jkey];
  keyboard.addOnKeydown(kkey, () => {
    jd.engine.joypadButtons[jkey] = true;
  });
  keyboard.addOnKeyup(kkey, () => {
    jd.engine.joypadButtons[jkey] = false;
  });
});


const startBTN = document.querySelector('.start');
const saveBTN = document.querySelector('.save');
const loadBTN = document.querySelector('.load');
startBTN.addEventListener('click', () => {
  if (!CONTEXT.running) {
    window.rr(0);
  }
});

saveBTN.addEventListener('click', () => {
  jd.engine.saveRam();
});
loadBTN.addEventListener('click', () => {
  jd.engine.loadRam();
});

// function saveRam() {
//   jd.engine.joypadButtons[jkey] = true;
// }