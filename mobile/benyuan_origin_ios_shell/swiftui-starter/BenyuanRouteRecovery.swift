import Foundation

enum BenyuanRouteRecovery {
    private static let lastRouteKey = "benyuan-shell-last-route"

    static func save(_ url: URL) {
        guard isRestorable(url) else { return }
        UserDefaults.standard.set(url.absoluteString, forKey: lastRouteKey)
    }

    static func restoreURL() -> URL {
        if let override = BenyuanShellConfig.initialRouteOverride,
           let overrideURL = makeURL(from: override),
           isRestorable(overrideURL) {
            return overrideURL
        }

        if let raw = UserDefaults.standard.string(forKey: lastRouteKey),
           let url = URL(string: raw),
           isRestorable(url) {
            return url
        }

        return makeURL(from: BenyuanShellConfig.initialPath) ?? BenyuanShellConfig.baseURL
    }

    static func reset() {
        UserDefaults.standard.removeObject(forKey: lastRouteKey)
    }

    private static func makeURL(from route: String) -> URL? {
        if let absolute = URL(string: route), absolute.scheme != nil {
            return absolute
        }
        return URL(string: route, relativeTo: BenyuanShellConfig.baseURL)?.absoluteURL
    }

    private static func isRestorable(_ url: URL) -> Bool {
        guard let host = url.host, BenyuanShellConfig.allowedHosts.contains(host) else {
            return false
        }
        return BenyuanShellConfig.inFlowPrefixes.contains { prefix in
            url.path.hasPrefix(prefix)
        }
    }
}
