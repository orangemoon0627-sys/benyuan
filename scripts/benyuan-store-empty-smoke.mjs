import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const dataDir = await mkdtemp(path.join(os.tmpdir(), "benyuan-store-corruption-"));
const storePath = path.join(dataDir, "benyuan-v3-store.json");
process.env.BENYUAN_DATA_ROOT = dataDir;
process.env.BENYUAN_V3_STORE_PATH = storePath;

try {
  const { readBenyuanV3Store, saveAuthRateLimit } = await import("../src/lib/benyuan-v3-store.ts");
  const initialized = await readBenyuanV3Store();
  assert.deepEqual(initialized.users, {}, "missing store should initialize once");

  const corruptPayload = "{not-valid-json";
  await writeFile(storePath, corruptPayload, "utf8");
  await assert.rejects(() => saveAuthRateLimit({
    key: "corrupt-write",
    data_cohort: "beta",
    data_environment: "staging",
    count: 1,
    reset_at: "2026-07-10T01:00:00.000Z",
    updated_at: "2026-07-10T00:00:00.000Z",
  }), /benyuan_store_corrupt/);
  assert.equal(await readFile(storePath, "utf8"), corruptPayload, "corrupt store must never be overwritten");

  await writeFile(storePath, `${JSON.stringify(initialized, null, 2)}\n`, "utf8");
  await saveAuthRateLimit({
    key: "recovered-write",
    data_cohort: "beta",
    data_environment: "staging",
    count: 1,
    reset_at: "2026-07-10T01:00:00.000Z",
    updated_at: "2026-07-10T00:00:00.000Z",
  });
  const recovered = await readBenyuanV3Store();
  assert.equal(recovered.auth_rate_limits["beta:recovered-write"]?.count, 1, "write queue must recover without a process restart");

  const legacyStoreSource = await readFile(new URL("../src/lib/store.ts", import.meta.url), "utf8");
  assert.match(legacyStoreSource, /stat\(STORE_FILE\)/, "legacy store must distinguish a missing file from read failures");
  assert.match(legacyStoreSource, /code\s*!==\s*"ENOENT"/, "legacy store must only initialize on ENOENT");
  assert.match(legacyStoreSource, /benyuan_legacy_store_corrupt/, "legacy store must fail closed on invalid JSON");
  console.log("store-corruption-smoke:ok fail-closed preservation and queue recovery verified");
} finally {
  await rm(dataDir, { recursive: true, force: true });
}
