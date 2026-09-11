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

patchFile("open-sse/config/providerModels.ts", (content) => {
  if (content.includes("/^muse-spark/i.test(bareModelId)")) return content;
  const needle = 'if (alias === "openai" && /-pro$/i.test(bareModelId)) return "openai-responses";';
  if (!content.includes(needle)) return content;
  const addition =
    '\n  if ((alias === "opencode" || alias === "oc" || alias === "opencode-zen" || alias === "opencode-go") && /^muse-spark/i.test(bareModelId)) return "openai-responses";';
  return content.replace(needle, needle + addition);
});

patchFile("open-sse/config/providers/registry/opencode/zen/index.ts", (content) => {
  if (content.includes('"muse-spark-1.3"')) return content;
  const needle = `    {
      id: "muse-spark-1.2-contributor-free",
      name: "Muse Spark 1.2 Contributor Free",
      supportsReasoning: true,
      targetFormat: "openai-responses",
    },`;
  if (!content.includes(needle)) return content;
  const addition = `
    {
      id: "muse-spark-1.3",
      name: "Muse Spark 1.3",
      supportsReasoning: true,
      targetFormat: "openai-responses",
    },
    {
      id: "muse-spark-1.3-contributor-free",
      name: "Muse Spark 1.3 Contributor Free",
      supportsReasoning: true,
      targetFormat: "openai-responses",
    },`;
  return content.replace(needle, needle + addition);
});

patchFile("open-sse/config/providers/registry/opencode/index.ts", (content) => {
  if (content.includes('"muse-spark-1.3"')) return content;
  const needle = `    {
      id: "muse-spark-1.2-contributor-free",
      name: "Muse Spark 1.2 Contributor Free",
      supportsReasoning: true,
      targetFormat: "openai-responses",
    },`;
  if (!content.includes(needle)) return content;
  const addition = `
    {
      id: "muse-spark-1.3",
      name: "Muse Spark 1.3",
      supportsReasoning: true,
      targetFormat: "openai-responses",
    },
    {
      id: "muse-spark-1.3-contributor-free",
      name: "Muse Spark 1.3 Contributor Free",
      supportsReasoning: true,
      targetFormat: "openai-responses",
    },`;
  return content.replace(needle, needle + addition);
});

patchFile("open-sse/config/providers/registry/opencode/go/index.ts", (content) => {
  if (content.includes('"muse-spark-1.3-contributor"')) return content;
  const needle = `    {
      id: "muse-spark-1.2-contributor-xhigh",
      name: "Muse Spark 1.2 Contributor (xhigh effort)",
      contextLength: 1048576,
      maxOutputTokens: 131072,
      supportsReasoning: true,
      supportsVision: true,
      supportsAudio: true,
      supportsVideo: true,
      targetFormat: "openai-responses",
    },`;
  if (!content.includes(needle)) return content;
  const tiers = ["minimal", "low", "medium", "high", "xhigh"];
  const tierBlocks = tiers
    .map(
      (tier) => `    {
      id: "muse-spark-1.3-contributor-${tier}",
      name: "Muse Spark 1.3 Contributor (${tier} effort)",
      contextLength: 1048576,
      maxOutputTokens: 131072,
      supportsReasoning: true,
      supportsVision: true,
      supportsAudio: true,
      supportsVideo: true,
      targetFormat: "openai-responses",
    },`,
    )
    .join("\n");
  const addition = `
    {
      id: "muse-spark-1.3-contributor",
      name: "Muse Spark 1.3 Contributor",
      contextLength: 1048576,
      maxOutputTokens: 131072,
      supportsReasoning: true,
      supportsVision: true,
      supportsAudio: true,
      supportsVideo: true,
      targetFormat: "openai-responses",
    },
${tierBlocks}`;
  return content.replace(needle, needle + addition);
});

patchFile("open-sse/executors/opencode.ts", (content) => {
  if (content.includes('"muse-spark-1.3-contributor"')) return content;
  const needle = '"muse-spark-1.2-contributor": ["minimal", "low", "medium", "high", "xhigh"],';
  if (!content.includes(needle)) return content;
  const addition =
    '\n  "muse-spark-1.3-contributor": ["minimal", "low", "medium", "high", "xhigh"],';
  return content.replace(needle, needle + addition);
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

    if (!content.includes("^muse-spark")) {
      const regex =
        /"openai"===([a-zA-Z0-9_$]+)&&\/-pro\$\/i\.test\(([a-zA-Z0-9_$]+)\)\?"openai-responses"/g;
      if (regex.test(content)) {
        content = content.replace(
          regex,
          '"openai"===$1&&/-pro$/i.test($2)?"openai-responses":("opencode"===$1||"oc"===$1||"opencode-zen"===$1||"opencode-go"===$1)&&/^muse-spark/i.test($2)?"openai-responses"',
        );
        changed = true;
      }
    }

    if (
      content.includes('{id:"muse-spark-1.2-contributor-free"') &&
      !content.includes('{id:"muse-spark-1.3"')
    ) {
      const needle =
        '{id:"muse-spark-1.2-contributor-free",name:"Muse Spark 1.2 Contributor Free",supportsReasoning:!0,targetFormat:"openai-responses"}';
      const replacement =
        '{id:"muse-spark-1.2-contributor-free",name:"Muse Spark 1.2 Contributor Free",supportsReasoning:!0,targetFormat:"openai-responses"},{id:"muse-spark-1.3",name:"Muse Spark 1.3",supportsReasoning:!0,targetFormat:"openai-responses"},{id:"muse-spark-1.3-contributor-free",name:"Muse Spark 1.3 Contributor Free",supportsReasoning:!0,targetFormat:"openai-responses"}';
      if (content.includes(needle)) {
        content = content.replace(needle, replacement);
        changed = true;
      }
    }

    if (
      content.includes('"muse-spark-1.2-contributor":["minimal","low","medium","high","xhigh"]') &&
      !content.includes('"muse-spark-1.3-contributor"')
    ) {
      const needle = '"muse-spark-1.2-contributor":["minimal","low","medium","high","xhigh"]';
      const replacement =
        '"muse-spark-1.2-contributor":["minimal","low","medium","high","xhigh"],"muse-spark-1.3-contributor":["minimal","low","medium","high","xhigh"]';
      content = content.replace(needle, replacement);
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(fullPath, content, "utf8");
    }
  }
}

patchChunks(path.join(APP_DIR, ".build/next/server/chunks"));
