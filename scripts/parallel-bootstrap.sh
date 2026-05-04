#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
START_AFTER="${PARALLEL_BOOTSTRAP_START:-1}"
TARGET="${1:-all}"

cd "$ROOT_DIR"

bash scripts/parallel-worktree.sh ensure "$TARGET"

if [ "$START_AFTER" = "1" ]; then
  case "$TARGET" in
    all)
      bash scripts/parallel-lane.sh start benyuan
      bash scripts/parallel-lane.sh start tradewise
      ;;
    benyuan|tradewise)
      bash scripts/parallel-lane.sh start "$TARGET"
      ;;
    *)
      echo "target 必须是 benyuan、tradewise 或 all" >&2
      exit 1
      ;;
  esac
fi

bash scripts/parallel-lane.sh status all
