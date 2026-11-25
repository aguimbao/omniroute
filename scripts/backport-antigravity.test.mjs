// podman run --rm --network=none --image-volume=ignore --entrypoint node -i IMAGE --input-type=module - < scripts/backport-antigravity.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const root = process.argv[2] ?? "/app";
const server = root + "/.build/next/server";
const require = createRequire(import.meta.url);
const exports = {};
require(server + "/chunks/10967.js").modules[48244]({}, exports, {
  d: (target, getters) => {
    for (const [key, get] of Object.entries(getters)) Object.defineProperty(target, key, { get });
  },
});
const { LF: family, ty: windows } = exports;
const geminiWindows = ["gemini_session", "gemini_weekly"];
const argonWindows = ["gemini_4_argon_weekly", "argon_weekly"];
const quotas = [...geminiWindows, "claude_gpt_weekly", ...argonWindows, "gemini-4-carbon"];
for (const model of [
  "agy/gemini-4-neon-high",
  "antigravity/gemini-4-hydrogen-sonar",
  "google/gemini-4-carbon-low",
]) {
  assert.equal(family(model), "gemini", model);
  assert.deepEqual(windows(quotas, model), geminiWindows, model);
}
assert.deepEqual(windows(quotas, "gemini-4-carbon"), ["gemini-4-carbon", ...geminiWindows]);
assert.deepEqual(windows(quotas, "agy/gemini-4-argon-high"), argonWindows);
for (const name of argonWindows) assert.equal(family(name), "argon");
assert.equal(family("claude-opus-5-5"), "claude");
assert.equal(family("gpt-oss-120b-medium"), "other");
assert.equal(family("claude_gpt_weekly"), "other");

const middleware = readFileSync(server + "/middleware.js", "utf8");
const worker = readFileSync(root + "/open-sse/services/compression/compressionWorker.js", "utf8");
assert(middleware.includes('"gemini_4_argon_weekly"===d||d.includes("argon")?"argon"'));
assert(worker.includes('bare === "gemini_4_argon_weekly" || bare.includes("argon"))'));

// Execute the shipped pure helper and the inlined refresh branch. Stub only its DB write.
const code = (file) => readFileSync(server + "/chunks/" + file, "utf8");
const helper = code("78338.js").match(
  /function ab\(psd, hasArgon\) \{[\s\S]*?\n\}(?=async function ac\()/,
)[0];
const refresh = code("17472.js").match(
  /function backportArgonEligibility\(psd, hasArgon\) \{[\s\S]*?(?=async function W\()/,
)[0];
const apply = new Function(helper + ";return ab;")();
let written;
const sync = new Function("i", refresh + ";return V;")({
  updateProviderConnection: async (_id, update) => {
    written = update.providerSpecificData;
  },
});
const [argon, broad, disabled, manual] = [
  "*argon*",
  "gemini-4*",
  "*-disabled",
  "gemini-4-carbon-low",
];
for (const [stored, ineligible, eligible] of [
  [[manual, broad, argon], [manual, argon], [manual]],
  [[argon, disabled, broad], [argon, disabled], [disabled]],
  [
    [manual, argon, disabled, broad],
    [manual, argon, disabled],
    [manual, disabled],
  ],
  [[broad], [argon, broad], [broad]],
  [
    [disabled, broad],
    [disabled, argon, broad],
    [disabled, broad],
  ],
  [
    [argon, disabled, broad, manual],
    [argon, disabled, broad, manual],
    [disabled, broad, manual],
  ],
  [
    [argon, broad, manual],
    [argon, broad, manual],
    [broad, manual],
  ],
  [[broad, broad, argon], [argon, broad], [broad]],
]) {
  const psd = { hasArgon: false, excludedModels: stored, inventory: ["unmodified"] };
  for (const [hasArgon, excludedModels] of [
    [false, ineligible],
    [true, eligible],
  ]) {
    const expected = { ...psd, hasArgon, excludedModels };
    const result = apply(psd, hasArgon);
    assert.deepEqual(result.nextPsd, expected);
    assert.equal(apply(result.nextPsd, hasArgon).changed, false);
    written = undefined;
    const connection = { id: "test", provider: "agy", providerSpecificData: psd };
    assert.deepEqual((await sync(connection, { hasArgon })).providerSpecificData, expected);
    assert.deepEqual(written, result.changed ? expected : undefined);
  }
  assert.deepEqual(apply(psd, undefined), { nextPsd: psd, changed: false });
}
assert.deepEqual(apply({}, false), {
  nextPsd: { hasArgon: false, excludedModels: [argon] },
  changed: true,
});
console.log("Antigravity backport regression passed against the image bundles");
