// deno-lint-ignore-file

export interface BarOptions {
  total: number;
  curr?: number;
  width?: number;
  clear?: boolean;
  complete?: string;
  incomplete?: string;
  head?: string;
  renderThrottle?: number;
  callback?: any;
}
/**
 * Initialize a `Progressbar` with the given `fmt` string and `options`
 *
 * Example
 *
 * ```ts
 * import { Progressbar } from "../src/progress.ts";
 *
 *const bar = new Progressbar("  :title |:bar| eta: :eta :percent", {
 *  total: 100,
 *});
 *
 *const id = setInterval(() => {
 *  bar.tick(1, { title: "progress " });
 *
 *  if (bar.complete === true) {
 *    clearInterval(id);
 *  }
 *}, 50);
 *
 * ```
 *
 * @param fmt
 * @param options
 */
export declare class Progressbar {
  #private;
  fmt: string;
  total: number;
  curr: number;
  width?: number;
  clear?: boolean;
  complete?: string | boolean;
  incomplete?: string | boolean;
  renderThrottle?: number;
  head?: string;
  callback?: any;
  tokens: Record<string, string>;
  start: Date | number;
  constructor(fmt: string, options: BarOptions);
  /**
   * "tick" the progress bar with `length` and optional `tokens`.
   *
   * @param length
   * @param tokens
   */
  tick(
    length: number | Record<string, string>,
    tokens?: Record<string, string>
  ): void;
  /**
   * render the progress bar with optional `tokens` and optional `force`
   * to place in the progress bar's `fmt` field.
   *
   * @param tokens
   * @param force
   */
  render(force?: boolean, tokens?: Record<string, string>): void;
  /**
   * "interrupt" the progress bar and write a message above it.
   * @param message The message to write.
   */
  interrupt(msg: string): void;
  /**
   * "update" the progress bar to represent an exact percentage.
   * @param ratio
   * @param tokens
   */
  update(ratio: number, tokens: Record<string, string>): void;
  /**
   * "terminate" the progress bar
   */
  terminate(): void;
  private moveCursor;
  private write;
  private clearProgress;
}
