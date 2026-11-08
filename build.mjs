import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SRC = join(ROOT, "src");
const read = (path) => readFileSync(join(SRC, path), "utf8");

function moduleAsObject(source, name, prelude = "") {
  const names = [...source.matchAll(/^export\s+(?:const|function|let)\s+([A-Za-z0-9_$]+)/gm)].map((m) => m[1]);
  const body = source.replace(/^import .*$/gm, "").replace(/^export /gm, "");
  return `const ${name} = (() => {\n${prelude}\n${body}\nreturn { ${names.join(", ")} };\n})();\n`;
}

const kit = moduleAsObject(read("kit/iso-kit.mjs"), "k");
const lathe = moduleAsObject(read("kit/lathe.mjs"), "G", "const { cameraOf, iso, pathOf } = k;");
const lib = read("lib.js");
const dir = (d) => readdirSync(join(SRC, d)).filter((f) => f.endsWith(".js")).sort().map((f) => `/* ${d}/${f} */\n` + read(join(d, f))).join("\n");
const figures = dir("figures");
const course = "const COURSE = [];\n" + dir("course");
const labs = read("lab3d.js") + "\n" + dir("labs3d");
const site = read("site.js");
const guideData = existsSync(join(SRC, "guide-data.json")) ? read("guide-data.json") : "{}";
const guide = `const GUIDE_DATA = ${guideData};\n` + read("guide-steps.js") + "\n" + read("guide.js");
const script = [kit, lathe, lib, figures, course, labs, guide, site].join("\n");

const css = read("kit/iso.css") + "\n" + read("site.css");
const html = read("index.html")
  .replace("/*__CSS__*/", () => css)
  .replace("/*__SCRIPT__*/", () => script.replace(/<\/script/g, "<\\/script"));
writeFileSync(join(ROOT, "index.html"), html);

const bannerScript = [kit, lathe, lib, figures].join("\n");
const banner = read("banner.html")
  .replace("/*__CSS__*/", () => css)
  .replace("/*__SCRIPT__*/", () => bannerScript.replace(/<\/script/g, "<\\/script"));
writeFileSync(join(ROOT, "banner.html"), banner);
console.log("wrote index.html", (html.length / 1024).toFixed(0) + " KB");
