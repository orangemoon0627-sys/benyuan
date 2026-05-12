#!/usr/bin/env bash
set -euo pipefail

staging_host="${BENYUAN_STAGING_HOST:-120.26.126.88}"
staging_user="${BENYUAN_STAGING_USER:-root}"
ssh_key="${BENYUAN_STAGING_SSH_KEY:-$HOME/.ssh/benyuan_railway_ed25519}"
app_root="${BENYUAN_STAGING_APP_ROOT:-/opt/apps/benyuan-staging}"
runtime_env_file="${BENYUAN_STAGING_ENV_FILE:-$app_root/shared/benyuan-runtime.env}"
provider_name="${BENYUAN_CUSTOM_PROVIDER_NAME:-xiaoye}"
base_url="${BENYUAN_CUSTOM_BASE_URL:-https://subapi.xiaoye.lol}"
model="${BENYUAN_CUSTOM_MODEL:-gpt-5.5}"
reasoning_effort="${BENYUAN_CUSTOM_REASONING_EFFORT:-xhigh}"
speed_profile="${BENYUAN_AGENT_SPEED_PROFILE:-quality}"
provider_timeout_ms="${BENYUAN_PROVIDER_TIMEOUT_MS:-360000}"
provider_soft_timeout_ms="${BENYUAN_PROVIDER_SOFT_TIMEOUT_MS:-90000}"
live="${BENYUAN_LLM_LIVE:-1}"
process_name="${BENYUAN_STAGING_PROCESS:-benyuan-staging}"

usage() {
  cat <<EOF
Usage: bash scripts/configure-staging-llm.sh [options]

Write 本源 staging LLM runtime variables to the private server env file and restart PM2.
The API key is read from a hidden prompt unless OPENAI_API_KEY is already exported.

Options:
  --dry-run      Print target and non-secret runtime values only.
  -h, --help     Show this help.

Environment overrides:
  BENYUAN_STAGING_HOST=$staging_host
  BENYUAN_STAGING_USER=$staging_user
  BENYUAN_STAGING_SSH_KEY=$ssh_key
  BENYUAN_STAGING_ENV_FILE=$runtime_env_file
  BENYUAN_CUSTOM_PROVIDER_NAME=$provider_name
  BENYUAN_CUSTOM_BASE_URL=$base_url
  BENYUAN_CUSTOM_MODEL=$model
  BENYUAN_CUSTOM_REASONING_EFFORT=$reasoning_effort
  BENYUAN_AGENT_SPEED_PROFILE=$speed_profile
EOF
}

dry_run=0
while [ "$#" -gt 0 ]; do
  case "$1" in
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

if [ ! -f "$ssh_key" ]; then
  echo "SSH key not found: $ssh_key" >&2
  exit 1
fi

api_key="${OPENAI_API_KEY:-}"
if [ "$dry_run" = "0" ] && [ -z "$api_key" ]; then
  printf "Enter staging LLM API key (hidden): " >&2
  if [ -t 0 ]; then
    stty -echo
  fi
  IFS= read -r api_key
  if [ -t 0 ]; then
    stty echo
  fi
  printf "\n" >&2
fi

if [ "$dry_run" = "0" ] && [ -z "$api_key" ]; then
  echo "Missing API key." >&2
  exit 1
fi

ssh_target="$staging_user@$staging_host"
ssh_base=(ssh -i "$ssh_key" -o BatchMode=yes -o ConnectTimeout=15 "$ssh_target")

echo "[configure-staging-llm] target: $ssh_target:$runtime_env_file"
echo "[configure-staging-llm] provider: $provider_name"
echo "[configure-staging-llm] base_url: $base_url"
echo "[configure-staging-llm] model: $model"
echo "[configure-staging-llm] live: $live"
echo "[configure-staging-llm] speed_profile: $speed_profile"

if [ "$dry_run" = "1" ]; then
  echo "[configure-staging-llm] dry-run: no server changes."
  exit 0
fi

env_payload="$(cat <<EOF
BENYUAN_LLM_LIVE=$live
BENYUAN_LLM_PROVIDER=custom
BENYUAN_CUSTOM_PROVIDER_NAME=$provider_name
BENYUAN_MODEL_PROVIDER=$provider_name
BENYUAN_CUSTOM_BASE_URL=$base_url
BENYUAN_OPENAI_BASE_URL=$base_url
BENYUAN_CUSTOM_MODEL=$model
BENYUAN_OPENAI_MODEL=$model
BENYUAN_CUSTOM_REASONING_EFFORT=$reasoning_effort
BENYUAN_AGENT_SPEED_PROFILE=$speed_profile
BENYUAN_PROVIDER_TIMEOUT_MS=$provider_timeout_ms
BENYUAN_PROVIDER_SOFT_TIMEOUT_MS=$provider_soft_timeout_ms
OPENAI_API_KEY=$api_key
EOF
)"

remote_dir="$(dirname "$runtime_env_file")"
printf "%s\n" "$env_payload" | "${ssh_base[@]}" "mkdir -p '$remote_dir' && umask 077 && cat > '$runtime_env_file' && chmod 600 '$runtime_env_file'"

"${ssh_base[@]}" "set -euo pipefail
if command -v pm2 >/dev/null 2>&1 && pm2 describe '$process_name' >/dev/null 2>&1; then
  set -a
  . '$runtime_env_file'
  set +a
  pm2 restart '$process_name' --update-env
  pm2 save
else
  echo 'PM2 process not found; env file written only.'
fi"

echo "[configure-staging-llm] env written and PM2 refreshed."
