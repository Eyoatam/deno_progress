import { Progressbar } from "../src/progress.ts";

const bar = new Progressbar("  |:bar| :percent", {
  total: 50,
  clear: true,
});

const id = setInterval(() => {
  bar.tick(6);
  if (bar.complete === true) {
    clearInterval(id);
  }
}, 500);
