import fs from "node:fs";
import path from "node:path";

const APP_DIR = process.env.APP_DIR || "/app";

function patchFile(relPath, patcher) {
  const fullPath = path.join(APP_DIR, relPath);
  if (!fs.existsSync(fullPath)) return;
  const original = fs.readFileSync(fullPath, "utf8");
  const updated = patcher(original);
  if (updated !== original) {
    fs.writeFileSync(fullPath, updated, "utf8");
  }
}

patchFile("open-sse/config/providers/registry/orcarouter/index.ts", (content) => {
  if (content.includes('baseUrl: "https://api.orcarouter.ai/v1/chat/completions"')) return content;
  const needle = 'baseUrl: "https://api.orcarouter.ai/v1",';
  if (!content.includes(needle)) return content;
  return content.replace(needle, 'baseUrl: "https://api.orcarouter.ai/v1/chat/completions",');
});

function patchChunks(chunksDir) {
  if (!fs.existsSync(chunksDir)) return;
  const entries = fs.readdirSync(chunksDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(chunksDir, entry.name);
    if (entry.isDirectory()) {
      patchChunks(fullPath);
      continue;
    }
    if (!entry.name.endsWith(".js")) continue;

    let content = fs.readFileSync(fullPath, "utf8");
    let changed = false;

    if (
      content.includes('baseUrl:"https://api.orcarouter.ai/v1"') &&
      !content.includes('baseUrl:"https://api.orcarouter.ai/v1/chat/completions"')
    ) {
      content = content.replaceAll(
        'baseUrl:"https://api.orcarouter.ai/v1"',
        'baseUrl:"https://api.orcarouter.ai/v1/chat/completions"',
      );
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(fullPath, content, "utf8");
    }
  }
}

patchChunks(path.join(APP_DIR, ".build/next"));
