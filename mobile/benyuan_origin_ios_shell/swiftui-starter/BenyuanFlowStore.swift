import Foundation

struct BenyuanNativeE2EEvent: Codable, Equatable {
    let recordedAt: String
    let message: String
}

final class BenyuanFlowStore {
    private let defaults: UserDefaults
    private let key = "benyuan-native-session"
    private let e2eEventsKey = "benyuan-native-e2e-events"

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    func load() -> BenyuanNativeSession {
        guard let data = defaults.data(forKey: key),
              let value = try? JSONDecoder.benyuan.decode(BenyuanNativeSession.self, from: data) else {
            return .empty
        }
        return value
    }

    func save(_ session: BenyuanNativeSession) {
        // BenyuanNativeSession carries activeGenerationJobId so cloud generation can resume after app relaunch.
        guard let data = try? JSONEncoder.benyuan.encode(session) else { return }
        defaults.set(data, forKey: key)
    }

    func reset() {
        defaults.removeObject(forKey: key)
    }

    func loadE2EEvents() -> [BenyuanNativeE2EEvent] {
        guard let data = defaults.data(forKey: e2eEventsKey),
              let value = try? JSONDecoder.benyuan.decode([BenyuanNativeE2EEvent].self, from: data) else {
            return []
        }
        return value
    }

    func appendE2EEvent(_ message: String) {
        var events = loadE2EEvents()
        events.append(BenyuanNativeE2EEvent(
            recordedAt: Self.iso8601Formatter.string(from: Date()),
            message: message
        ))
        events = Array(events.suffix(80))
        guard let data = try? JSONEncoder.benyuan.encode(events) else { return }
        defaults.set(data, forKey: e2eEventsKey)
    }

    func resetE2EEvents() {
        defaults.removeObject(forKey: e2eEventsKey)
    }

    private static let iso8601Formatter = ISO8601DateFormatter()
}
