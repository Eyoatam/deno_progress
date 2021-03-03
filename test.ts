import { Progressbar } from "./mod.ts";

const bar = new Progressbar(":current: :token1 :token2", { total: 3 });
bar.tick({
  token1: "Hello",
  token2: "World!\n",
});
