import { Progressbar } from "../mod.ts";

var bar = new Progressbar(":bar :current/:total", { total: 100 });
var timer = setInterval(function () {
  bar.tick(2);
  if (bar.complete === true) {
    clearInterval(timer);
  } else if (bar.curr === 6) {
    bar.interrupt(
      "interrupt: current progress is " + bar.curr + "/" + bar.total,
    );
  }
}, 1000);
