import { run } from "node:test";
import { tap } from "node:test/reporters";
import process from "node:process";
import path from "path";

console.log("Running unit tests");
run({ files: [path.resolve("./src/test/feed.test.ts")], timeout: 15000 })
  .compose(tap)
  .pipe(process.stdout);
