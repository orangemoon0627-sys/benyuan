import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function readRequired(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`missing required deploy file: ${relativePath}`);
  }
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const deployScript = readRequired("scripts/deploy-staging.sh");
const workflow = readRequired(".github/workflows/benyuan-staging.yml");

const localCi = "run npm npm ci --no-audit --no-fund";
const localBuild = "run npm npm run build";
assert(
  deployScript.includes(localCi),
  "deploy-staging.sh must run npm ci locally before building",
);
assert(
  deployScript.includes(localBuild),
  "deploy-staging.sh must run npm run build locally",
);
assert(
  deployScript.indexOf(localCi) < deployScript.indexOf(localBuild),
  "local npm ci must run before local npm run build",
);
assert(
  deployScript.includes("npm ci --omit=dev --no-audit --no-fund"),
  "server install must use npm ci --omit=dev --no-audit --no-fund",
);

const remoteInstallStart = deployScript.indexOf(
  'log "Installing production dependencies and restarting PM2"',
);
const remoteVerifyStart = deployScript.indexOf('log "Remote verification"');
assert(remoteInstallStart !== -1, "missing remote install section");
assert(remoteVerifyStart !== -1, "missing remote verification section");
const remoteInstallSection = deployScript.slice(remoteInstallStart, remoteVerifyStart);
assert(
  !/(npm\s+run\s+build|next\s+build)/.test(remoteInstallSection),
  "server install/restart section must not build Next.js",
);

assert(
  workflow.includes("npm ci --no-audit --no-fund"),
  "GitHub workflow must install dependencies on the runner",
);
assert(
  workflow.includes("npm run build"),
  "GitHub workflow must build on the runner",
);
assert(
  workflow.includes("npm run deploy:staging -- --skip-checks"),
  "GitHub workflow must deploy the prebuilt .next artifact with --skip-checks",
);
assert(
  workflow.includes('git config "branch.${GITHUB_REF_NAME}.remote" benyuan'),
  "GitHub workflow must align the dispatch branch tracking remote to benyuan",
);
assert(
  !workflow.includes("BENYUAN_STAGING_SSH_KEY: ${{ runner.temp }}"),
  "GitHub workflow must not use runner context in job-level env",
);
assert(
  workflow.includes("BENYUAN_STAGING_SSH_KEY: /tmp/benyuan_staging_ed25519"),
  "GitHub workflow must use a dispatch-parse-safe SSH key path",
);

const deploySurfaces = `${deployScript}\n${workflow}`;
for (const forbidden of ["darwin-api.service", "/opt/darwin-api", "127.0.0.1:3201", " 3201"]) {
  assert(
    !deploySurfaces.includes(forbidden),
    `本源 deploy surface must not reference 达尔文 marker: ${forbidden}`,
  );
}

console.log("deploy-artifact-smoke:ok prebuilt artifact deployment is enforced");
