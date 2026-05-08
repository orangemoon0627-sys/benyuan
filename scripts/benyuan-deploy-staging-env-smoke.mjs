#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const scriptPath = path.join(process.cwd(), "scripts", "deploy-staging.sh");
const source = readFileSync(scriptPath, "utf8");

assert.match(source, /BENYUAN_STAGING_ENV_FILE/, "deploy script should expose a server-side env file override");
assert.match(source, /set -a[\s\S]*\$runtime_env_file[\s\S]*set \+a/, "deploy script should export variables from the private runtime env file before starting PM2");
assert.match(source, /--update-env/, "PM2 restart should refresh its process environment");

console.log("deploy-staging-env:ok");
