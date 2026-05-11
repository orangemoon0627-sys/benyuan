#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

staging_host="${BENYUAN_STAGING_HOST:-120.26.126.88}"
staging_user="${BENYUAN_STAGING_USER:-root}"
ssh_key="${BENYUAN_STAGING_SSH_KEY:-$HOME/.ssh/benyuan_railway_ed25519}"
app_root="${BENYUAN_STAGING_APP_ROOT:-/opt/apps/benyuan-staging}"
app_port="${BENYUAN_STAGING_PORT:-3015}"
process_name="${BENYUAN_STAGING_PROCESS:-benyuan-staging}"
npm_registry="${BENYUAN_STAGING_NPM_REGISTRY:-https://registry.npmmirror.com}"
public_base_url="${BENYUAN_STAGING_PUBLIC_BASE_URL:-http://$staging_host}"
runtime_env_file="${BENYUAN_STAGING_ENV_FILE:-$app_root/shared/benyuan-runtime.env}"
expected_origin="${BENYUAN_EXPECTED_ORIGIN:-https://github.com/orangemoon0627-sys/benyuan.git}"
expected_origin_ssh="${BENYUAN_EXPECTED_ORIGIN_SSH:-git@github-benyuan:orangemoon0627-sys/benyuan.git}"
deploy_remote="${BENYUAN_DEPLOY_REMOTE:-benyuan}"
keep_releases="${BENYUAN_STAGING_KEEP_RELEASES:-5}"

allow_dirty=0
skip_checks=0
push_first=0
dry_run=0

usage() {
  cat <<EOF
Usage: npm run deploy:staging -- [options]

Build 本源 locally, upload the prebuilt release artifact to the staging ECS, restart PM2, and verify.

Options:
  --allow-dirty   Allow deploying with uncommitted local changes.
  --skip-checks   Skip local npm ci/lint/build checks. Requires an existing .next artifact.
  --push          Push current branch to the configured 本源 deploy remote before deploying.
  --dry-run       Print the planned deployment without changing the server.
  -h, --help      Show this help.

Environment overrides:
  BENYUAN_STAGING_HOST=$staging_host
  BENYUAN_STAGING_USER=$staging_user
  BENYUAN_STAGING_SSH_KEY=$ssh_key
  BENYUAN_STAGING_APP_ROOT=$app_root
  BENYUAN_STAGING_PORT=$app_port
  BENYUAN_STAGING_PUBLIC_BASE_URL=$public_base_url
  BENYUAN_STAGING_ENV_FILE=$runtime_env_file
  BENYUAN_DEPLOY_REMOTE=$deploy_remote
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --allow-dirty) allow_dirty=1 ;;
    --skip-checks) skip_checks=1 ;;
    --push) push_first=1 ;;
    --dry-run) dry_run=1 ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

log() {
  printf '\n[deploy:staging] %s\n' "$*"
}

run() {
  printf '+ %q' "$1"
  shift
  for arg in "$@"; do
    printf ' %q' "$arg"
  done
  printf '\n'
  if [ "$dry_run" = "0" ]; then
    "$@"
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command not found: $1" >&2
    exit 1
  fi
}

ssh_target="$staging_user@$staging_host"
ssh_base=(ssh -i "$ssh_key" -o BatchMode=yes -o ConnectTimeout=15 "$ssh_target")

remote_run() {
  printf '+ ssh %q %q\n' "$ssh_target" "$*"
  if [ "$dry_run" = "0" ]; then
    "${ssh_base[@]}" "$@"
  fi
}

stream_to_remote() {
  local description="$1"
  local remote_command="$2"
  log "$description"
  if [ "$dry_run" = "0" ]; then
    eval "$remote_command"
  else
    echo "+ $remote_command"
  fi
}

detect_expected_live() {
  if [ -n "${BENYUAN_EXPECT_LIVE:-}" ]; then
    printf '%s' "$BENYUAN_EXPECT_LIVE"
    return
  fi

  if [ "$dry_run" != "0" ]; then
    printf '0'
    return
  fi

  local live_value
  live_value="$("${ssh_base[@]}" "set -euo pipefail
if [ -f '$runtime_env_file' ]; then
  set -a
  . '$runtime_env_file'
  set +a
fi
printf '%s' \"\${BENYUAN_LLM_LIVE:-0}\"" 2>/dev/null || true)"
  if [ "$live_value" = "1" ] || [ "$live_value" = "true" ]; then
    printf '1'
  else
    printf '0'
  fi
}

cd "$repo_root"

require_command git
require_command npm
require_command tar
require_command ssh
require_command curl

if [ ! -f "$ssh_key" ]; then
  echo "SSH key not found: $ssh_key" >&2
  exit 1
fi

branch="$(git rev-parse --abbrev-ref HEAD)"
revision="$(git rev-parse HEAD)"
short_revision="$(git rev-parse --short=12 HEAD)"
release_id="$short_revision-$(date +%Y%m%d%H%M%S)"
release_dir="$app_root/releases/$release_id"
origin_url="$(git remote get-url origin 2>/dev/null || true)"
deploy_url="$(git remote get-url "$deploy_remote" 2>/dev/null || true)"
branch_remote="$(git config --get "branch.$branch.remote" 2>/dev/null || true)"
branch_push_remote="$(git config --get "branch.$branch.pushRemote" 2>/dev/null || true)"

log "Preflight"
echo "repo: $repo_root"
echo "branch: $branch"
echo "revision: $revision"
echo "origin: $origin_url"
echo "deploy remote: $deploy_remote -> $deploy_url"
echo "branch remote: ${branch_remote:-<unset>}"
echo "branch pushRemote: ${branch_push_remote:-<unset>}"
echo "target: $ssh_target:$app_root"
echo "public check: $public_base_url"
echo "runtime env file: $runtime_env_file"

if [ "$deploy_url" != "$expected_origin" ] && [ "$deploy_url" != "$expected_origin_ssh" ]; then
  cat >&2 <<EOF
Deploy remote does not point to the 本源 GitHub repository.

Expected: $expected_origin
      or: $expected_origin_ssh
Actual:   $deploy_remote -> $deploy_url

Fix:
  git remote add $deploy_remote $expected_origin
  # or, if it already exists:
  git remote set-url $deploy_remote $expected_origin
EOF
  exit 1
fi

if [ -n "$branch_remote" ] && [ "$branch_remote" != "$deploy_remote" ]; then
  cat >&2 <<EOF
Current branch is tracking a non-本源 remote.

Branch:  $branch
Expected remote: $deploy_remote
Actual remote:   $branch_remote

Fix this worktree-specific config before deploying:
  git config --worktree branch.$branch.remote $deploy_remote
  git config --worktree branch.$branch.merge refs/heads/$branch
EOF
  exit 1
fi

if [ -n "$branch_push_remote" ] && [ "$branch_push_remote" != "$deploy_remote" ]; then
  cat >&2 <<EOF
Current branch pushRemote is not the 本源 deploy remote.

Branch:  $branch
Expected pushRemote: $deploy_remote
Actual pushRemote:   $branch_push_remote

Fix:
  git config --worktree branch.$branch.pushRemote $deploy_remote
EOF
  exit 1
fi

if [ "$allow_dirty" = "0" ] && [ -n "$(git status --porcelain)" ]; then
  cat >&2 <<EOF
Working tree is not clean. Commit or stash changes before deploying.

To intentionally deploy local uncommitted changes:
  npm run deploy:staging -- --allow-dirty
EOF
  git status --short >&2
  exit 1
fi

if [ "$push_first" = "1" ]; then
  log "Pushing $branch to $deploy_remote"
  run git git push "$deploy_remote" "$branch"
fi

if [ "$skip_checks" = "0" ]; then
  log "Local verification"
  run npm npm ci --no-audit --no-fund
  run npm npm run lint
  run npm npm run build
else
  log "Skipping local npm ci/lint/build checks"
fi

if [ ! -d "$repo_root/.next" ]; then
  echo "Missing .next build artifact. Run npm run build first or remove --skip-checks." >&2
  exit 1
fi

log "Checking SSH and server runtime"
remote_run "node -v && npm -v && pm2 -v >/dev/null && nginx -v 2>&1"

log "Preparing remote release $release_id"
remote_run "set -euo pipefail
mkdir -p '$app_root/releases' '$app_root/shared'
rm -rf '$release_dir'
mkdir -p '$release_dir'
if [ ! -e '$app_root/shared/data' ]; then
  if [ -d '$app_root/current/data' ] && [ ! -L '$app_root/current/data' ]; then
    cp -a '$app_root/current/data' '$app_root/shared/data'
  else
    mkdir -p '$app_root/shared/data'
  fi
fi"

if [ "$allow_dirty" = "0" ]; then
  stream_to_remote "Uploading committed source archive" \
    "git archive --format=tar HEAD | ssh -i '$ssh_key' -o BatchMode=yes '$ssh_target' \"tar -xf - -C '$release_dir'\""
else
  stream_to_remote "Uploading working tree source archive" \
    "COPYFILE_DISABLE=1 tar --no-xattrs --exclude='.git' --exclude='.next' --exclude='node_modules' --exclude='output' --exclude='data' --exclude='.playwright-cli' -cf - . | ssh -i '$ssh_key' -o BatchMode=yes '$ssh_target' \"tar -xf - -C '$release_dir'\""
fi

remote_run "set -euo pipefail
printf '%s\n' '$revision' > '$release_dir/REVISION'
ln -sfn '$app_root/shared/data' '$release_dir/data'"

stream_to_remote "Uploading local Next.js build artifact" \
  "COPYFILE_DISABLE=1 tar --no-xattrs --exclude='.next/cache' --exclude='.next/dev' -czf - .next | ssh -i '$ssh_key' -o BatchMode=yes '$ssh_target' \"cd '$release_dir' && rm -rf .next && tar -xzf - && find .next -name '._*' -type f -delete && chown -R root:root .next\""

log "Installing production dependencies and restarting PM2"
remote_run "set -euo pipefail
cd '$release_dir'
npm ci --omit=dev --no-audit --no-fund --registry='$npm_registry'
ln -sfn '$release_dir' '$app_root/current'
if [ -f '$runtime_env_file' ]; then
  set -a
  . '$runtime_env_file'
  set +a
fi
export NODE_ENV=production
export BENYUAN_RUNTIME_ENV_FILE='$runtime_env_file'
export BENYUAN_DATA_ROOT='$app_root/shared/data'
pm2 delete '$process_name' >/dev/null 2>&1 || true
pm2 start ./node_modules/next/dist/bin/next --name '$process_name' --update-env -- start -p '$app_port' -H 127.0.0.1
pm2 save
pm2 startup systemd -u '$staging_user' --hp '/$staging_user' >/dev/null || true
current_release=\"\$(readlink -f '$app_root/current')\"
find '$app_root/releases' -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\\n' \
  | sort -rn \
  | tail -n +$((keep_releases + 1)) \
  | cut -d' ' -f2- \
  | while IFS= read -r old_release; do
      if [ \"\$old_release\" = \"\$current_release\" ]; then
        continue
      fi
      rm -rf \"\$old_release\"
    done"

log "Remote verification"
remote_run "set -euo pipefail
curl -fsS 'http://127.0.0.1:$app_port/' >/tmp/benyuan-next-root.html
curl -fsS 'http://127.0.0.1/' >/tmp/benyuan-nginx-root.html
pm2 describe '$process_name' | sed -n '1,60p'
wc -c /tmp/benyuan-next-root.html /tmp/benyuan-nginx-root.html"

log "Public smoke checks"
if [ "$dry_run" = "0" ]; then
  expected_live="$(detect_expected_live)"
  BENYUAN_BASE_URL="$public_base_url" BENYUAN_EXPECT_LIVE="$expected_live" npm run smoke:runtime:gate
  BENYUAN_BASE_URL="$public_base_url" npm run smoke:runtime:page
  BENYUAN_BASE_URL="$public_base_url" node --input-type=module -e "const base=process.env.BENYUAN_BASE_URL; const res=await fetch(base + '/api/analysis/runtime?mode=deep&engine=hybrid'); if(!res.ok) throw new Error('runtime API failed: ' + res.status); const data=await res.json(); console.log(JSON.stringify(data.runtime ?? data).slice(0, 500));"
else
  echo "+ BENYUAN_BASE_URL=$public_base_url BENYUAN_EXPECT_LIVE=<from BENYUAN_EXPECT_LIVE or server BENYUAN_LLM_LIVE> npm run smoke:runtime:gate"
  echo "+ BENYUAN_BASE_URL=$public_base_url npm run smoke:runtime:page"
  echo "+ BENYUAN_BASE_URL=$public_base_url node --input-type=module -e <runtime-api-smoke>"
fi

log "Deployed $release_id"
echo "URL: $public_base_url"
