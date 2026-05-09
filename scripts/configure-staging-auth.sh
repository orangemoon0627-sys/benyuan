#!/usr/bin/env bash
set -euo pipefail

staging_host="${BENYUAN_STAGING_HOST:-120.26.126.88}"
staging_user="${BENYUAN_STAGING_USER:-root}"
ssh_key="${BENYUAN_STAGING_SSH_KEY:-$HOME/.ssh/benyuan_railway_ed25519}"
app_root="${BENYUAN_STAGING_APP_ROOT:-/opt/apps/benyuan-staging}"
runtime_env_file="${BENYUAN_STAGING_ENV_FILE:-$app_root/shared/benyuan-runtime.env}"
process_name="${BENYUAN_STAGING_PROCESS:-benyuan-staging}"

dry_run=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) dry_run=1 ;;
    -h|--help)
      cat <<EOF
Usage: bash scripts/configure-staging-auth.sh [--dry-run]

Append/update 本源 staging auth variables for WeChat login and Aliyun SMS.
Secrets are read from environment variables or hidden prompts and written only to the server env file.

Required values:
  BENYUAN_WECHAT_APP_ID
  BENYUAN_WECHAT_APP_SECRET
  BENYUAN_ALIYUN_SMS_ACCESS_KEY_ID
  BENYUAN_ALIYUN_SMS_ACCESS_KEY_SECRET
  BENYUAN_ALIYUN_SMS_SIGN_NAME
  BENYUAN_ALIYUN_SMS_TEMPLATE_CODE

Optional:
  BENYUAN_AUTH_PHONE_SECRET
EOF
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 2
      ;;
  esac
  shift
done

prompt_secret() {
  local var_name="$1"
  local prompt="$2"
  local current="${!var_name:-}"
  if [ "$dry_run" = "1" ] || [ -n "$current" ]; then
    printf "%s" "$current"
    return
  fi
  printf "%s (hidden): " "$prompt" >&2
  if [ -t 0 ]; then stty -echo; fi
  IFS= read -r current
  if [ -t 0 ]; then stty echo; fi
  printf "\n" >&2
  printf "%s" "$current"
}

prompt_plain() {
  local var_name="$1"
  local prompt="$2"
  local current="${!var_name:-}"
  if [ "$dry_run" = "1" ] || [ -n "$current" ]; then
    printf "%s" "$current"
    return
  fi
  printf "%s: " "$prompt" >&2
  IFS= read -r current
  printf "%s" "$current"
}

wechat_app_id="$(prompt_plain BENYUAN_WECHAT_APP_ID "WeChat AppID")"
wechat_app_secret="$(prompt_secret BENYUAN_WECHAT_APP_SECRET "WeChat AppSecret")"
aliyun_key_id="$(prompt_plain BENYUAN_ALIYUN_SMS_ACCESS_KEY_ID "Aliyun SMS AccessKeyId")"
aliyun_key_secret="$(prompt_secret BENYUAN_ALIYUN_SMS_ACCESS_KEY_SECRET "Aliyun SMS AccessKeySecret")"
aliyun_sign_name="$(prompt_plain BENYUAN_ALIYUN_SMS_SIGN_NAME "Aliyun SMS SignName")"
aliyun_template_code="$(prompt_plain BENYUAN_ALIYUN_SMS_TEMPLATE_CODE "Aliyun SMS TemplateCode")"
phone_secret="${BENYUAN_AUTH_PHONE_SECRET:-$(openssl rand -hex 24 2>/dev/null || uuidgen | tr -d '-')}"

missing=()
[ -z "$wechat_app_id" ] && missing+=("BENYUAN_WECHAT_APP_ID")
[ -z "$wechat_app_secret" ] && missing+=("BENYUAN_WECHAT_APP_SECRET")
[ -z "$aliyun_key_id" ] && missing+=("BENYUAN_ALIYUN_SMS_ACCESS_KEY_ID")
[ -z "$aliyun_key_secret" ] && missing+=("BENYUAN_ALIYUN_SMS_ACCESS_KEY_SECRET")
[ -z "$aliyun_sign_name" ] && missing+=("BENYUAN_ALIYUN_SMS_SIGN_NAME")
[ -z "$aliyun_template_code" ] && missing+=("BENYUAN_ALIYUN_SMS_TEMPLATE_CODE")

if [ "${#missing[@]}" -gt 0 ] && [ "$dry_run" = "0" ]; then
  printf "Missing required values: %s\n" "${missing[*]}" >&2
  exit 1
fi

if [ ! -f "$ssh_key" ]; then
  echo "SSH key not found: $ssh_key" >&2
  exit 1
fi

ssh_target="$staging_user@$staging_host"
ssh_base=(ssh -i "$ssh_key" -o BatchMode=yes -o ConnectTimeout=15 "$ssh_target")

echo "[configure-staging-auth] target: $ssh_target:$runtime_env_file"
echo "[configure-staging-auth] sms_provider: aliyun"
echo "[configure-staging-auth] wechat_app_id: $wechat_app_id"
echo "[configure-staging-auth] aliyun_sign_name: $aliyun_sign_name"
echo "[configure-staging-auth] aliyun_template_code: $aliyun_template_code"

if [ "$dry_run" = "1" ]; then
  if [ "${#missing[@]}" -gt 0 ]; then
    printf "[configure-staging-auth] dry-run missing values: %s\n" "${missing[*]}"
  fi
  echo "[configure-staging-auth] dry-run: no server changes."
  exit 0
fi

env_payload="$(cat <<EOF
BENYUAN_SMS_PROVIDER=aliyun
BENYUAN_ALIYUN_SMS_ACCESS_KEY_ID=$aliyun_key_id
BENYUAN_ALIYUN_SMS_ACCESS_KEY_SECRET=$aliyun_key_secret
BENYUAN_ALIYUN_SMS_SIGN_NAME=$aliyun_sign_name
BENYUAN_ALIYUN_SMS_TEMPLATE_CODE=$aliyun_template_code
BENYUAN_AUTH_PHONE_SECRET=$phone_secret
BENYUAN_WECHAT_APP_ID=$wechat_app_id
BENYUAN_WECHAT_APP_SECRET=$wechat_app_secret
EOF
)"

remote_dir="$(dirname "$runtime_env_file")"
printf "%s\n" "$env_payload" | "${ssh_base[@]}" "set -euo pipefail
mkdir -p '$remote_dir'
touch '$runtime_env_file'
chmod 600 '$runtime_env_file'
tmp_file=\$(mktemp)
grep -Ev '^(BENYUAN_SMS_PROVIDER|BENYUAN_ALIYUN_SMS_ACCESS_KEY_ID|BENYUAN_ALIYUN_SMS_ACCESS_KEY_SECRET|BENYUAN_ALIYUN_SMS_SIGN_NAME|BENYUAN_ALIYUN_SMS_TEMPLATE_CODE|BENYUAN_AUTH_PHONE_SECRET|BENYUAN_WECHAT_APP_ID|BENYUAN_WECHAT_APP_SECRET)=' '$runtime_env_file' > \"\$tmp_file\" || true
cat >> \"\$tmp_file\"
cat \"\$tmp_file\" > '$runtime_env_file'
rm -f \"\$tmp_file\"
chmod 600 '$runtime_env_file'"

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

echo "[configure-staging-auth] auth env written and PM2 refreshed."
