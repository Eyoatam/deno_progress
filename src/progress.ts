// Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
// Copyright(c) 2021 Eyoatam tamirat

const enum Direction {
  left,
  right,
  all,
}

interface BarOptions {
  stream?: stderr;
  total: number;
  curr?: number;
  width?: number;
  clear?: boolean;
  complete?: string;
  incomplete?: string;
  head?: string;
  renderThrottle: number;
  // deno-lint-ignore no-explicit-any
  callback?: any;
}

interface renderOptions {
  tokens?: Record<string, string>;
}

type stderr = typeof Deno.stderr;
const isTTY = Deno.isatty(Deno.stdout.rid);

export default class Progressbar {
  fmt: string;
  // deno-lint-ignore no-explicit-any
  #stream: any;
  #lastDraw: string;
  #lastRender: number;
  total: number;
  curr: number;
  width?: number;
  clear?: boolean;
  complete?: string | boolean;
  incomplete?: string | boolean;
  renderThrottle?: number;
  head?: string;
  // deno-lint-ignore no-explicit-any
  callback?: any;
  tokens: Record<string, string>;
  start: Date | number;

  constructor(fmt: string, options: BarOptions) {
    this.#stream = options.stream ? options.stream : Deno.stderr;
    this.fmt = fmt;
    this.curr = options.curr ?? 0;
    this.total = options.total;
    this.width = options.width ?? this.total;
    this.clear = options.clear ? options.clear : false;
    this.complete = options.complete ? options.complete : "#";
    this.incomplete = options.incomplete ? options.incomplete : "-";
    this.head = options.head ? options.head : this.complete;
    this.renderThrottle =
      options.renderThrottle !== 0 ? options.renderThrottle : 0;
    this.#lastRender = -Infinity;
    this.callback = options.callback ?? function () {};
    this.tokens = {};
    this.#lastDraw = "";
    this.start = 0;
  }

  tick(len: number, tokens?: Record<string, string>) {
    if (len !== 0) len = len || 1;

    // swap tokens
    if ("object" == typeof len) (tokens = len), (len = 1);
    if (tokens) this.tokens = tokens;

    // start time for eta
    if (0 == this.curr) this.start = new Date();

    this.curr += len;

    // try to render
    this.render(true);
    // if (len !== 0) len = len || 1;

    // if (tokens) {
    //   this.tokens = tokens;
    // }
    // if (this.curr === 0) {
    //   this.start = new Date();
    // }

    // this.curr += len;

    // this.render();

    if (this.curr === this.total) {
      this.render(true, undefined);
      this.complete = true;
      // this.terminate();
      this.callback(this);
      return;
    }
  }

  render(force?: boolean, tokens?: Record<string, string>) {
    force !== undefined && force !== null ? force : false;
    if (tokens) {
      this.tokens = tokens;
    }
    // if (!isTTY) return;

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
    const total = this.total ?? 100;

    let str = this.fmt
      .replace(":current", this.curr + "")
      .replace(":total", total + "")
      .replace(":elapsed", isNaN(elapsed) ? "0.0" : (elapsed / 1000).toFixed(1))
      .replace(
        ":eta",
        isNaN(eta) || !isFinite(eta) ? "0.0" : (eta / 1000).toFixed(1)
      )
      .replace(":percent", percent.toFixed(0) + "%")
      .replace(":rate", Math.round(rate) + "");

    let availableSpace = Math.max(
      0,
      this.columns - str.replace(":bar", "").length
    );
    const isWindows = Deno.build.os === "windows";
    if (availableSpace && isWindows) {
      availableSpace -= 1;
    }

    const defaultWidth = this.width ?? this.total;
    const width = Math.min(defaultWidth, availableSpace);

    const completeLength = Math.round(width * ratio);
    let complete = Array(Math.max(0, completeLength + 1)).join(
      typeof this.complete === "string" ? this.complete : ""
    );
    const incomplete = Array(Math.max(0, width - completeLength + 1)).join(
      typeof this.incomplete === "string" ? this.incomplete : ""
    );

    if (completeLength > 0) {
      complete = complete.slice(0, -1) + this.head;
      return complete;
    }

    str = str.replace(":bar", complete + incomplete);

    if (this.tokens) {
      for (const key in this.tokens) {
        str = str.replace(":" + key, this.tokens[key]);
      }
    }

    if (this.#lastDraw !== str) {
      this.showCursor();
      this.stdoutWrite(str);
      this.clearLine(1);
      this.#lastDraw = str;
    }
  }

  private get columns(): number {
    return 100;
  }

  private showCursor(): void {
    this.stdoutWrite("\x1b[?25h");
  }

  private stdoutWrite(msg: string) {
    const encoder = new TextEncoder();
    Deno.writeAllSync(Deno.stdout, encoder.encode(msg));
  }

  private clearLine(direction: Direction = Direction.all): void {
    switch (direction) {
      case Direction.all:
        this.stdoutWrite("\x1b[2K");
        break;
      case Direction.left:
        this.stdoutWrite("\x1b[1K");
        break;
      case Direction.right:
        this.stdoutWrite("\x1b[0K");
        break;
    }
  }
}

const bar = new Progressbar("  :title [:bar] :percent :etas\n", {
  complete: "=",
  incomplete: "",
  width: 30,
  total: 100,
  renderThrottle: 1,
});

function forward() {
  bar.tick(1, { title: "forward " });
}

setTimeout(forward, 50);

// function backward() {
//   bar.tick(-1, { title: "backward" });
//   setTimeout(backward, 20);
// }

forward();
