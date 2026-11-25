import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const app = process.argv[2] ?? "/app";
assert.equal(JSON.parse(readFileSync(join(app, "package.json"), "utf8")).version, "3.8.54");

// #21144 and the trailing signature left by the reverted local Sonar patch.
function backportArgonEligibility(psd, hasArgon) {
  const nextPsd = { ...psd };
  if (typeof hasArgon !== "boolean") return { nextPsd, changed: false };
  const argon = "*argon*";
  const broad = "gemini-4*";
  const disabled = "*-disabled";
  const stored = Array.isArray(psd.excludedModels) ? psd.excludedModels : [];
  const isLegacy = (rule, index, rules) =>
    rule === broad &&
    (rules[index + 1] === argon ||
      (index === rules.length - 1 && rules[index - 2] === argon && rules[index - 1] === disabled));
  let kept = stored.filter(
    (rule, index) => !isLegacy(rule, index, stored) && (rule !== argon || !hasArgon),
  );
  const missing = !hasArgon && !kept.includes(argon);
  const rulesChanged = missing || kept.length !== stored.length;
  if (rulesChanged) {
    // Don't create another migration signature from operator rules (even after removing one).
    if (missing || kept.some(isLegacy)) {
      kept = kept.filter((rule) => rule !== argon);
      const afterDisabled = kept.length === 2 && kept[0] === disabled && kept[1] === broad;
      kept.splice(afterDisabled ? 1 : 0, 0, argon);
    }
    nextPsd.excludedModels = kept;
  }
  nextPsd.hasArgon = hasArgon;
  return { nextPsd, changed: rulesChanged || psd.hasArgon !== hasArgon };
}

const server = ".build/next/server";
const worker = "open-sse/services/compression/compressionWorker.js";
const chunks = [
  4007, 4456, 4882, 8441, 9894, 10967, 12375, 14693, 16489, 21564, 29648, 32946, 36696, 43708,
  46216, 47290, 51188, 51689, 52654, 55095, 55697, 56316, 58625, 62544, 63442, 63762, 64233, 77514,
  78831, 89156, 89525, 94119, 96025, 99612,
];
const quotaPaths = new Set([
  worker,
  server + "/middleware.js",
  ...chunks.map((id) => server + "/chunks/" + id + ".js"),
]);
const inlined = server + "/chunks/17472.js";
const exported = server + "/chunks/78338.js";
const legacyList = '["gemini-4*","*argon*"]';
const oldEligibility =
  'let c,d,e,f={...a};if("boolean"!=typeof b)return{nextPsd:f,changed:!1};let g=b?function(a,b){let c=!1;if(!0!==a.hasArgon&&(b.hasArgon=!0,c=!0),!Array.isArray(a.excludedModels))return c;let d=new Set(LIST),e=a.excludedModels.filter(a=>"string"!=typeof a||!d.has(a));return e.length!==a.excludedModels.length&&(b.excludedModels=e,c=!0),c}(a,f):(c=!1,!1!==a.hasArgon&&(f.hasArgon=!1,c=!0),d=Array.isArray(a.excludedModels)?a.excludedModels.filter(a=>"string"==typeof a):[],(e=LIST.filter(a=>!d.includes(a))).length>0&&(f.excludedModels=[...d,...e],c=!0),c);return{nextPsd:f,changed:g}';

function replaceOnce(source, before, after, path) {
  assert.equal(source.split(before).length, 2, "Unexpected 3.8.54 bundle code: " + path);
  return source.replace(before, () => after);
}

const edits = new Map();
function inspect(dir) {
  for (const entry of readdirSync(join(app, dir), { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (path !== "node_modules") inspect(path);
      continue;
    }
    if (!entry.isFile() || !/\.[cm]?[jt]s$/.test(entry.name)) continue;
    let source = readFileSync(join(app, path), "utf8");
    const quota = quotaPaths.delete(path);
    const exclusion = path === inlined || path === exported;
    assert.equal(source.includes('startsWith("gemini-4")'), quota, "Quota-family copy: " + path);
    assert.equal(source.includes(legacyList), exclusion, "Argon-exclusion copy: " + path);
    if (quota) {
      // #20857: delete only the broad Argon predicate, leaving Claude/GPT intact.
      const argonBranch =
        path === worker
          ? 'bare === "argon_weekly" || bare === "gemini_4_argon_weekly" || bare.includes("argon") || bare.startsWith("gemini-4")'
          : '"argon_weekly"===d||"gemini_4_argon_weekly"===d||d.includes("argon")||d.startsWith("gemini-4")';
      source = replaceOnce(
        source,
        argonBranch,
        argonBranch.slice(0, argonBranch.lastIndexOf("||")).trimEnd(),
        path,
      );
    }
    // The standalone build inlines the helper in one refresh bundle and exports it in the other.
    if (path === inlined) {
      const call = "function(a,b){" + oldEligibility.replaceAll("LIST", "ak") + "}(m,b.hasArgon)";
      source = replaceOnce(
        source,
        "let ak=" + legacyList + ";async function V(",
        backportArgonEligibility.toString() + "\nasync function V(",
        path,
      );
      source = replaceOnce(source, call, "backportArgonEligibility(m,b.hasArgon)", path);
    }
    if (path === exported) {
      const before =
        "let aw=" +
        legacyList +
        ";function ab(a,b){" +
        oldEligibility.replaceAll("LIST", "aw") +
        "}";
      source = replaceOnce(
        source,
        before,
        backportArgonEligibility.toString().replace("backportArgonEligibility", "ab"),
        path,
      );
    }
    if (quota || exclusion) {
      assert(!source.includes('startsWith("gemini-4")') && !source.includes(legacyList), path);
      edits.set(path, source);
    }
  }
}

inspect(".");
assert.equal(quotaPaths.size, 0, "Missing quota-family bundle(s): " + [...quotaPaths]);
assert(edits.has(inlined) && edits.has(exported), "Missing Argon quota-refresh bundle(s)");
for (const [path, source] of edits) writeFileSync(join(app, path), source);
