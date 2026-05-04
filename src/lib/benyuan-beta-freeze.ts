export const benyuanBetaFreezeCurrent = {
  freezeId: "beta-2026-03-11-r2",
  frozenAt: "2026-03-11T17:15:53+08:00",
  archiveFolder: "/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11-r2",
  archiveTarball: "/Users/fanhao/Documents/Playground/archive/benyuan-beta-freeze-2026-03-11-r2.tar.gz",
  benchmarkSnapshot: "/Users/fanhao/Documents/Playground/output/benyuan-pack-benchmark-a-b-c-2026-03-11T09-15-53.json",
  docs: {
    freezeDoc: "/Users/fanhao/Documents/Playground/docs/benyuan-beta-freeze-2026-03-11-r2.md",
    iosMapDoc: "/Users/fanhao/Documents/Playground/docs/benyuan-ios-web-shell-map-v0.2.md",
    migrationChecklist: "/Users/fanhao/Documents/Playground/docs/benyuan-ios-safe-migration-checklist.md",
  },
  shell: {
    manifest: "/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/shell-manifest.json",
    config: "/Users/fanhao/Documents/Playground/mobile/benyuan_origin_ios_shell/swiftui-starter/BenyuanShellConfig.swift",
  },
  demoRoutes: {
    A: {
      theater: "/theater?part1_id=part1_pqluf95e&theater_script_id=theater_hed4qxwf",
      constellation: "/constellation?constellation_id=const_noogky5i",
    },
    B: {
      theater: "/theater?part1_id=part1_b0gtt7ez&theater_script_id=theater_p04f5cyf",
      constellation: "/constellation?constellation_id=const_8bctm6xu",
    },
    C: {
      theater: "/theater?part1_id=part1_e9r3lhca&theater_script_id=theater_wawfzaja",
      constellation: "/constellation?constellation_id=const_c3px9v98",
    },
  },
} as const;
