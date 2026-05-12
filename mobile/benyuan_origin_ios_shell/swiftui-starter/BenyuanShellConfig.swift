import Foundation

enum BenyuanNativePreviewStage: String, Equatable {
    case auth
    case account
    case accountFeedback = "account-feedback"
    case collect
    case upload
    case processing
    case theater
    case constellation
    case constellationEnd = "constellation-end"
}

struct BenyuanShellConfig {
    enum Environment: String {
        case development
        case staging
        case production
    }

    private static let infoEnvironmentKey = "BenyuanShellEnvironment"
    private static let infoStagingBaseURLKey = "BenyuanShellStagingBaseURL"
    private static let infoProductionBaseURLKey = "BenyuanShellProductionBaseURL"

    private static let runtimeBaseURLKey = "benyuan-shell-runtime-base-url"
    private static let placeholderStagingBaseURL = URL(string: "https://staging.benyuan.invalid")!
    private static let placeholderProductionBaseURL = URL(string: "https://app.benyuan.invalid")!

    static let developmentBaseURL = URL(string: "http://127.0.0.1:3015")!
    static var stagingBaseURL: URL? { infoConfiguredBaseURL(infoStagingBaseURLKey) }
    static var productionBaseURL: URL? { infoConfiguredBaseURL(infoProductionBaseURLKey) }

    static var environment: Environment {
        if let raw = launchArgumentValue("--benyuan-environment")?.lowercased(),
           let environment = Environment(rawValue: raw) {
            return environment
        }

        if let raw = infoString(infoEnvironmentKey)?.lowercased(),
           let environment = Environment(rawValue: raw) {
            return environment
        }

#if DEBUG
        return .development
#else
        return .production
#endif
    }

    static func launchArgumentValue(_ key: String) -> String? {
        let arguments = ProcessInfo.processInfo.arguments
        guard let index = arguments.firstIndex(of: key), index + 1 < arguments.count else {
            return nil
        }
        return arguments[index + 1]
    }

    static func persistRuntimeBaseURL(_ url: URL) {
        guard allowsRuntimeBaseURLPersistence else { return }
        guard let normalized = normalizeBaseURL(url) else { return }
        UserDefaults.standard.set(normalized.absoluteString, forKey: runtimeBaseURLKey)
    }

    private static func storedRuntimeBaseURL() -> URL? {
        guard let raw = UserDefaults.standard.string(forKey: runtimeBaseURLKey),
              let url = URL(string: raw) else {
            return nil
        }
        return normalizeBaseURL(url)
    }

    static var baseURL: URL {
        if let raw = launchArgumentValue("--benyuan-base-url"), let url = URL(string: raw) {
            return url
        }

        if allowsRuntimeBaseURLPersistence, let stored = storedRuntimeBaseURL() {
            return stored
        }

        switch environment {
        case .development: return developmentBaseURL
        case .staging: return stagingBaseURL ?? placeholderStagingBaseURL
        case .production: return productionBaseURL ?? placeholderProductionBaseURL
        }
    }

    static var initialPath: String {
        "/"
    }

    static var showsDebugUI: Bool {
        environment == .development && launchArgumentValue("--benyuan-debug-ui") == "1"
    }

    static var allowsRuntimeBaseURLPersistence: Bool {
        environment == .development
    }

    static var hasReleaseBaseURLIssue: Bool {
        environment != .development && (
            isPlaceholderReleaseURL(stagingBaseURL ?? placeholderStagingBaseURL) ||
            isPlaceholderReleaseURL(productionBaseURL ?? placeholderProductionBaseURL)
        )
    }

    static var allowedHosts: Set<String> {
        Set([baseURL.host].compactMap { $0 })
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

    static var nativePreviewStage: BenyuanNativePreviewStage? {
#if DEBUG
        nativePreviewStage(arguments: ProcessInfo.processInfo.arguments)
#else
        nil
#endif
    }

    static var nativeE2EAutorun: Bool {
#if DEBUG
        nativeE2EAutorun(arguments: ProcessInfo.processInfo.arguments)
#else
        false
#endif
    }

    static var nativeE2EDiagnostics: Bool {
#if DEBUG
        nativeE2EDiagnostics(arguments: ProcessInfo.processInfo.arguments)
#else
        false
#endif
    }

    static func nativePreviewStage(arguments: [String]) -> BenyuanNativePreviewStage? {
        guard let raw = launchArgumentValue("--benyuan-native-preview", arguments: arguments)?.lowercased() else {
            return nil
        }
        return BenyuanNativePreviewStage(rawValue: raw)
    }

    static func nativeE2EAutorun(arguments: [String]) -> Bool {
        arguments.contains("--benyuan-native-e2e-autorun")
    }

    static func nativeE2EDiagnostics(arguments: [String]) -> Bool {
        arguments.contains("--benyuan-native-e2e-diagnostics")
    }

    static var nativePickFixtureNames: [String] {
        guard let raw = launchArgumentValue("--benyuan-native-pick-fixture") else {
            return []
        }
        return raw.split(separator: ",").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }
    }

    static let demoRoutes = [
        "/theater?part1_id=part1_ebc4el2y&theater_script_id=theater_fcm6q0k8",
        "/constellation?constellation_id=const_qaub8gcl",
        "/theater?part1_id=part1_s575l1t7&theater_script_id=theater_003qj9px",
        "/constellation?constellation_id=const_h572ny90",
        "/theater?part1_id=part1_pydb5on7&theater_script_id=theater_di7oz5x2",
        "/constellation?constellation_id=const_lufzlqfx",
    ]

    private static func normalizeBaseURL(_ url: URL) -> URL? {
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: true),
              components.scheme != nil,
              components.host != nil else {
            return nil
        }

        components.path = ""
        components.query = nil
        components.fragment = nil
        return components.url
    }

    private static func launchArgumentValue(_ key: String, arguments: [String]) -> String? {
        guard let index = arguments.firstIndex(of: key), index + 1 < arguments.count else {
            return nil
        }
        return arguments[index + 1]
    }

    private static func infoConfiguredBaseURL(_ key: String) -> URL? {
        guard let raw = infoString(key),
              !raw.isEmpty,
              let url = URL(string: raw) else {
            return nil
        }

        return normalizeBaseURL(url)
    }

    private static func infoString(_ key: String) -> String? {
        Bundle.main.object(forInfoDictionaryKey: key) as? String
    }

    private static func isPlaceholderReleaseURL(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased() else { return true }
        return host.hasSuffix(".invalid") || host == "127.0.0.1" || host == "localhost"
    }
}
