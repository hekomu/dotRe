import { readFile } from "node:fs/promises";
import { analyzePhoto } from "./ai/analyze.js";

const file = process.argv[2];
if (!file) {
  console.error("usage: node test-analyze.js <image>");
  process.exit(2);
}

const result = await analyzePhoto(await readFile(file), process.argv[3] || "normal");
console.log(JSON.stringify(result, null, 2));