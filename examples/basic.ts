import { Progressbar } from "../src/progress.ts";

const bar = new Progressbar("  :title |:bar| eta: :eta :percent", {
  total: 100,
  width: 50,
  complete: "#",
  incomplete: "-",
});

const id = setInterval(() => {
  bar.tick(1, { title: "progress " });
  if (bar.complete === true) {
    clearInterval(id);
  }
}, 50);