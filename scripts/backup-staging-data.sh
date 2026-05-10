#!/usr/bin/env bash
set -euo pipefail

staging_host="${BENYUAN_STAGING_HOST:-120.26.126.88}"
staging_user="${BENYUAN_STAGING_USER:-root}"
ssh_key="${BENYUAN_STAGING_SSH_KEY:-$HOME/.ssh/benyuan_railway_ed25519}"
app_root="${BENYUAN_STAGING_APP_ROOT:-/opt/apps/benyuan-staging}"
shared_root="${BENYUAN_STAGING_DATA_ROOT:-$app_root/shared/data}"
backup_root="${BENYUAN_STAGING_BACKUP_DIR:-$PWD/output/staging-data-backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
archive_name="benyuan-staging-shared-data-$timestamp.tar.gz"
archive_path="$backup_root/$archive_name"

usage() {
  cat <<EOF
Usage: npm run backup:staging:data

Download a compressed archive of 本源 staging shared data for migration safety.
Only shared data is archived; runtime env files and API keys are never included.

Environment overrides:
  BENYUAN_STAGING_HOST=$staging_host
  BENYUAN_STAGING_USER=$staging_user
  BENYUAN_STAGING_SSH_KEY=$ssh_key
  BENYUAN_STAGING_APP_ROOT=$app_root
  BENYUAN_STAGING_DATA_ROOT=$shared_root
  BENYUAN_STAGING_BACKUP_DIR=$backup_root
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
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
done

if [ ! -f "$ssh_key" ]; then
  echo "SSH key not found: $ssh_key" >&2
  exit 1
fi

mkdir -p "$backup_root"
ssh_target="$staging_user@$staging_host"
ssh_base=(ssh -i "$ssh_key" -o BatchMode=yes -o ConnectTimeout=15 "$ssh_target")

echo "[backup:staging:data] source: $ssh_target:$shared_root"
echo "[backup:staging:data] archive: $archive_path"

"${ssh_base[@]}" "set -euo pipefail
test -d '$shared_root'
test -f '$shared_root/benyuan-v3-store.json'
tar -czf - -C \"$shared_root\" ." > "$archive_path"

tar -tzf "$archive_path" | grep -q 'benyuan-v3-store\.json'
shasum -a 256 "$archive_path" > "$archive_path.sha256"

echo "[backup:staging:data] wrote: $archive_path"
echo "[backup:staging:data] checksum: $archive_path.sha256"
