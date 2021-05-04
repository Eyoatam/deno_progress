import { Progressbar } from "../src/progress.ts";
import { green, white } from "https://deno.land/std@0.95.0/fmt/colors.ts";

const bar = new Progressbar("  |:bar|", {
  complete: green("█"),
  incomplete: white("█"),
  total: 100,
  width: 50,
});

const _id = setInterval(() => {
  bar.tick(2);
  if (bar.complete === true) {
    clearInterval(_id);
  }
}, 50);
