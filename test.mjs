import fs from "fs";
import path from "path";

const INPUT_DIR = path.resolve("styles/gamma"); // root folder
const OUTPUT = path.resolve("styles/gamma/_gamma.vars.scss");

// --- recursively collect all .css files ---
function getCssFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return getCssFiles(fullPath);
    }

    if (entry.isFile() && entry.name.endsWith(".css")) {
      return [fullPath];
    }

    return [];
  });
}

// --- extract tokens from all files ---
const files = getCssFiles(INPUT_DIR);

let tokens = [];

for (const file of files) {
  const css = fs.readFileSync(file, "utf-8");

  const matches = [...css.matchAll(/--(gamma-[\w-]+)\s*:/g)];
  tokens.push(...matches.map(m => m[1]));
}

// --- dedupe + sort ---
const unique = [...new Set(tokens)].sort();

if (unique.length === 0) {
  console.error("❌ No gamma tokens found");
  process.exit(1);
}

// --- generate SCSS ---
let output = `// AUTO-GENERATED FILE - DO NOT EDIT\n\n`;

let currentGroup = "";

for (const token of unique) {
  const clean = token.replace("gamma-", "");
  const group = clean.split("-")[0];

  if (group !== currentGroup) {
    output += `\n// ${group}\n`;
    currentGroup = group;
  }

  output += `$${clean}: var(--${token});\n`;
}

fs.writeFileSync(OUTPUT, output);

console.log(`✅ Generated ${OUTPUT} from ${files.length} files`);
