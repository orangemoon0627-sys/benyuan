#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./parallel-dev-common.sh
source "$SCRIPT_DIR/parallel-dev-common.sh"

lane_screen_name() {
  echo "parallel-$1"
}

lane_screen_exists() {
  (screen -list 2>/dev/null || true) | grep -Fq "$(lane_screen_name "$1")"
}

usage() {
  cat <<USAGE
用法:
  bash scripts/parallel-lane.sh start <benyuan|tradewise>
  bash scripts/parallel-lane.sh stop <benyuan|tradewise>
  bash scripts/parallel-lane.sh restart <benyuan|tradewise>
  bash scripts/parallel-lane.sh status [benyuan|tradewise|all]
  bash scripts/parallel-lane.sh tail <benyuan|tradewise>
  bash scripts/parallel-lane.sh prompt <benyuan|tradewise>
USAGE
}

start_lane() {
  local lane worktree log_file pid_file handoff_file port listener existing_pid command profile screen_name listener_after
  lane="$1"
  "$SCRIPT_DIR/parallel-worktree.sh" ensure "$lane" >/dev/null
  worktree="$(parallel_worktree_path "$lane")"
  log_file="$(parallel_log_path "$lane")"
  pid_file="$(parallel_pid_path "$lane")"
  handoff_file="$(parallel_handoff_path "$lane")"
  port="$(parallel_port "$lane")"
  profile="$(parallel_profile "$lane")"
  screen_name="$(lane_screen_name "$lane")"

  parallel_ensure_lane_dir "$lane"
  parallel_ensure_handoff "$lane"

  if existing_pid="$(parallel_running_pid "$lane")"; then
    echo "$lane 已在运行，PID=$existing_pid"
    return 0
  fi

  listener="$(parallel_listener_pid "$lane")"
  if [ -n "$listener" ]; then
    if curl -fsS "$(parallel_health_url "$lane")" >/dev/null 2>&1; then
      echo "$listener" > "$pid_file"
      parallel_write_meta "$lane"
      echo "$lane 发现已有健康服务，已接管: $(parallel_health_url "$lane") (PID=$listener)"
      cat <<INFO
- worktree: $worktree
- handoff: $handoff_file
- log: $log_file
INFO
      return 0
    fi
    echo "$lane 目标端口 $port 已被 PID=$listener 占用，请先 stop 或改端口。" >&2
    exit 1
  fi

  command="$(parallel_start_command "$lane")"
  parallel_write_meta "$lane"

  {
    printf '[%s] lane=%s profile=%s worktree=%s\n' "$(date '+%F %T')" "$lane" "$profile" "$worktree"
    printf '[%s] command=%s\n' "$(date '+%F %T')" "$command"
  } >> "$log_file"

  if lane_screen_exists "$lane"; then
    screen -S "$screen_name" -X quit >/dev/null 2>&1 || true
    sleep 1
  fi

  screen -dmS "$screen_name" bash -lc "cd '$worktree' && exec $command >> '$log_file' 2>&1"

  if parallel_wait_for_health "$lane" 20; then
    listener_after="$(parallel_listener_pid "$lane")"
    if [ -n "$listener_after" ]; then
      echo "$listener_after" > "$pid_file"
    fi
    echo "$lane 已启动: $(parallel_health_url "$lane") (PID=${listener_after:-unknown})"
  else
    echo "$lane 已通过 screen 启动，但健康检查还未通过: $(parallel_health_url "$lane")"
  fi

  cat <<INFO
- worktree: $worktree
- handoff: $handoff_file
- log: $log_file
- screen: $screen_name
INFO
}

stop_lane() {
  local lane pid_file pid screen_name listener
  lane="$1"
  pid_file="$(parallel_pid_path "$lane")"
  screen_name="$(lane_screen_name "$lane")"
  if pid="$(parallel_running_pid "$lane")"; then
    kill "$pid" >/dev/null 2>&1 || true
  fi
  listener="$(parallel_listener_pid "$lane")"
  if [ -n "$listener" ]; then
    kill "$listener" >/dev/null 2>&1 || true
  fi
  if lane_screen_exists "$lane"; then
    screen -S "$screen_name" -X quit >/dev/null 2>&1 || true
  fi
  rm -f "$pid_file"
  echo "$lane 已停止。"
}

status_lane() {
  local lane worktree log_file handoff_file meta_file pid port url status listener screen_name screen_status
  lane="$1"
  worktree="$(parallel_worktree_path "$lane")"
  log_file="$(parallel_log_path "$lane")"
  handoff_file="$(parallel_handoff_path "$lane")"
  meta_file="$(parallel_meta_path "$lane")"
  port="$(parallel_port "$lane")"
  url="$(parallel_health_url "$lane")"
  listener="$(parallel_listener_pid "$lane")"
  screen_name="$(lane_screen_name "$lane")"
  if lane_screen_exists "$lane"; then
    screen_status="present"
  else
    screen_status="missing"
  fi
  if [ -n "$listener" ] && curl -fsS "$url" >/dev/null 2>&1; then
    pid="$listener"
    status="running"
  else
    pid='-'
    status="stopped"
  fi

  cat <<SUMMARY
[$lane]
- status: $status
- pid: $pid
- port: $port
- listener pid: ${listener:-none}
- screen: $screen_name ($screen_status)
- worktree: $worktree
- handoff: $handoff_file
- log: $log_file
- meta: $meta_file
- health: $url
SUMMARY
}

prompt_lane() {
  local lane handoff log_file worktree
  lane="$1"
  parallel_ensure_lane_dir "$lane"
  parallel_ensure_handoff "$lane"
  handoff="$(parallel_handoff_path "$lane")"
  log_file="$(parallel_log_path "$lane")"
  worktree="$(parallel_worktree_path "$lane")"
  cat <<PROMPT
[$lane recovery prompt]
请在 worktree \`$worktree\` 下继续当前项目。
先读取 \`$handoff\`，再检查 \`git status\`、\`git diff --stat\` 和 \`$log_file\` 的最后 80 行。
仅继续未完成部分；不要重新全量扫描仓库；长命令输出请先落盘再摘要读取。
PROMPT
}

case "${1:-}" in
  start)
    parallel_require_lane "${2:-}"
    start_lane "$2"
    ;;
  stop)
    parallel_require_lane "${2:-}"
    stop_lane "$2"
    ;;
  restart)
    parallel_require_lane "${2:-}"
    stop_lane "$2"
    start_lane "$2"
    ;;
  status)
    case "${2:-all}" in
      all)
        status_lane benyuan
        status_lane tradewise
        ;;
      benyuan|tradewise)
        status_lane "$2"
        ;;
      *)
        usage
        exit 1
        ;;
    esac
    ;;
  tail)
    parallel_require_lane "${2:-}"
    tail -n "${TAIL_LINES:-80}" -f "$(parallel_log_path "$2")"
    ;;
  prompt)
    parallel_require_lane "${2:-}"
    prompt_lane "$2"
    ;;
  *)
    usage
    exit 1
    ;;
esac
