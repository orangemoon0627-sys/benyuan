import SwiftUI

@main
struct BenyuanShellApp: App {
    init() {
        if let raw = BenyuanShellConfig.launchArgumentValue("--benyuan-base-url"),
           let url = URL(string: raw) {
            BenyuanShellConfig.persistRuntimeBaseURL(url)
        }

        // When an explicit route override is provided, always start from that target
        // instead of a stale route restored from a previous run.
        if BenyuanShellConfig.initialRouteOverride != nil {
            BenyuanRouteRecovery.reset()
        }
    }

    var body: some Scene {
        WindowGroup {
            BenyuanShellRootView()
        }
    }
}
