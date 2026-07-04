import { getHeaderInfo } from "./utils/header_utils.js";
import { LCanvas } from "./utils/canvas.js";
import { JDebugger } from "./utils/debugger.js";
import { JEngine } from "./parts/engine.js";
// import { M_HARDWARE_REGISTERS } from "./constants/registers.js";
import { EventManager, KeyboardControls } from "./utils/keyboard.js";
// import { showInstructions } from "./instructions/instructions-show.js";

// showInstructions();
// showInstructions(true);

async function load(romPath) {
  const romResp = await fetch(romPath);
  const romArrayBuffer = await romResp.arrayBuffer();
  return new Uint8Array(romArrayBuffer);
}

const KEYMAP = {
  start: "q",
  select: "e",
  b: "z",
  a: "x",
  down: "s",
  up: "w",
  left: "a",
  right: "d",
};

class Runner {
  constructor() {
    this.engine = null;
    this.jdebugger = null;
    this.eventManager = new EventManager();
    this.keyboard = new KeyboardControls(this.eventManager);
    this.lcanvas = new LCanvas(".canvas");
    this.lcanvas.resize(300, 300);
    this.running = false;

    this.loop = this.loop_.bind(this);
  }
  async init() {
    this.engine = new JEngine();
    this.jdebugger = new JDebugger(this.engine, this.lcanvas, this.lcanvas);

    this.keyboard.activate();
    Object.keys(KEYMAP).forEach((jkey) => {
      const kkey = KEYMAP[jkey];
      this.keyboard.addOnKeydown(kkey, () => {
        this.engine.joypadButtons[jkey] = true;
      });
      this.keyboard.addOnKeyup(kkey, () => {
        this.engine.joypadButtons[jkey] = false;
      });
    });
  }
  destroy() {
    this.eventManager.dispose();
  }
  async setRomFromUrl(romPath, bootRomPath = "/static/boot_rom.gb") {
    const rom = await load(romPath);
    const romBoot = await load(bootRomPath);
    setRomFromArray(rom, romBoot);
    this.engine.setRom(rom);
    if (bootRomPath) {
      this.engine.setRomBoot(romBoot);
    } else {
      this.engine.registers.PC = 0x100;
      this.engine.registers.SP = 0xfffe;
    }
  }
  setRomFromArray(rom, boot = null) {
    this.engine.setRom(rom);
    if (boot) {
      this.engine.setRomBoot(boot);
    } else {
      this.engine.registers.PC = 0x100;
      this.engine.registers.SP = 0xfffe;
    }
  }
  saveRam() {
    this.engine.saveRam();
  }
  loadRam() {
    this.engine.loadRam();
  }
  clearRam() {
    this.engine.clearRam();
  }
  updateJoypad(buttons) {
    this.engine.updateJoypad({ ...this.engine.joypadButtons, ...buttons });
  }

  async start(romPath = "/static/poke_midori.gb") {
    await this.init();
    await this.setRomFromUrl(romPath);
    this.loadRam();
    this.running = true;
    this.loop();
  }
  async start2(rom, boot) {
    await this.init();
    this.setRomFromArray(rom, boot);
    this.loadRam();
    this.running = true;
    this.loop();
  }
  stop() {
    this.running = false;
    this.destroy();
  }

  loop_() {
    if (!this.running) {
      return;
    }
    let vc = 0;
    for (let i = 0; i < 20000; i++) {
      const vblank = this.jdebugger.step();
      if (vblank && vc++ >= this.engine.speed) {
        break;
      }
    }
    requestAnimationFrame(this.loop);
  }
}

const runner = new Runner();

const startBTN = document.querySelector(".start");
const stopBTN = document.querySelector(".stop");
const saveBTN = document.querySelector(".save");
const loadBTN = document.querySelector(".load");
const clearBTN = document.querySelector(".clear");
const speedBTN = document.querySelector(".speed");

const bootInput = document.querySelector(".boot-rom-checkbox");
const fileInput = document.querySelector(".file-input");

let romArray = null;
fileInput.addEventListener(
  "change",
  function () {
    var reader = new FileReader();
    reader.onload = function () {
      const arrayBuffer = this.result;
      const array = new Uint8Array(arrayBuffer);
      romArray = array;
    };
    if (this.files.length > 0) {
      reader.readAsArrayBuffer(this.files[0]);
    } else {
      romArray = null;
    }
    console.log(this.files);
  },
  false
);

function handleStop() {
  runner.saveRam();
  runner.stop();
}
async function handleStart() {
  const boot = bootInput.checked;
  let bootRom = null;
  let rom = romArray;
  if (!rom) {
    // rom = await load("/static/poke_midori.gb");
    rom = await load("/static/ninja_gaiden.gb");
  }
  if (boot) {
    bootRom = await load("/static/boot_rom.gb");
  }
  runner.start2(rom, bootRom);
}
startBTN.addEventListener("click", () => {
  if (runner.running) {
    runner.stop();
    runner.saveRam();
  }
  
  // runner.start();
  handleStart();
});
stopBTN.addEventListener("click", () => {
  runner.stop();
});

saveBTN.addEventListener("click", () => {
  runner.saveRam();
});
loadBTN.addEventListener("click", () => {
  runner.loadRam();
});
clearBTN.addEventListener("click", () => {
  runner.clearRam();
});

speedBTN.addEventListener("click", () => {
  runner.engine.speed = runner.engine.speed <= 4 ? runner.engine.speed + 1 : 1;
  speedBTN.textContent = `Spd x${runner.engine.speed / 2}`;
});

const KEY_CONTROLS = {
  start: ".control-start",
  select: ".control-select",
  b: ".control-b",
  a: ".control-a",
  down: ".control-down",
  up: ".control-up",
  left: ".control-left",
  right: ".control-right",
};

Object.keys(KEY_CONTROLS).forEach((jkey) => {
  const kkey = KEY_CONTROLS[jkey];
  const control = document.querySelector(kkey);
  control.addEventListener("touchstart", (e) => {
    runner.updateJoypad({ [jkey]: true });
  });
  control.addEventListener("touchend", (e) => {
    runner.updateJoypad({ [jkey]: false });
  });
  control.addEventListener("mousedown", (e) => {
    runner.updateJoypad({ [jkey]: true });
  });
  control.addEventListener("mouseleave", (e) => {
    runner.updateJoypad({ [jkey]: false });
  });
  control.addEventListener("mouseup", (e) => {
    runner.updateJoypad({ [jkey]: false });
  });
});

// function saveRam() {
//   jd.engine.joypadButtons[jkey] = true;
// }
window.addEventListener("beforeunload", () => {
  runner.saveRam();
});
