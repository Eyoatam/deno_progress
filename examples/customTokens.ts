import { Progressbar } from "../src/progress.ts";

var list = ["file1", "file2", "file3", "file4"];

var bar = new Progressbar(
  ":percent eta: :eta downloading :current/:total :file",
  {
    total: list.length,
  },
);

var id = setInterval(function () {
  bar.tick({
    file: list[bar.curr],
  });
  if (bar.complete === true) {
    clearInterval(id);
  }
}, 500);
