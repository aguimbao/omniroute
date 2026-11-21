import { DatabaseSync } from "node:sqlite";
import { createDecipheriv, scryptSync } from "node:crypto";
import { existsSync } from "node:fs";

const PREFIX = "enc:v1:";
const secret = process.env.STORAGE_ENCRYPTION_KEY;
const key = secret ? scryptSync(secret, "omniroute-field-encryption-v1", 32) : null;

function decrypt(value) {
  if (typeof value !== "string" || !value.startsWith(PREFIX)) return value;
  if (!key) throw new Error("STORAGE_ENCRYPTION_KEY is required to decrypt credentials");
  const [iv, data, tag] = value.slice(PREFIX.length).split(":");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"), {
    authTagLength: 16,
  });
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  return decipher.update(data, "hex", "utf8") + decipher.final("utf8");
}

const file = `${process.env.DATA_DIR ?? "/app/data"}/storage.sqlite`;
const out = {};

if (existsSync(file)) {
  const db = new DatabaseSync(file, { readOnly: true });
  const hasTable = db
    .prepare("SELECT 1 FROM sqlite_master WHERE name = 'provider_connections'")
    .get();
  const rows = hasTable
    ? db
        .prepare(
          `SELECT provider, email, access_token, refresh_token, id_token, expires_at
           FROM provider_connections
           WHERE auth_type = 'oauth' AND refresh_token IS NOT NULL AND refresh_token != ''
           ORDER BY provider, priority`,
        )
        .all()
    : [];
  for (const row of rows) {
    (out[row.provider] ??= []).push({
      email: row.email,
      accessToken: decrypt(row.access_token),
      refreshToken: decrypt(row.refresh_token),
      idToken: decrypt(row.id_token),
      expiresAt: row.expires_at,
    });
  }
}

process.stdout.write(JSON.stringify(out));
