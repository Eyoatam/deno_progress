import { Progressbar } from "../src/progress.ts";

const list = ["file1", "file2", "file3", "file4"];

const bar = new Progressbar(
  ":percent eta: :eta downloading :current/:total :file",
  {
    total: list.length,
  },
);

const _id = setInterval(function () {
  bar.tick({
    file: list[bar.curr],
  });
  if (bar.complete === true) {
    clearInterval(_id);
  }
}, 500);
