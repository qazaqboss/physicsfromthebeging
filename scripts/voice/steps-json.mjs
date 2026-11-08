// Prints the guide script (src/guide-steps.js) as JSON: node scripts/voice/steps-json.mjs > steps.json
import { readFileSync } from "node:fs";
const src = readFileSync(new URL("../../src/guide-steps.js", import.meta.url), "utf8");
const GUIDE_STEPS = new Function(src + "; return GUIDE_STEPS;")();
process.stdout.write(JSON.stringify(GUIDE_STEPS));
