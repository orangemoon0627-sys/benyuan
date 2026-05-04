export const benyuanBetaFreezeCurrent = {
  freezeId: "beta-2026-03-11",
  frozenAt: "2026-03-11T01:44:42+08:00",
  archiveFolder: "/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11",
  archiveTarball: "/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11.tar.gz",
  benchmarkSnapshot: "/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-b-c-2026-03-10T17-44-42.json",
  docs: {
    freezeDoc: "/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11.md",
    iosMapDoc: "/Users/fanhao/Documents/Playground/docs/benyuan-ios-web-shell-map-v0.2.md",
    migrationChecklist: "/Users/fanhao/Documents/Playground/docs/benyuan-ios-safe-migration-checklist.md",
  },
  shell: {
    manifest: "/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/shell-manifest.json",
    config: "/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellConfig.swift",
  },
  demoRoutes: {
    A: {
      theater: "/theater?part1_id=part1_i2ffoggu&theater_script_id=theater_c8wkeirl",
      constellation: "/constellation?constellation_id=const_9pfnj81l",
    },
    B: {
      theater: "/theater?part1_id=part1_h9zwr2ii&theater_script_id=theater_f86ga7vv",
      constellation: "/constellation?constellation_id=const_332xc7ue",
    },
    C: {
      theater: "/theater?part1_id=part1_8oc9qk81&theater_script_id=theater_oiprjw2m",
      constellation: "/constellation?constellation_id=const_an86s1af",
    },
  },
} as const;
