function rotateVector(x, y, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const rx = x * cos - y * sin;
  const ry = x * sin + y * cos;
  return [rx, ry];
}

export class LCanvas {
  constructor(selector) {
    this.canvas = document.querySelector(selector);
    this.ctx = this.canvas.getContext("2d");
    this.sx = 0;
    this.sy = 0;
    this.scale = 1;
    // this.ctx.font = "bold 48px serif";
  }

  resize(w, h) {
    this.height = h;
    this.width = w;
    this.canvas.height = h;
    this.canvas.width = w;
  }

  drawRect(x, y, w, h, color, world = true) {
    if (world) {
      x = x * this.scale + this.sx;
      y = y * this.scale + this.sy;
      w *= this.scale;
      h *= this.scale;

      x += this.width * 0.5;
      y += this.height * 0.5;
    }

    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  drawLine(x, y, x2, y2, color, world = true) {
    if (world) {
      x = x * this.scale + this.sx;
      y = y * this.scale + this.sy;
      x2 = x2 * this.scale + this.sx;
      y2 = y2 * this.scale + this.sy;

      x += this.width * 0.5;
      y += this.height * 0.5;
      x2 += this.width * 0.5;
      y2 += this.height * 0.5;
    }
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x2, y2);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.strokeStyle = null;
  }

  drawText(x, y, text, color = null, font = null, world = true) {
    const oldFont = this.ctx.font;
    const oldfillStyle = this.ctx.fillStyle;
    if (world) {
      x = x * this.scale + this.sx;
      y = y * this.scale + this.sy;
      x += this.width * 0.5;
      y += this.height * 0.5;
    }
    if (color) {
      this.ctx.fillStyle = color;
    }
    if (font) {
      this.ctx.font = font;
    }
    this.ctx.fillText(text, x, y);
    this.ctx.font = oldFont;
    this.ctx.fillStyle = oldfillStyle;
  }

  drawImage(
    image,
    sx,
    sy,
    sw,
    sh,
    dx,
    dy,
    dw = null,
    dh = null,
    angle = 0,
    world = true
  ) {
    dw = dw ?? sw;
    dh = dh ?? sh;

    if (world) {
      dx = dx * this.scale + this.sx;
      dy = dy * this.scale + this.sy;
      dw *= this.scale;
      dh *= this.scale;

      dx += this.width * 0.5;
      dy += this.height * 0.5;
    }
    // Math.cos(angle),
    if (angle != 0) {
      // save the unrotated context of the canvas so we can restore it later
      // the alternative is to untranslate & unrotate after drawing
      this.ctx.save();

      // move to the center of the canvas
      // console.log(dx + dw/2, dy + dh/2);
      this.ctx.translate(dx + dw / 2, dy + dh / 2);

      // rotate the canvas to the specified degrees
      this.ctx.rotate(angle);
      // this.ctx.translate(0, 0);
      // this.ctx.translate(-(dx + dw)/2, -(dy + dh)/2);

      const [rdx, rdy] = rotateVector(-1, 1, angle);
      // console.log(dx, dy);
      // console.log(rdx, rdy);
      // draw the image
      // since the context is rotated, the image will be rotated also
      // console.log(sx, sy, sw, sh, dw/2, dh/2, dw, dh);
      this.ctx.drawImage(image, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);

      // we’re done with the rotating so restore the unrotated context
      this.ctx.restore();
    } else {
      // console.log("this.ctx.drawImage(", image, sx, sy, sw, sh, dx, dy, dw, dh, ")");
      this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    }
  }

  clear(x = null, y = null, w = null, h = null) {
    x = x ?? 0;
    y = y ?? 0;
    w = w ?? this.width;
    h = h ?? this.height;
    this.ctx.clearRect(x, y, w, h);
  }
}

export class TextureLite {
  constructor(name, src, width, height, rows, cols) {
    this.name = name;
    this.src = src;
    this.width = width;
    this.height = height;
    this.rows = rows;
    this.cols = cols;
    this.image = null;
    this._load();
  }
  _load() {
    this.image = new Image();
    this.image.src = this.src;
  }
  draw(lcanvas, row, col, dcoords, dsize, world = true) {
    const sw = this.width / this.cols;
    const sh = this.height / this.rows;
    const sx = sw * col;
    const sy = sh * row;
    lcanvas.drawImage(
      this.image,
      sx,
      sy,
      sw,
      sh,
      dcoords.x,
      dcoords.y,
      dsize.x,
      dsize.y,
      0,
      world
    );
  }
}
export class LTextureLoader {
  constructor() {
    this.name2texture = {};
  }
  clear() {
    this.name2texture = {};
  }
  load(name, src, width, height, rows, cols) {
    // const image = new Image();
    // image.src = src;
    // this.name2texture[name] = image;
    const texture = new TextureLite(name, src, width, height, rows, cols);
    this.name2texture[name] = texture;
    return texture;
  }
  get(name) {
    if (name in this.name2texture) {
      return this.name2texture[name];
    }
    console.warn("TLoaderLite::get::texture not found: ", name);
    return null;
  }
}
