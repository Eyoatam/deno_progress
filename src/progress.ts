interface BarOptions {
  total: number;
  curr?: number;
  width?: number;
  clear?: boolean;
  complete?: string;
  incomplete?: string;
  head?: string;
  renderThrottle?: number;
  // deno-lint-ignore no-explicit-any
  callback?: any;
}

/**
 * Initialize a `Progressbar` with the given `fmt` string and `options`
 *
 * Options:
 *
 *   - `curr` current completed index
 *   - `total` total number of ticks to complete
 *   - `width` the displayed width of the progress bar defaulting to total
 *   - `head` head character defaulting to complete character
 *   - `complete` completion character defaulting to "█"
 *   - `incomplete` incomplete character defaulting to "░"
 *   - `renderThrottle` minimum time between updates in milliseconds defaulting to 16
 *   - `callback` optional function to call when the progress bar completes
 *   - `clear` will clear the progress bar upon termination
 *
 * Mehods:
 *   - `tick` tick the progress bar with the given `length` and optional `tokens`
 *   - `render` render the progress bar with optional `tokens` and optional `force`
 *   - `interrupt` interrupt the progress bar and write a message above it.
 *   - `terminate` terminates the progress bar
 *
 * Tokens:
 *
 *   - `:bar` the progress bar itself
 *   - `:current` current tick number
 *   - `:total` total ticks
 *   - `:elapsed` time elapsed in seconds
 *   - `:percent` completion percentage
 *   - `:eta` eta in seconds
 *   - `:rate` rate of ticks per second
 *
 * @param fmt @type {string}
 * @param options @type {object|number}
 */

export class Progressbar {
  fmt: string;
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

  /**
   * "tick" the progress bar with `length` and optional `tokens`.
   *
   * @param len @type {number|object}
   * @param tokens @type {object}
   * @api public
   */

  tick(
    length: number | Record<string, string>,
    tokens?: Record<string, string>,
  ) {
    // set length to one if the length passed is equal to 0
    length && length === 0 ? (length = 1) : length;

    // swap len and tokens
    if ("object" == typeof length) (tokens = length), (length = 1);
    if (tokens) this.tokens = tokens;

    // start time for estimated tim eof arrival
    if (0 == this.curr) this.start = new Date();
    this.curr += length;

    // render the progress bar
    if (this.curr < this.total) {
      this.render(true);
    }

    // complete progress and terminate progress bar
    if (this.curr >= this.total) {
      this.render(false, undefined);
      this.complete = true;
      this.terminate();
      this.callback(this);
      return;
    }
  }

  /**
   * render the progress bar with optional `tokens` and optional `force`
   * to place in the progress bar's `fmt` field.
   *
   * @param tokens @type {object}
   * @param force @type {boolean}
   */

  render(force?: boolean, tokens?: Record<string, string>) {
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

    /** populate progress bar with tokens, percentages and timestamps */
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

    /** calculate available space for the bar */
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

    /* add head to the complete string */
    if (completeLength > 0) complete = complete.slice(0, -1) + this.head;

    /* fill in the actual progress bar */
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

  /**
   * "interrupt" the progress bar and write a message above it.
   * @param message @type {string} The message to write.
   */

  interrupt(msg: string): void {
    // clear the current line
    this.write("\x1b[1K");
    // move the cursor to the start of the line
    this.moveCursor();
    // write the message text
    this.write(msg);
    // terminate the line after writing the message
    this.write("\n");
    // re-display the progress bar with its lastDraw
    this.write(this.#lastDraw);
  }

  /**
   * "terminate" the progress bar
   */

  terminate(): void {
    // clear the current line
    this.clearProgress();
    // move cursor to the start of the line
    this.moveCursor();
  }

  private moveCursor(): void {
    this.write("\x1b[?25h");
  }

  private write(msg: string): void {
    const encoder = new TextEncoder();
    Deno.stderr.writeSync(encoder.encode(msg));
  }

  private clearProgress(): void {
    if (this.clear === true) {
      console.clear();
    } else {
      return;
    }
  }
}
