import { Progressbar } from "../src/progress.ts";

const bar = new Progressbar("  :title |:bar| :percent", {
  total: 100,
});

function forward() {
  bar.tick(1, { title: "forward " });
  if (bar.curr > 60) {
    backward();
  } else {
    setTimeout(forward, 20);
  }
}

function backward() {
  bar.tick(-1, { title: "backward" });
  if (bar.curr == 0) {
    bar.terminate();
  } else {
    setTimeout(backward, 20);
  }
}

forward();
