class Progressbar {
  #lastDraw;
  #lastRender;
  constructor(fmt, options) {
    this.total = options.total;
    this.fmt = fmt;
    this.curr = options.curr ?? 0;
    this.width = options.width ?? this.total;
    this.clear = options.clear ? options.clear : false;
    this.complete = options.complete ? options.complete : "█";
    this.incomplete = options.incomplete ? options.incomplete : "░";
    this.head = options.head ? options.head : this.complete;
    this.renderThrottle = options.renderThrottle && options.renderThrottle !== 0
      ? options.renderThrottle
      : 0;
    this.#lastRender = -Infinity;
    this.callback = options.callback ?? function () {};
    this.tokens = {};
    this.#lastDraw = "";
    this.start = 0;
  }
  tick(length, tokens) {
    length && length === 0 ? (length = 1) : length;
    if ("object" == typeof length) (tokens = length), (length = 1);
    if (tokens) this.tokens = tokens;
    if (0 == this.curr) this.start = new Date();
    this.curr += length;
    if (this.curr < this.total) {
      this.render(true);
    }
    if (this.curr >= this.total) {
      this.render(false, undefined);
      this.complete = true;
      this.terminate();
      this.callback(this);
      return;
    }
  }
  render(force, tokens) {
    force !== undefined && force !== null ? force : false;
    if (tokens) {
      this.tokens = tokens;
    }
    const isTTY = Deno.isatty(Deno.stderr.rid);
    if (!isTTY) return;
    const now = Date.now();
    const delta = now - this.#lastRender;
    const rdThrottle = this.renderThrottle ?? 16;
    if (!force && delta < rdThrottle) {
      return;
    } else {
      this.#lastRender = now;
    }
    let ratio = this.curr / this.total;
    ratio = Math.min(Math.max(ratio, 0), 1);
    const percent = Math.floor(ratio * 100);
    const date = new Date();
    const elapsed = +date - +this.start;
    const eta = percent == 100 ? 0 : elapsed * (this.total / this.curr - 1);
    const rate = this.curr / (elapsed / 1000);
    let str = this.fmt
      .replace(":current", this.curr + "")
      .replace(":total", this.total + "")
      .replace(":elapsed", isNaN(elapsed) ? "0.0" : (elapsed / 1000).toFixed(1))
      .replace(
        ":eta",
        isNaN(eta) || !isFinite(eta) ? "0.0" : (eta / 1000).toFixed(1),
      )
      .replace(":percent", percent.toFixed(0) + "%")
      .replace(":rate", Math.round(rate) + "");
    let availableSpace = Math.max(0, 100 - str.replace(":bar", "").length);
    const isWindows = Deno.build.os === "windows";
    if (availableSpace && isWindows) {
      availableSpace -= 1;
    }
    const width = Math.min(
      this.width ? this.width : this.total,
      availableSpace,
    );
    const completeLength = Math.round(width * ratio);
    let complete = Array(Math.max(0, completeLength + 1)).join(
      typeof this.complete === "string" ? this.complete : "",
    );
    const incomplete = Array(Math.max(0, width - completeLength + 1)).join(
      typeof this.incomplete === "string" ? this.incomplete : "",
    );
    if (completeLength > 0) complete = complete.slice(0, -1) + this.head;
    str = str.replace(":bar", complete + incomplete);
    if (this.tokens) {
      for (const key in this.tokens) {
        str = str.replace(":" + key, this.tokens[key]);
      }
    }
    if (this.#lastDraw !== str) {
      this.moveCursor();
      console.clear();
      this.write(str);
      this.#lastDraw = str;
    }
  }
  interrupt(msg) {
    this.write("\x1b[1K");
    this.moveCursor();
    this.write(msg);
    this.write("\n");
    this.write(this.#lastDraw);
  }
  terminate() {
    this.clearProgress();
    this.moveCursor();
  }
  moveCursor() {
    this.write("\x1b[?25h");
  }
  write(msg) {
    const encoder = new TextEncoder();
    Deno.stderr.writeSync(encoder.encode(msg));
  }
  clearProgress() {
    if (this.clear === true) {
      console.clear();
    } else {
      return;
    }
  }
}
const Progressbar1 = Progressbar;
export { Progressbar1 as Progressbar };
