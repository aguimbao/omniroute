import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createCipheriv, randomBytes, scryptSync } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const secret = "test-key";
const enc = (value) => {
  const iv = randomBytes(16);
  const cipher = createCipheriv(
    "aes-256-gcm",
    scryptSync(secret, "omniroute-field-encryption-v1", 32),
    iv,
  );
  const data = cipher.update(value, "utf8", "hex") + cipher.final("hex");
  return `enc:v1:${iv.toString("hex")}:${data}:${cipher.getAuthTag().toString("hex")}`;
};

test("exports decrypted oauth connections grouped by provider", () => {
  const dir = mkdtempSync(join(tmpdir(), "export-connections-"));
  const db = new DatabaseSync(join(dir, "storage.sqlite"));
  db.exec(`CREATE TABLE provider_connections (
    provider TEXT, auth_type TEXT, email TEXT, access_token TEXT, refresh_token TEXT,
    id_token TEXT, expires_at TEXT, priority INTEGER)`);
  const insert = db.prepare("INSERT INTO provider_connections VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insert.run("codex", "oauth", "a@b.c", enc("at"), enc("rt"), enc("it"), "2030-01-01", 1);
  insert.run("antigravity", "oauth", "d@e.f", "plain-at", "plain-rt", null, null, 1);
  insert.run("openrouter", "apikey", null, null, null, null, null, 1);
  db.close();

  const out = execFileSync(process.execPath, ["--no-warnings", "scripts/export-connections.mjs"], {
    env: { ...process.env, DATA_DIR: dir, STORAGE_ENCRYPTION_KEY: secret },
  });
  assert.deepEqual(JSON.parse(out), {
    antigravity: [
      {
        email: "d@e.f",
        accessToken: "plain-at",
        refreshToken: "plain-rt",
        idToken: null,
        expiresAt: null,
      },
    ],
    codex: [
      {
        email: "a@b.c",
        accessToken: "at",
        refreshToken: "rt",
        idToken: "it",
        expiresAt: "2030-01-01",
      },
    ],
  });
});
