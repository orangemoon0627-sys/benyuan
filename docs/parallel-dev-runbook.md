# Parallel Dev Runbook

This runbook hardens the repo for the Benyuan + TradeWise two-project workflow so one stuck Codex thread does not take down both efforts.

## The model

- one project = one worktree
- one project = one Codex thread/window
- one project = one dev port + one log file + one handoff file
- only one write-heavy agent per project at a time

Default paths:

- Benyuan worktree: `/Users/fanhao/Documents/Playground-benyuan`
- TradeWise worktree: `/Users/fanhao/Documents/Playground-tradewise`
- Runtime state: `output/parallel-dev/<lane>/`

## Bootstrap

Create and start both isolated lanes in one command:

```bash
npm run lane:bootstrap
```

If you only want to prepare worktrees without starting servers:

```bash
npm run lane:bootstrap:no-start
```

You can still refresh just the worktrees when needed:

```bash
npm run lane:worktrees
```

Inspect the current worktree mapping:

```bash
npm run lane:worktrees:status
```

## Start each lane

The bootstrap command is the default. Manual starts stay available when you only want one lane.

Benyuan lane:

```bash
npm run lane:benyuan:start
```

TradeWise lane with the default mock profile:

```bash
npm run lane:tradewise:start
```

TradeWise lane with CRS:

```bash
npm run lane:tradewise:start:crs
```

TradeWise lane with remote research:

```bash
TRADEWISE_RESEARCH_REMOTE_URL=http://127.0.0.1:9000/feed npm run lane:tradewise:start:remote
```

## Stop or inspect

```bash
npm run lane:status
npm run lane:stop
npm run lane:benyuan:stop
npm run lane:tradewise:stop
npm run lane:benyuan:tail
npm run lane:tradewise:tail
```

## Recovery contract

Each lane owns three files inside `output/parallel-dev/<lane>/`:

- `dev.log`: long-running server output
- `session.env`: exact worktree / port / command metadata
- `handoff.md`: the single source of truth for the next Codex thread

When a thread disconnects, do not keep pressing Continue. Instead:

1. keep the lane running
2. update `handoff.md`
3. open a fresh Codex thread for that lane only
4. use the generated recovery prompt

```bash
npm run lane:benyuan:prompt
npm run lane:tradewise:prompt
```

## Recommended operating rules

- Keep Benyuan and TradeWise in separate Codex threads.
- Do not run two write-heavy tasks in the same lane.
- Make long commands write to `output/parallel-dev/<lane>/...` and then read summaries.
- After every meaningful step, update `handoff.md` before switching threads.
- Use the repo root only as the integration lane; day-to-day feature work should happen in the dedicated worktrees.
