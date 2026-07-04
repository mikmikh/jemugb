

export class EventManager {
  constructor(elem = document) {
    this.elem = elem;
    this.name2funcs = {};
  }
  add(name, func) {
    if (!(name in this.name2funcs)) {
      this.name2funcs[name] = new Set();
      this.elem.addEventListener(name, (e) => this.handleEvent(name, e));
    }
    this.name2funcs[name].add(func);
  }
  remove(name, func) {
    if (name in this.name2funcs) {
      this.name2funcs[name].delete(func);
      this.elem.removeEventListener(name, func);
    }
  }
  handleEvent(name, event) {
    if (name in this.name2funcs) {
      for (const func of this.name2funcs[name]) {
        func(event);
      }
    }
  }
  dispose() {
    for (const name of Object.keys(this.name2funcs)) {
      for (const func of this.name2funcs[name]) {
        this.elem.removeEventListener(name, func);
      }
      this.name2funcs[name].clear();
    }
  }
}

export const KEY_CODES = {
  W: 87,
  S: 83,
  A: 65,
  B: 66,
  D: 68,
  E: 69,
  Q: 81,
  V: 86,
  F: 70,
  R: 82,
  C: 67,
  Z: 90,
  X: 88,
  N: 78,
  O: 79,
  I: 73,
  SPACE: 32,
  SHIFT: 16,
  CTRL: 17,
  ESC: 27,
  ENTER: 13,
  ANGLE_B_L:188,
  ANGLE_B_R:190,
  ANGLE_S_L:219,
  ANGLE_S_R:221,
  ARROW_LEFT: 37,
  ARROW_UP: 38,
  ARROW_RIGHT: 39,
  ARROW_DOWN: 40,
};
export class KeyboardControls {
  constructor(eventManager) {
    this.eventManager = eventManager;
    this.onKeyDown = this._onKeyDown.bind(this);
    this.onKeyUp = this._onKeyUp.bind(this);
    // this.handleClick = this._handleClick.bind(this);
    this.keyStates = {};
    this.onKeydownListeners = {};
    this.onKeyupListeners= {};
  }
  activate() {
    this.eventManager.add("keydown", this.onKeyDown);
    this.eventManager.add("keyup", this.onKeyUp);
  }
  deactivate() {
    this.eventManager.remove("keydown", this.onKeyDown);
    this.eventManager.remove("keyup", this.onKeyUp);
  }

  _onKeyDown(e) {
    // e.preventDefault();
    const keyCode = e.key.toLowerCase();
    this.keyStates[keyCode] = true;
    this._handleKeydown(keyCode);
  }
  _onKeyUp(e) {
    const keyCode = e.key.toLowerCase();
    this.keyStates[keyCode] = false;
    this._handleKeyup(keyCode);

  }
  addOnKeydown(key, handler) {
    if (!(key in this.onKeydownListeners)) {
      this.onKeydownListeners[key] = new Set();
    }
    this.onKeydownListeners[key].add(handler);
  }
  removeOnKeydown(key, handler) {
    if (key in this.onKeydownListeners) {
      this.onKeydownListeners[key].delete(handler);
    }
  }
  addOnKeyup(key, handler) {
    if (!(key in this.onKeyupListeners)) {
      this.onKeyupListeners[key] = new Set();
    }
    this.onKeyupListeners[key].add(handler);
  }
  removeOnKeyup(key, handler) {
    if (key in this.onKeyupListeners) {
      this.onKeyupListeners[key].delete(handler);
    }
  }
  _handleKeydown(key) {
    if (!(key in this.onKeydownListeners)) {
      return;
    }
    for (let handler of this.onKeydownListeners[key]) {
      handler();
    }
  }
  _handleKeyup(key) {
    if (!(key in this.onKeyupListeners)) {
      return;
    }
    for (let handler of this.onKeyupListeners[key]) {
      handler();
    }
  }
}
