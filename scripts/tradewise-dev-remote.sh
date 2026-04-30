#!/usr/bin/env bash
set -euo pipefail

PORT="${TRADEWISE_PORT:-3201}"
HOST="${TRADEWISE_HOST:-127.0.0.1}"
REMOTE_URL="${TRADEWISE_RESEARCH_REMOTE_URL:-}"
ENV_FILE="${TRADEWISE_REMOTE_ENV_FILE:-}"

if [ -n "$ENV_FILE" ]; then
  if [ ! -f "$ENV_FILE" ]; then
    echo "指定的 TRADEWISE_REMOTE_ENV_FILE 不存在: $ENV_FILE" >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
  REMOTE_URL="${TRADEWISE_RESEARCH_REMOTE_URL:-$REMOTE_URL}"
fi

if [ -z "$REMOTE_URL" ]; then
  echo "缺少 TRADEWISE_RESEARCH_REMOTE_URL，请先提供真实 research upstream 地址。" >&2
  echo "例如: TRADEWISE_RESEARCH_REMOTE_URL=http://127.0.0.1:9000/feed npm run dev:tradewise:remote" >&2
  echo "或: TRADEWISE_REMOTE_ENV_FILE=/Users/fanhao/Documents/Playground/docs/tradewise/research-remote.env.example npm run dev:tradewise:remote" >&2
  exit 1
fi

export TRADEWISE_REVIEW_PROVIDER="${TRADEWISE_REVIEW_PROVIDER:-crs}"
export TRADEWISE_RESEARCH_PROVIDER="remote"

cat <<SUMMARY
TradeWise remote dev config
- host: $HOST
- port: $PORT
- review provider: ${TRADEWISE_REVIEW_PROVIDER}
- research remote url: ${TRADEWISE_RESEARCH_REMOTE_URL}
- market param: ${TRADEWISE_RESEARCH_REMOTE_MARKET_PARAM:-market}
- limit param: ${TRADEWISE_RESEARCH_REMOTE_LIMIT_PARAM:-limit}
SUMMARY

exec node ./node_modules/next/dist/bin/next dev --webpack --hostname "$HOST" --port "$PORT"
