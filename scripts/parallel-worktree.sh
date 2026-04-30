#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./parallel-dev-common.sh
source "$SCRIPT_DIR/parallel-dev-common.sh"

usage() {
  cat <<USAGE
用法:
  bash scripts/parallel-worktree.sh ensure [benyuan|tradewise|all]
  bash scripts/parallel-worktree.sh sync [benyuan|tradewise|all]
  bash scripts/parallel-worktree.sh status [benyuan|tradewise|all]
  bash scripts/parallel-worktree.sh path <benyuan|tradewise>
USAGE
}

sync_worktree() {
  local lane repo worktree
  lane="$1"
  repo="$(parallel_repo_root)"
  worktree="$(parallel_worktree_path "$lane")"

  if ! git -C "$worktree" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "$lane worktree 尚未创建: $worktree" >&2
    exit 1
  fi

  rsync -a \
    --exclude '.git' \
    --exclude '.next' \
    --exclude 'node_modules' \
    --exclude 'coverage' \
    --exclude 'data' \
    --exclude 'output/parallel-dev' \
    --exclude '.playwright-cli' \
    --exclude 'tsconfig.tsbuildinfo' \
    --exclude 'mobile/.android-sdk' \
    --exclude 'mobile/.flutter-sdk' \
    --exclude 'mobile/tradewise_ai/.dart_tool' \
    --exclude 'mobile/tradewise_ai/build' \
    --exclude 'mobile/tradewise_ai/.idea' \
    --exclude 'mobile/tradewise_ai/.flutter-plugins-dependencies' \
    "$repo/" "$worktree/"
}

ensure_worktree() {
  local lane repo worktree branch modules_target current_branch
  lane="$1"
  repo="$(parallel_repo_root)"
  worktree="$(parallel_worktree_path "$lane")"
  branch="$(parallel_branch "$lane")"
  modules_target="$repo/node_modules"

  if git -C "$worktree" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    current_branch="$(git -C "$worktree" rev-parse --abbrev-ref HEAD)"
    if [ "$current_branch" != "$branch" ]; then
      echo "$lane worktree 已存在，但当前分支是 $current_branch，不是 $branch" >&2
      exit 1
    fi
  else
    mkdir -p "$(dirname "$worktree")"
    if git -C "$repo" show-ref --verify --quiet "refs/heads/$branch"; then
      git -C "$repo" worktree add "$worktree" "$branch"
    else
      git -C "$repo" worktree add "$worktree" -b "$branch" HEAD
    fi
  fi

  if [ -e "$modules_target" ] && [ ! -e "$worktree/node_modules" ]; then
    ln -s "$modules_target" "$worktree/node_modules"
  fi

  sync_worktree "$lane"
}

status_worktree() {
  local lane worktree branch current_branch modules_status dirty_state
  lane="$1"
  worktree="$(parallel_worktree_path "$lane")"
  branch="$(parallel_branch "$lane")"
  if git -C "$worktree" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    current_branch="$(git -C "$worktree" rev-parse --abbrev-ref HEAD)"
    if [ -n "$(git -C "$worktree" status --short 2>/dev/null)" ]; then
      dirty_state="dirty"
    else
      dirty_state="clean"
    fi
  else
    current_branch="missing"
    dirty_state="missing"
  fi
  if [ -L "$worktree/node_modules" ]; then
    modules_status="symlink"
  elif [ -d "$worktree/node_modules" ]; then
    modules_status="directory"
  else
    modules_status="missing"
  fi

  cat <<SUMMARY
[$lane]
- worktree: $worktree
- target branch: $branch
- current branch: $current_branch
- state: $dirty_state
- node_modules: $modules_status
SUMMARY
}

run_for_target() {
  local action target
  action="$1"
  target="$2"
  case "$target" in
    all)
      "$action" benyuan
      "$action" tradewise
      ;;
    benyuan|tradewise)
      "$action" "$target"
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

target="${2:-all}"
case "${1:-}" in
  ensure)
    run_for_target ensure_worktree "$target"
    ;;
  sync)
    run_for_target sync_worktree "$target"
    ;;
  status)
    run_for_target status_worktree "$target"
    ;;
  path)
    parallel_require_lane "$target"
    parallel_worktree_path "$target"
    ;;
  *)
    usage
    exit 1
    ;;
esac
