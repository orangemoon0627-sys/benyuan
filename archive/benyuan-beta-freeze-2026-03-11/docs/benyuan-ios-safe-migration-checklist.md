# Benyuan iOS Safe Migration Checklist

Generated: 2026-03-11

## Frozen now
- Current web flow routes: `/`, `/collect`, `/processing/benyuan`, `/theater`, `/constellation`, `/lab/status`
- Core Part 1 / Part 2 / Part 3 UI components and shared primitives
- Current runtime bridge, `/lab/status` observability, and benchmark event recording
- Current Part 1 schema, prompt/type contracts, A / B / C test packs, benchmark script
- Latest real benchmark output for packs A / B / C
- Current iOS shell starter, route recovery, share / external / pickImages native bridge

## Backup locations
- Current beta freeze folder: `/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11`
- Current beta freeze tarball: `/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11.tar.gz`
- Current beta freeze manifest: `/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11/manifest.json`
- Previous safe baseline folder: `/Users/fanhao/Documents/Playground/archive/benyuan-ios-safe-baseline-2026-03-10`
- Previous safe baseline tarball: `/Users/fanhao/Documents/Playground/archive/benyuan-ios-safe-baseline-2026-03-10.tar.gz`

## Frozen references
- Freeze doc: `/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11.md`
- Web → iOS shell map: `/Users/fanhao/Documents/Playground/docs/benyuan-ios-web-shell-map-v0.2.md`
- Latest benchmark snapshot: `/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-b-c-2026-03-10T17-44-42.json`
- Shell manifest: `/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/shell-manifest.json`
- Shell config: `/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellConfig.swift`

## Safe migration guidance
- Keep API contracts and prompt/type schemas stable during the first iOS shell phase.
- Treat the `2026-03-11` A / B / C benchmark as the primary regression baseline after each shell change.
- Preserve A / B / C packs unchanged so mobile validation can reuse the same chain.
- Prefer wrapping the current web flow first; avoid rewriting agent logic and report schema in parallel.
- If UI refactors get aggressive, compare against the freeze archive instead of relying on memory.

## What can still change freely
- Layout, motion, copy rhythm, page transitions, card structure
- Mobile-first spacing, typography tuning, interaction polish
- Demo entry presentation and navigation shell
- Native loading / offline / retry surface

## What should stay stable first
- Part 1 submission shape
- Theater / constellation response schema
- Runtime selection and provider handoff semantics
- Benchmark script I/O format
- Native bridge message names: `share`, `openExternal`, `pickImages`

## Latest frozen demo routes
- A:
  - `/theater?part1_id=part1_i2ffoggu&theater_script_id=theater_c8wkeirl`
  - `/constellation?constellation_id=const_9pfnj81l`
- B:
  - `/theater?part1_id=part1_h9zwr2ii&theater_script_id=theater_f86ga7vv`
  - `/constellation?constellation_id=const_332xc7ue`
- C:
  - `/theater?part1_id=part1_8oc9qk81&theater_script_id=theater_oiprjw2m`
  - `/constellation?constellation_id=const_an86s1af`
