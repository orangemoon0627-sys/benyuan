import SwiftUI

private struct BenyuanMotionActiveKey: EnvironmentKey {
    static let defaultValue = true
}

private struct BenyuanMotionPhaseKey: EnvironmentKey {
    static let defaultValue: TimeInterval? = nil
}

extension EnvironmentValues {
    var benyuanMotionActive: Bool {
        get { self[BenyuanMotionActiveKey.self] }
        set { self[BenyuanMotionActiveKey.self] = newValue }
    }

    var benyuanMotionPhase: TimeInterval? {
        get { self[BenyuanMotionPhaseKey.self] }
        set { self[BenyuanMotionPhaseKey.self] = newValue }
    }
}

enum BenyuanMotionRuntime {
    static func phase(from date: Date) -> TimeInterval {
        return date.timeIntervalSinceReferenceDate
    }

    static func animationInterval(preferredFramesPerSecond fps: Double) -> TimeInterval {
        return 1 / max(fps, 1)
    }
}

struct BenyuanMotionTimeline<Content: View>: View {
    var preferredFramesPerSecond: Double = 24
    @ViewBuilder var content: (TimeInterval) -> Content

    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.benyuanMotionActive) private var motionActive
    @Environment(\.benyuanMotionPhase) private var inheritedPhase

    @ViewBuilder
    var body: some View {
        if let inheritedPhase {
            content(inheritedPhase)
        } else if !motionActive || reduceMotion {
            content(0)
                .environment(\.benyuanMotionPhase, 0)
        } else {
            TimelineView(.animation(minimumInterval: BenyuanMotionRuntime.animationInterval(preferredFramesPerSecond: preferredFramesPerSecond))) { timeline in
                let phase = BenyuanMotionRuntime.phase(from: timeline.date)
                content(phase)
                    .environment(\.benyuanMotionPhase, phase)
            }
        }
    }
}
