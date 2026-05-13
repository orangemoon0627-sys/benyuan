import SwiftUI

private struct BenyuanMotionActiveKey: EnvironmentKey {
    static let defaultValue = true
}

extension EnvironmentValues {
    var benyuanMotionActive: Bool {
        get { self[BenyuanMotionActiveKey.self] }
        set { self[BenyuanMotionActiveKey.self] = newValue }
    }
}

enum BenyuanMotionRuntime {
    static func phase(from date: Date, active: Bool, reduceMotion: Bool) -> TimeInterval {
        guard active, !reduceMotion else { return 0 }
        return date.timeIntervalSinceReferenceDate
    }

    static func animationInterval(preferredFramesPerSecond fps: Double, active: Bool, reduceMotion: Bool) -> TimeInterval {
        guard active, !reduceMotion else { return 1 }
        return 1 / max(fps, 1)
    }
}

struct BenyuanMotionTimeline<Content: View>: View {
    var preferredFramesPerSecond: Double = 24
    @ViewBuilder var content: (TimeInterval) -> Content

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.benyuanMotionActive) private var motionActive

    var body: some View {
        TimelineView(.animation(minimumInterval: BenyuanMotionRuntime.animationInterval(preferredFramesPerSecond: preferredFramesPerSecond, active: motionActive, reduceMotion: reduceMotion))) { timeline in
            content(BenyuanMotionRuntime.phase(from: timeline.date, active: motionActive, reduceMotion: reduceMotion))
        }
    }
}
