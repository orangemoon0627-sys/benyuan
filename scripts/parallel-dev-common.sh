#!/usr/bin/env bash
set -euo pipefail

parallel_repo_root() {
  local script_dir
  script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  cd "$script_dir/.." && pwd
}

parallel_parent_dir() {
  dirname "$(parallel_repo_root)"
}

parallel_state_dir() {
  echo "${PARALLEL_STATE_DIR:-$(parallel_repo_root)/output/parallel-dev}"
}

parallel_dry_run() {
  [ "${PARALLEL_DRY_RUN:-0}" = "1" ]
}

parallel_require_lane() {
  case "${1:-}" in
    benyuan|tradewise) ;;
    *)
      echo "lane 必须是 benyuan 或 tradewise" >&2
      exit 1
      ;;
  esac
}

parallel_worktree_path() {
  parallel_require_lane "$1"
  case "$1" in
    benyuan) echo "${BENYUAN_WORKTREE:-$(parallel_parent_dir)/Playground-benyuan}" ;;
    tradewise) echo "${TRADEWISE_WORKTREE:-$(parallel_parent_dir)/Playground-tradewise}" ;;
  esac
}

parallel_branch() {
  parallel_require_lane "$1"
  case "$1" in
    benyuan) echo "${BENYUAN_BRANCH:-codex/benyuan-parallel}" ;;
    tradewise) echo "${TRADEWISE_BRANCH:-codex/tradewise-parallel}" ;;
  esac
}

parallel_host() {
  echo "127.0.0.1"
}

parallel_port() {
  parallel_require_lane "$1"
  case "$1" in
    benyuan) echo "${BENYUAN_DEV_PORT:-3015}" ;;
    tradewise) echo "${TRADEWISE_DEV_PORT:-3201}" ;;
  esac
}

parallel_profile() {
  parallel_require_lane "$1"
  case "$1" in
    benyuan) echo "${BENYUAN_PROFILE:-main}" ;;
    tradewise) echo "${TRADEWISE_PROFILE:-mock}" ;;
  esac
}

parallel_lane_dir() {
  echo "$(parallel_state_dir)/$1"
}

parallel_log_path() {
  echo "$(parallel_lane_dir "$1")/dev.log"
}

parallel_pid_path() {
  echo "$(parallel_lane_dir "$1")/dev.pid"
}

parallel_meta_path() {
  echo "$(parallel_lane_dir "$1")/session.env"
}

parallel_handoff_path() {
  echo "$(parallel_lane_dir "$1")/handoff.md"
}

parallel_health_path() {
  echo "/lab/status"
}

parallel_health_url() {
  echo "http://$(parallel_host "$1"):$(parallel_port "$1")$(parallel_health_path "$1")"
}

parallel_running_pid() {
  local pid_file pid
  pid_file="$(parallel_pid_path "$1")"
  if [ ! -f "$pid_file" ]; then
    return 1
  fi
  pid="$(cat "$pid_file")"
  if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
    echo "$pid"
    return 0
  fi
  return 1
}

parallel_listener_pid() {
  local port
  port="$(parallel_port "$1")"
  lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | head -n 1 || true
}

parallel_ensure_lane_dir() {
  mkdir -p "$(parallel_lane_dir "$1")"
}

parallel_ensure_handoff() {
  local lane path worktree url branch profile
  lane="$1"
  path="$(parallel_handoff_path "$lane")"
  if [ -f "$path" ]; then
    return 0
  fi

  worktree="$(parallel_worktree_path "$lane")"
  url="$(parallel_health_url "$lane")"
  branch="$(parallel_branch "$lane")"
  profile="$(parallel_profile "$lane")"
  mkdir -p "$(dirname "$path")"
  cat > "$path" <<EOF2
# ${lane} lane handoff

- Last updated: TBD
- Worktree: \
  \
  ${worktree}
- Branch: ${branch}
- Dev URL: ${url}
- Profile: ${profile}

## Current goal
- TBD

## Done
- TBD

## Next
- TBD

## Blockers
- None

## Key files
- TBD

## Validation
- TBD

## Recovery prompt
请先读取这个 handoff，再检查 git status、git diff --stat、最近日志，仅继续未完成部分；不要重新全量扫描仓库。
EOF2
}

parallel_write_meta() {
  local lane path
  lane="$1"
  path="$(parallel_meta_path "$lane")"
  cat > "$path" <<EOF2
LANE=$lane
WORKTREE=$(parallel_worktree_path "$lane")
BRANCH=$(parallel_branch "$lane")
HOST=$(parallel_host "$lane")
PORT=$(parallel_port "$lane")
PROFILE=$(parallel_profile "$lane")
LOG_FILE=$(parallel_log_path "$lane")
HANDOFF_FILE=$(parallel_handoff_path "$lane")
HEALTH_URL=$(parallel_health_url "$lane")
START_CMD=$(parallel_start_command "$lane")
EOF2
}

parallel_start_command() {
  local lane host port profile
  lane="$1"
  host="$(parallel_host "$lane")"
  port="$(parallel_port "$lane")"
  profile="$(parallel_profile "$lane")"
  case "$lane" in
    benyuan)
      printf 'node ./node_modules/next/dist/bin/next dev --webpack --hostname %s --port %s' "$host" "$port"
      ;;
    tradewise)
      case "$profile" in
        mock)
          printf 'node ./node_modules/next/dist/bin/next dev --webpack --hostname %s --port %s' "$host" "$port"
          ;;
        crs)
          printf 'TRADEWISE_REVIEW_PROVIDER=crs node ./node_modules/next/dist/bin/next dev --webpack --hostname %s --port %s' "$host" "$port"
          ;;
        remote)
          printf 'TRADEWISE_HOST=%s TRADEWISE_PORT=%s bash scripts/tradewise-dev-remote.sh' "$host" "$port"
          ;;
        *)
          echo "未知的 tradewise profile: $profile" >&2
          exit 1
          ;;
      esac
      ;;
  esac
}

parallel_wait_for_health() {
  local lane url attempts
  lane="$1"
  url="$(parallel_health_url "$lane")"
  attempts="${2:-20}"
  for _ in $(seq 1 "$attempts"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}
