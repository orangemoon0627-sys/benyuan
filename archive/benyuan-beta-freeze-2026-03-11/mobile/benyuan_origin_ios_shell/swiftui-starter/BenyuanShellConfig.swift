import Foundation

struct BenyuanShellConfig {
    enum Environment {
        case development
        case staging
        case production
    }

    static let environment: Environment = .production

    static let developmentBaseURL = URL(string: "http://127.0.0.1:3015")!
    static let stagingBaseURL = URL(string: "https://staging.example.com")!
    static let productionBaseURL = URL(string: "https://app.example.com")!

    static func launchArgumentValue(_ key: String) -> String? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: key), index + 1 < arguments.count else {
            return nil
        }
        return arguments[index + 1]
    }

    static var baseURL: URL {
        if let raw = launchArgumentValue("--benyuan-base-url"), let url = URL(string: raw) {
            return url
        }

        switch environment {
        case .development: return developmentBaseURL
        case .staging: return stagingBaseURL
        case .production: return productionBaseURL
        }
    }

    static let initialPath = "/"

    static var allowedHosts: Set<String> {
        Set([
            developmentBaseURL.host,
            stagingBaseURL.host,
            productionBaseURL.host,
            baseURL.host,
        ].compactMap { $0 })
    }

    static let inFlowPrefixes = [
        "/",
        "/collect",
        "/processing/benyuan",
        "/theater",
        "/constellation",
        "/lab/native-handoff",
    ]

    static var initialRouteOverride: String? {
        launchArgumentValue("--benyuan-route")
    }

    static var nativePickFixtureNames: [String] {
        guard let raw = launchArgumentValue("--benyuan-native-pick-fixture") else {
            return []
        }
        return raw.split(separator: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    }

    static let demoRoutes = [
        "/theater?part1_id=part1_i2ffoggu&theater_script_id=theater_c8wkeirl",
        "/constellation?constellation_id=const_9pfnj81l",
        "/theater?part1_id=part1_h9zwr2ii&theater_script_id=theater_f86ga7vv",
        "/constellation?constellation_id=const_332xc7ue",
        "/theater?part1_id=part1_8oc9qk81&theater_script_id=theater_oiprjw2m",
        "/constellation?constellation_id=const_an86s1af",
    ]
}
