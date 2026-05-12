import SwiftUI
import UIKit

struct BenyuanFlowTransitionLayer: View {
    var progress: Double
    var intensity: Double = 1

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let phase = accessibilityReduceMotion ? 0 : timeline.date.timeIntervalSinceReferenceDate
            let clamped = min(max(progress, 0), 1)
            let breath = accessibilityReduceMotion ? 0.45 : 0.5 + 0.5 * sin(phase * 0.34)

            GeometryReader { proxy in
                let width = max(proxy.size.width, 1)
                let height = max(proxy.size.height, 1)
                let centerX = width * (0.18 + clamped * 0.66)
                let centerY = height * (0.22 + sin(clamped * .pi) * 0.38)

                ZStack {
                    RadialGradient(
                        colors: [
                            BenyuanColor.accentGold.opacity((0.06 + breath * 0.025) * intensity),
                            BenyuanColor.nebulaViolet.opacity((0.075 + clamped * 0.04) * intensity),
                            .clear
                        ],
                        center: UnitPoint(x: centerX / width, y: centerY / height),
                        startRadius: 10,
                        endRadius: max(width, height) * 0.78
                    )

                    ForEach(0..<3, id: \.self) { index in
                        let orbitWidth = width * (0.68 + CGFloat(index) * 0.28)
                        let orbitHeight = height * (0.20 + CGFloat(index) * 0.055)
                        Ellipse()
                            .trim(from: 0.08 + clamped * 0.08, to: 0.44 + clamped * 0.24)
                            .stroke(
                                BenyuanColor.textPrimary.opacity((0.026 + Double(index) * 0.012) * intensity),
                                style: StrokeStyle(lineWidth: index == 0 ? 1.2 : 0.8, lineCap: .round, dash: index == 2 ? [5, 20] : [])
                            )
                            .frame(width: orbitWidth, height: orbitHeight)
                            .rotationEffect(.degrees(-18 + clamped * 26 + phase * (1.8 + Double(index) * 0.8)))
                            .position(x: centerX, y: centerY)
                    }

                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [
                                    .clear,
                                    BenyuanColor.accentGold.opacity((0.08 + breath * 0.06) * intensity),
                                    BenyuanColor.textPrimary.opacity(0.10 * intensity),
                                    .clear
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: width * (0.26 + clamped * 0.28), height: 2)
                        .blur(radius: 0.8)
                        .position(x: centerX, y: centerY + height * 0.11)
                        .blendMode(.screen)
                }
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

struct BenyuanQuestionStepMotion<Content: View>: View {
    var direction: BenyuanQuestionMotionDirection
    var token: UUID
    @ViewBuilder var content: () -> Content

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion
    @State private var isSettled = false
    @State private var isTransitActive = false

    var body: some View {
        content()
            .opacity(isSettled ? 1 : 0.18)
            .offset(x: isSettled ? 0 : initialOffset)
            .blur(radius: isSettled || accessibilityReduceMotion ? 0 : 9)
            .scaleEffect(isSettled ? 1 : 0.988)
            .modifier(BenyuanStarTransitModifier(isActive: isTransitActive, direction: direction))
            .onAppear {
                settle()
            }
            .onChange(of: token) { _ in
                settle()
            }
    }

    private var initialOffset: CGFloat {
        guard !accessibilityReduceMotion else { return 0 }
        switch direction {
        case .forward: return 32
        case .backward: return -32
        case .reset: return 0
        }
    }

    private func settle() {
        isSettled = false
        isTransitActive = !accessibilityReduceMotion
        withAnimation(.easeOut(duration: accessibilityReduceMotion ? 0.12 : 0.46)) {
            isSettled = true
        }
        Task {
            try? await Task.sleep(nanoseconds: UInt64(accessibilityReduceMotion ? 40_000_000 : 620_000_000))
            await MainActor.run {
                isTransitActive = false
            }
        }
    }
}

struct BenyuanStarTransitModifier: ViewModifier {
    var isActive: Bool
    var direction: BenyuanQuestionMotionDirection

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion

    func body(content: Content) -> some View {
        content
            .overlay {
                if isActive && !accessibilityReduceMotion {
                    BenyuanStarTransitLayer(direction: direction)
                }
            }
    }
}

private struct BenyuanStarTransitLayer: View {
    var direction: BenyuanQuestionMotionDirection

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let phase = timeline.date.timeIntervalSinceReferenceDate
            let pass = phase.truncatingRemainder(dividingBy: 0.92) / 0.92
            let eased = 1 - pow(1 - pass, 3)

            GeometryReader { proxy in
                let width = max(proxy.size.width, 1)
                let height = max(proxy.size.height, 1)
                let sign: CGFloat = direction == .backward ? -1 : 1
                let x = direction == .reset ? width * 0.5 : width * (sign > 0 ? eased : 1 - eased)
                let y = height * (0.28 + 0.22 * sin(eased * .pi))

                ZStack {
                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [
                                    .clear,
                                    BenyuanColor.accentGold.opacity(0.04),
                                    BenyuanColor.textPrimary.opacity(0.24),
                                    BenyuanColor.accentGold.opacity(0.30),
                                    .clear
                                ],
                                startPoint: sign > 0 ? .leading : .trailing,
                                endPoint: sign > 0 ? .trailing : .leading
                            )
                        )
                        .frame(width: width * 0.48, height: 2)
                        .blur(radius: 0.7)
                        .rotationEffect(.degrees(sign > 0 ? -10 : 10))
                        .position(x: x - sign * width * 0.16, y: y + height * 0.08)
                        .blendMode(.screen)

                    Circle()
                        .fill(BenyuanColor.accentGold.opacity(0.74))
                        .frame(width: 7, height: 7)
                        .shadow(color: BenyuanColor.accentGold.opacity(0.55), radius: 16)
                        .position(x: x, y: y)

                    ForEach(0..<7, id: \.self) { index in
                        let spread = CGFloat(index - 3)
                        Circle()
                            .fill(index.isMultiple(of: 2) ? BenyuanColor.accentGold.opacity(0.42) : BenyuanColor.textPrimary.opacity(0.18))
                            .frame(width: index.isMultiple(of: 2) ? 3.2 : 2.2, height: index.isMultiple(of: 2) ? 3.2 : 2.2)
                            .position(
                                x: x - sign * (28 + CGFloat(index) * 9),
                                y: y + spread * 4 + sin(phase * 2.2 + Double(index)) * 5
                            )
                            .blur(radius: index.isMultiple(of: 2) ? 0.2 : 0.7)
                    }
                }
                .opacity(1 - abs(pass - 0.50) * 0.65)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

struct BenyuanProcessingPhaseCurrent: View {
    var progress: Double

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let phase = accessibilityReduceMotion ? 0 : timeline.date.timeIntervalSinceReferenceDate
            let clamped = min(max(progress, 0.04), 1)
            let pulse = accessibilityReduceMotion ? 0.5 : 0.5 + 0.5 * sin(phase * 0.74)

            GeometryReader { proxy in
                let width = proxy.size.width
                let height = proxy.size.height
                let center = CGPoint(x: width * 0.50, y: height * 0.48)

                ZStack {
                    ForEach(0..<3, id: \.self) { index in
                        Ellipse()
                            .stroke(
                                AngularGradient(
                                    colors: [
                                        BenyuanColor.textPrimary.opacity(0.05 + pulse * 0.03),
                                        BenyuanColor.accentGold.opacity(0.10 + Double(index) * 0.04),
                                        BenyuanColor.textPrimary.opacity(0.08 + pulse * 0.05),
                                        BenyuanColor.accentGold.opacity(0.05),
                                        BenyuanColor.textPrimary.opacity(0.05 + pulse * 0.03)
                                    ],
                                    center: .center,
                                    angle: .degrees(phase * (6 + Double(index) * 1.2))
                                ),
                                style: StrokeStyle(lineWidth: index == 0 ? 1.4 : 0.9, lineCap: .round)
                            )
                            .frame(width: width * (0.72 + CGFloat(index) * 0.18), height: height * (0.30 + CGFloat(index) * 0.08))
                            .rotationEffect(.degrees(-16 + phase * (4.0 + Double(index) * 1.4) + clamped * 22))
                            .position(center)
                    }

                    ForEach(0..<10, id: \.self) { index in
                        let angle = phase * (0.42 + Double(index) * 0.02) + Double(index) * .pi * 2 / 10
                        let radiusX = width * (0.24 + CGFloat(index % 3) * 0.045)
                        let radiusY = height * (0.10 + CGFloat(index % 2) * 0.035)
                        Circle()
                            .fill(index.isMultiple(of: 4) ? BenyuanColor.accentGold.opacity(0.68) : BenyuanColor.textPrimary.opacity(0.18))
                            .frame(width: index.isMultiple(of: 4) ? 4 : 2.4, height: index.isMultiple(of: 4) ? 4 : 2.4)
                            .position(x: center.x + cos(angle) * radiusX, y: center.y + sin(angle) * radiusY)
                            .blur(radius: index.isMultiple(of: 4) ? 0.1 : 0.5)
                    }

                    Circle()
                        .fill(BenyuanColor.accentGold.opacity(0.55 + pulse * 0.22))
                        .frame(width: 7 + pulse * 3, height: 7 + pulse * 3)
                        .position(
                            x: center.x + cos(phase * 0.76 + clamped * .pi * 2) * width * 0.20,
                            y: center.y + sin(phase * 0.76 + clamped * .pi * 2) * height * 0.09
                        )
                        .shadow(color: BenyuanColor.accentGold.opacity(0.42), radius: 12)
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

struct BenyuanFlowOrbitTrail: View {
    var progress: Double
    var intensity: Double = 1
    var tilt: Double = -12

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let phase = accessibilityReduceMotion ? 0 : timeline.date.timeIntervalSinceReferenceDate
            let clamped = min(max(progress, 0.04), 1)
            let pulse = accessibilityReduceMotion ? 0.5 : 0.5 + 0.5 * sin(phase * 0.52)

            GeometryReader { proxy in
                let width = proxy.size.width
                let height = proxy.size.height
                let center = CGPoint(x: width * 0.50, y: height * 0.50)

                ZStack {
                    Ellipse()
                        .stroke(BenyuanColor.textPrimary.opacity(0.045 * intensity), lineWidth: 1)
                        .frame(width: width * 0.84, height: height * 0.34)
                        .rotationEffect(.degrees(tilt))
                        .position(center)

                    Ellipse()
                        .stroke(
                            AngularGradient(
                                colors: [
                                    BenyuanColor.textPrimary.opacity(0.04 * intensity),
                                    BenyuanColor.accentGold.opacity((0.18 + pulse * 0.08) * intensity),
                                    BenyuanColor.textPrimary.opacity(0.16 * intensity),
                                    BenyuanColor.accentGold.opacity(0.06 * intensity),
                                    BenyuanColor.textPrimary.opacity(0.04 * intensity)
                                ],
                                center: .center,
                                angle: .degrees(phase * 4.2)
                            ),
                            style: StrokeStyle(lineWidth: 1.35, lineCap: .round, dash: [1, 0])
                        )
                        .frame(width: width * 0.88, height: height * 0.36)
                        .rotationEffect(.degrees(tilt + phase * 4.2))
                        .position(center)

                    Circle()
                        .fill(BenyuanColor.accentGold.opacity((0.64 + pulse * 0.22) * intensity))
                        .frame(width: 6 + pulse * 2, height: 6 + pulse * 2)
                        .position(
                            x: center.x + cos(phase * 0.64 + clamped * .pi * 2) * width * 0.38,
                            y: center.y + sin(phase * 0.64 + clamped * .pi * 2) * height * 0.15
                        )
                        .shadow(color: BenyuanColor.accentGold.opacity(0.38 * intensity), radius: 10)

                    ForEach(0..<7, id: \.self) { index in
                        let angle = phase * (0.42 + Double(index) * 0.025) + Double(index) * .pi * 2 / 7 + clamped
                        Circle()
                            .fill(index.isMultiple(of: 3) ? BenyuanColor.accentGold.opacity(0.42 * intensity) : BenyuanColor.textPrimary.opacity(0.16 * intensity))
                            .frame(width: index.isMultiple(of: 3) ? 3.4 : 2.2, height: index.isMultiple(of: 3) ? 3.4 : 2.2)
                            .position(
                                x: center.x + cos(angle) * width * 0.38,
                                y: center.y + sin(angle) * height * 0.15
                            )
                            .blur(radius: index.isMultiple(of: 3) ? 0.2 : 0.6)
                    }
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

struct BenyuanPressableMotionStyle: ButtonStyle {
    var scale: CGFloat = 0.972
    var glow: Double = 0.10
    var haptic: UIImpactFeedbackGenerator.FeedbackStyle? = .soft

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !accessibilityReduceMotion ? scale : 1)
            .brightness(configuration.isPressed ? 0.025 : 0)
            .shadow(color: BenyuanColor.accentGold.opacity(configuration.isPressed ? glow : 0), radius: configuration.isPressed ? 18 : 0, y: 8)
            .animation(.easeOut(duration: accessibilityReduceMotion ? 0.08 : 0.16), value: configuration.isPressed)
            .onChange(of: configuration.isPressed) { isPressed in
                guard isPressed, let haptic else { return }
                UIImpactFeedbackGenerator(style: haptic).impactOccurred()
            }
    }
}

struct BenyuanSelectionPulseLayer: View {
    var isActive: Bool
    var cornerRadius: CGFloat = 24

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let phase = accessibilityReduceMotion ? 0 : timeline.date.timeIntervalSinceReferenceDate
            let pulse = isActive ? (accessibilityReduceMotion ? 0.45 : 0.5 + 0.5 * sin(phase * 3.2)) : 0

            RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                .stroke(BenyuanColor.accentGold.opacity(isActive ? 0.18 + pulse * 0.18 : 0), lineWidth: 1)
                .scaleEffect(isActive && !accessibilityReduceMotion ? 1.006 + pulse * 0.006 : 1)
                .shadow(color: BenyuanColor.accentGold.opacity(isActive ? 0.08 + pulse * 0.08 : 0), radius: isActive ? 16 : 0)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

struct BenyuanNovaSelectionBurst: View {
    var trigger: Int
    var alignment: Alignment = .trailing

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion
    @State private var visibleTrigger = 0
    @State private var startDate = Date()

    var body: some View {
        GeometryReader { proxy in
            let trailingInset: CGFloat = 37
            let emitter = CGPoint(x: proxy.size.width - trailingInset, y: proxy.size.height * 0.5)
            let duration = accessibilityReduceMotion ? 0.01 : 0.72

            ZStack {
                if visibleTrigger > 0 {
                    TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
                        let elapsed = min(max(timeline.date.timeIntervalSince(startDate), 0), duration)
                        let progress = duration <= 0.01 ? 1 : elapsed / duration
                        let eased = CGFloat(1 - pow(1 - progress, 3))

                        ZStack {
                            ForEach(0..<14, id: \.self) { index in
                                particle(index: index, emitter: emitter, eased: eased)
                            }

                            Circle()
                                .stroke(BenyuanColor.accentGold.opacity(Double(max(0, 0.38 - eased * 0.24))), lineWidth: 1)
                                .frame(width: 34 + eased * 30, height: 34 + eased * 30)
                                .position(emitter)

                            Circle()
                                .fill(BenyuanColor.accentGold.opacity(Double(max(0, 0.80 - eased * 0.46))))
                                .frame(width: 6 + eased * 3, height: 6 + eased * 3)
                                .position(x: emitter.x, y: emitter.y + eased * 10)
                                .shadow(color: BenyuanColor.accentGold.opacity(0.45), radius: 12)
                        }
                        .transition(.opacity.combined(with: .scale(scale: 0.72)))
                    }
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onChange(of: trigger) { value in
            guard value > 0 else { return }
            startDate = Date()
            visibleTrigger = value
            Task {
                try? await Task.sleep(nanoseconds: UInt64(accessibilityReduceMotion ? 40_000_000 : 760_000_000))
                await MainActor.run {
                    if visibleTrigger == value {
                        visibleTrigger = 0
                    }
                }
            }
        }
        .animation(.easeOut(duration: accessibilityReduceMotion ? 0.01 : 0.18), value: visibleTrigger)
    }

    private func particle(index: Int, emitter: CGPoint, eased: CGFloat) -> some View {
        let angle = Double(index) * .pi * 2 / 14
        let burst = eased * (18 + CGFloat(index % 3) * 7)
        let fall = eased * (28 + CGFloat(index % 4) * 7)
        let sidePull: CGFloat = index % 2 == 0 ? 4 : -3
        let drift = CGFloat(cos(angle)) * burst - sidePull * eased
        let lift = CGFloat(sin(angle)) * burst * 0.45
        let opacity = Double(max(0, 0.70 - eased * 0.58))
        let height = 7 + CGFloat(index % 3) * 3
        let blurRadius: CGFloat = index.isMultiple(of: 2) ? 0.1 : 0.7

        return Capsule()
            .fill(BenyuanColor.accentGold.opacity(opacity))
            .frame(width: 2.2, height: height)
            .rotationEffect(.radians(angle + Double(eased) * 1.8))
            .position(x: emitter.x + drift, y: emitter.y + lift + fall)
            .blur(radius: blurRadius)
    }
}

struct BenyuanMomentaryChoiceFeedback: View {
    var isActive: Bool
    var label: String = "已记录选择"

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let phase = accessibilityReduceMotion ? 0 : timeline.date.timeIntervalSinceReferenceDate
            let pulse = isActive ? (accessibilityReduceMotion ? 0.5 : 0.5 + 0.5 * sin(phase * 5.2)) : 0

            VStack(spacing: BenyuanSpacing.x2) {
                Circle()
                    .stroke(BenyuanColor.accentGold.opacity(0.22 + pulse * 0.18), lineWidth: 1.2)
                    .frame(width: 62 + pulse * 8, height: 62 + pulse * 8)
                    .overlay(
                        Circle()
                            .fill(BenyuanColor.accentGold.opacity(0.14 + pulse * 0.10))
                            .frame(width: 12 + pulse * 5, height: 12 + pulse * 5)
                    )
                Text(label)
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .foregroundStyle(BenyuanColor.accentGold.opacity(0.82))
            }
            .opacity(isActive ? 1 : 0)
            .scaleEffect(isActive && !accessibilityReduceMotion ? 1 + pulse * 0.015 : 1)
            .animation(.easeOut(duration: accessibilityReduceMotion ? 0.08 : 0.18), value: isActive)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(!isActive)
    }
}

struct BenyuanAssetMutationMotion<Content: View>: View {
    var mutationKey: String
    @ViewBuilder var content: () -> Content

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion

    var body: some View {
        content()
            .transition(
                .opacity
                    .combined(with: .scale(scale: accessibilityReduceMotion ? 1 : 0.94))
                    .combined(with: .move(edge: .bottom))
            )
            .animation(.spring(response: accessibilityReduceMotion ? 0.12 : 0.36, dampingFraction: 0.84), value: mutationKey)
    }
}

struct BenyuanNativeTopBar: View {
    let progress: Double
    let label: String
    var onAccount: (() -> Void)?

    var body: some View {
        VStack(spacing: BenyuanSpacing.x3) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("本源")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text(label)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textTertiary)
                }

                Spacer()

                if let onAccount {
                    Button(action: onAccount) {
                        Image(systemName: "person.crop.circle")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(BenyuanColor.textPrimary)
                            .frame(width: 36, height: 36)
                            .background(Circle().fill(BenyuanColor.glassFill).overlay(Circle().stroke(BenyuanColor.glassStroke)))
                    }
                    .buttonStyle(.plain)
                }
            }

            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Capsule().fill(BenyuanColor.textPrimary.opacity(0.08))
                    Capsule()
                        .fill(LinearGradient(colors: [BenyuanColor.accentGold, BenyuanColor.textPrimary.opacity(0.86)], startPoint: .leading, endPoint: .trailing))
                        .frame(width: max(18, proxy.size.width * min(max(progress, 0), 1)))
                }
            }
            .frame(height: 3)
        }
        .padding(.horizontal, BenyuanSpacing.x4)
        .padding(.top, BenyuanSpacing.x3)
    }
}

struct BenyuanNativePrimaryButton: View {
    let title: String
    var disabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(BenyuanColor.primaryCTAText)
                .frame(maxWidth: .infinity)
                .minHeight(54)
                .background(
                    Capsule()
                        .fill(LinearGradient(colors: [BenyuanColor.primaryCTA, BenyuanColor.nebulaViolet.opacity(0.86)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .overlay(Capsule().stroke(BenyuanColor.accentGold.opacity(0.28), lineWidth: 1))
                )
        }
        .disabled(disabled)
        .opacity(disabled ? 0.46 : 1)
    }
}

struct BenyuanNativeOptionButton: View {
    let index: Int
    let title: String
    let active: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: BenyuanSpacing.x4) {
                Text(String(UnicodeScalar(65 + index)!))
                    .font(.system(size: 13, weight: .black, design: .monospaced))
                    .foregroundStyle(active ? BenyuanColor.bgVoid : BenyuanColor.accentGold)
                    .frame(width: 34, height: 34)
                    .background(Circle().fill(active ? BenyuanColor.accentGold : BenyuanColor.glassFill))

                Text(title.removingLeadingEmoji())
                    .font(.system(size: 15, weight: .semibold))
                    .lineSpacing(4)
                    .foregroundStyle(BenyuanColor.textPrimary)
                    .multilineTextAlignment(.leading)
                    .frame(maxWidth: .infinity, alignment: .leading)

                Circle()
                    .stroke(active ? BenyuanColor.accentGold : BenyuanColor.glassStroke, lineWidth: 1.5)
                    .frame(width: 18, height: 18)
                    .overlay(Circle().fill(active ? BenyuanColor.accentGold : .clear).frame(width: 8, height: 8))
            }
            .padding(.horizontal, BenyuanSpacing.x4)
            .padding(.vertical, BenyuanSpacing.x3)
            .background(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .fill(active ? BenyuanColor.glassFillStrong : BenyuanColor.glassFill)
                    .overlay(
                        RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .stroke(active ? BenyuanColor.accentGold.opacity(0.36) : BenyuanColor.glassStroke, lineWidth: 1)
                    )
                )
        }
        .buttonStyle(BenyuanPressableMotionStyle(scale: 0.982, glow: active ? 0.14 : 0.08))
    }
}

struct BenyuanToastView: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(BenyuanColor.textPrimary)
            .padding(.horizontal, 16)
            .padding(.vertical, 11)
            .background(Capsule().fill(BenyuanColor.bgVoid.opacity(0.82)).overlay(Capsule().stroke(BenyuanColor.glassStroke)))
            .shadow(color: BenyuanColor.accentGold.opacity(0.12), radius: 18, y: 8)
    }
}

struct BenyuanRevealedStack<Content: View>: View {
    var axis: Axis = .vertical
    var spacing: CGFloat = BenyuanSpacing.x3
    var delay: Double = 0
    @ViewBuilder var content: () -> Content

    @State private var isRevealed = false

    var body: some View {
        Group {
            if axis == .vertical {
                VStack(alignment: .leading, spacing: spacing, content: content)
            } else {
                HStack(spacing: spacing, content: content)
            }
        }
        .opacity(isRevealed ? 1 : 0)
        .offset(y: isRevealed ? 0 : 18)
        .blur(radius: isRevealed ? 0 : 8)
        .scaleEffect(isRevealed ? 1 : 0.985)
        .task {
            guard !isRevealed else { return }
            if delay > 0 {
                try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            }
            await MainActor.run {
                withAnimation(.easeOut(duration: 0.72)) {
                    isRevealed = true
                }
            }
        }
    }
}

struct BenyuanQuestionSignalField: View {
    var progress: Double
    var module: BenyuanModuleKey

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 24.0)) { timeline in
            let phase = timeline.date.timeIntervalSinceReferenceDate
            let clamped = min(max(progress, 0.04), 1)

            GeometryReader { proxy in
                let width = proxy.size.width
                let height = proxy.size.height
                let center = CGPoint(x: width * 0.52, y: height * 0.52)
                let bodySize = min(width, height) * (module == .a ? 0.46 : module == .b ? 0.40 : 0.43)

                ZStack {
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .fill(BenyuanColor.glassFill.opacity(0.44))
                        .overlay(
                            RoundedRectangle(cornerRadius: 28, style: .continuous)
                                .stroke(BenyuanColor.glassStroke.opacity(0.72), lineWidth: 1)
                        )

                    BenyuanClueOrbitField(module: module, size: bodySize, phase: phase, progress: clamped, intensity: 0.92)
                        .position(center)

                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [
                                    BenyuanColor.accentGold.opacity(0.66),
                                    BenyuanColor.textPrimary.opacity(0.82),
                                    BenyuanColor.textPrimary.opacity(0.08)
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: max(28, width * clamped), height: 3)
                        .position(x: width * 0.5, y: height * 0.82)

                    ForEach(0..<5, id: \.self) { index in
                        let angle = phase * (0.32 + Double(index) * 0.04) + Double(index) * 1.34 + moduleOffset / 18
                        let radius = width * (0.12 + CGFloat(index) * 0.045)
                        Circle()
                            .fill(index == 0 ? BenyuanColor.accentGold.opacity(0.92) : BenyuanColor.textPrimary.opacity(0.25))
                            .frame(width: index == 0 ? 8 : 5, height: index == 0 ? 8 : 5)
                            .position(
                                x: center.x + cos(angle) * radius,
                                y: center.y + sin(angle) * radius * 0.42
                            )
                            .shadow(color: BenyuanColor.accentGold.opacity(index == 0 ? 0.44 : 0.14), radius: 10)
                    }
                }
            }
        }
        .accessibilityHidden(true)
    }

    private var moduleOffset: Double {
        switch module {
        case .a: return 0
        case .b: return 38
        case .c: return 76
        }
    }
}

struct BenyuanUploadCelestialPortal: View {
    var progress: Double
    var module: BenyuanModuleKey
    var hasAssets: Bool

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let phase = accessibilityReduceMotion ? 0 : timeline.date.timeIntervalSinceReferenceDate
            let clamped = min(max(progress, 0.04), 1)
            let pulse = accessibilityReduceMotion ? 0.45 : 0.5 + 0.5 * sin(phase * 0.56)

            GeometryReader { proxy in
                let width = proxy.size.width
                let height = proxy.size.height
                let center = CGPoint(x: width * 0.50, y: height * 0.50)
                let bodySize = min(width, height) * 0.42

                ZStack {
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .fill(hasAssets ? BenyuanColor.glassFillStrong.opacity(0.90) : BenyuanColor.glassFill.opacity(0.82))

                    RadialGradient(
                        colors: [
                            BenyuanColor.accentGold.opacity(hasAssets ? 0.12 + pulse * 0.04 : 0.07 + pulse * 0.03),
                            BenyuanColor.nebulaViolet.opacity(0.10),
                            .clear
                        ],
                        center: UnitPoint(x: center.x / max(width, 1), y: center.y / max(height, 1)),
                        startRadius: 12,
                        endRadius: width * 0.62
                    )
                    .blendMode(.screen)

                    BenyuanClueOrbitField(module: module, size: bodySize, phase: phase, progress: clamped, intensity: hasAssets ? 1.16 : 0.94)
                        .scaleEffect(1.22 + pulse * 0.035)
                        .rotationEffect(.degrees(module == .c ? -10 : 0))
                        .position(center)

                    ForEach(0..<3, id: \.self) { index in
                        Ellipse()
                            .stroke(
                                AngularGradient(
                                    colors: [
                                        BenyuanColor.textPrimary.opacity(0.035),
                                        BenyuanColor.accentGold.opacity((0.11 + Double(index) * 0.025) * (hasAssets ? 1.16 : 0.78)),
                                        BenyuanColor.textPrimary.opacity(0.07),
                                        BenyuanColor.textPrimary.opacity(0.035)
                                    ],
                                    center: .center,
                                    angle: .degrees(phase * (4 + Double(index)))
                                ),
                                style: StrokeStyle(lineWidth: index == 0 ? 1.1 : 0.8, lineCap: .round)
                            )
                            .frame(width: width * (0.42 + CGFloat(index) * 0.18), height: height * (0.18 + CGFloat(index) * 0.04))
                            .rotationEffect(.degrees(-12 + phase * (2.6 + Double(index) * 0.7) + moduleOffset))
                            .position(center)
                    }

                    ForEach(0..<11, id: \.self) { index in
                        let angle = phase * (0.36 + Double(index) * 0.018) + Double(index) * .pi * 2 / 11
                        let radiusX = width * (0.13 + CGFloat(index % 4) * 0.035)
                        let radiusY = height * (0.052 + CGFloat(index % 3) * 0.022)
                        Circle()
                            .fill(index.isMultiple(of: 4) ? BenyuanColor.accentGold.opacity(0.62) : BenyuanColor.textPrimary.opacity(0.18))
                            .frame(width: index.isMultiple(of: 4) ? 4.2 : 2.3, height: index.isMultiple(of: 4) ? 4.2 : 2.3)
                            .position(x: center.x + cos(angle) * radiusX, y: center.y + sin(angle) * radiusY)
                            .blur(radius: index.isMultiple(of: 4) ? 0.1 : 0.5)
                    }

                    BenyuanUploadCompleteProgressOrbit(
                        progress: clamped,
                        size: bodySize * 1.72,
                        phase: phase,
                        moduleOffset: moduleOffset,
                        intensity: hasAssets ? 1 : 0.72
                    )
                    .position(center)
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private var moduleOffset: Double {
        switch module {
        case .a: return -18
        case .b: return 12
        case .c: return 34
        }
    }
}

struct BenyuanUploadCompleteProgressOrbit: View {
    var progress: Double
    var size: CGFloat
    var phase: TimeInterval
    var moduleOffset: Double
    var intensity: Double

    var body: some View {
        ZStack {
            Circle()
                .stroke(
                    AngularGradient(
                        colors: [
                            BenyuanColor.accentGold.opacity(0.34 * intensity),
                            BenyuanColor.textPrimary.opacity(0.42 * intensity),
                            BenyuanColor.accentGold.opacity((0.18 + progress * 0.18) * intensity),
                            BenyuanColor.textPrimary.opacity(0.18 * intensity),
                            BenyuanColor.accentGold.opacity(0.34 * intensity)
                        ],
                        center: .center,
                        angle: .degrees(phase * 7 + moduleOffset)
                    ),
                    style: StrokeStyle(lineWidth: 1.6, lineCap: .round)
                )

            Circle()
                .stroke(BenyuanColor.textPrimary.opacity(0.06 * intensity), lineWidth: 0.8)
                .scaleEffect(1.10)

            ForEach(0..<5, id: \.self) { index in
                let angle = phase * (0.46 + Double(index) * 0.018) + Double(index) * .pi * 2 / 5 + progress * .pi
                Circle()
                    .fill(index.isMultiple(of: 2) ? BenyuanColor.accentGold.opacity(0.62 * intensity) : BenyuanColor.textPrimary.opacity(0.18 * intensity))
                    .frame(width: index.isMultiple(of: 2) ? 3.4 : 2.1, height: index.isMultiple(of: 2) ? 3.4 : 2.1)
                    .offset(x: cos(angle) * size * 0.50, y: sin(angle) * size * 0.50)
                    .blur(radius: index.isMultiple(of: 2) ? 0.1 : 0.4)
            }
        }
        .frame(width: size, height: size)
        .rotationEffect(.degrees(phase * 4 + moduleOffset))
        .blendMode(.screen)
    }
}

struct BenyuanClueOrbitField: View {
    var module: BenyuanModuleKey
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var intensity: Double = 1

    var body: some View {
        ZStack {
            BenyuanMiniCelestialGlyph(module: module, size: size, phase: phase, progress: progress)
                .scaleEffect(0.96)

            Circle()
                .stroke(
                    AngularGradient(
                        colors: [
                            BenyuanColor.accentGold.opacity(0.10 * intensity),
                            BenyuanColor.textPrimary.opacity(0.24 * intensity),
                            BenyuanColor.accentGold.opacity((0.24 + progress * 0.14) * intensity),
                            BenyuanColor.textPrimary.opacity(0.10 * intensity),
                            BenyuanColor.accentGold.opacity(0.10 * intensity)
                        ],
                        center: .center,
                        angle: .degrees(phase * 8 + moduleOffset)
                    ),
                    style: StrokeStyle(lineWidth: 1.2, lineCap: .round)
                )
                .frame(width: size * 1.50, height: size * 1.50)
                .rotationEffect(.degrees(phase * 3.8 + moduleOffset))
                .blendMode(.screen)

            Circle()
                .stroke(BenyuanColor.textPrimary.opacity(0.045 * intensity), lineWidth: 0.8)
                .frame(width: size * 1.78, height: size * 1.78)
                .rotationEffect(.degrees(-phase * 2.4 + moduleOffset))
                .blendMode(.screen)

            ForEach(0..<8, id: \.self) { index in
                let angle = phase * (0.36 + Double(index) * 0.018) + Double(index) * .pi * 2 / 8 + moduleOffset / 12
                let radius = size * (0.55 + CGFloat(index % 3) * 0.085)
                Circle()
                    .fill(index.isMultiple(of: 3) ? BenyuanColor.accentGold.opacity(0.70 * intensity) : BenyuanColor.textPrimary.opacity(0.18 * intensity))
                    .frame(width: index.isMultiple(of: 3) ? 3.8 : 2.2, height: index.isMultiple(of: 3) ? 3.8 : 2.2)
                    .offset(x: cos(angle) * radius, y: sin(angle) * radius)
                    .blur(radius: index.isMultiple(of: 3) ? 0.1 : 0.6)
            }
        }
        .frame(width: size * 2.04, height: size * 2.04)
        .shadow(color: BenyuanColor.accentGold.opacity(0.08 * intensity), radius: 18)
    }

    private var moduleOffset: Double {
        switch module {
        case .a: return -16
        case .b: return 18
        case .c: return 42
        }
    }
}

struct BenyuanMiniCelestialGlyph: View {
    var module: BenyuanModuleKey
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    var body: some View {
        ZStack {
            switch module {
            case .a:
                miniBlackBody
                closedOrbit(width: 1.86, height: 0.62, opacity: 0.22, speed: 7)
                closedOrbit(width: 1.36, height: 0.44, opacity: 0.11, speed: -4, dash: [2, 12])
            case .b:
                nebulaBody
                closedOrbit(width: 1.52, height: 0.48, opacity: 0.16, speed: 3, dash: [3, 14])
                closedOrbit(width: 1.04, height: 0.86, opacity: 0.10, speed: -5)
            case .c:
                lensBody
                closedOrbit(width: 1.72, height: 0.52, opacity: 0.18, speed: 5)
                closedOrbit(width: 0.88, height: 1.22, opacity: 0.11, speed: -3, dash: [2, 10])
            }

            ForEach(0..<6, id: \.self) { index in
                let angle = phase * (0.28 + Double(index) * 0.025) + Double(index) * .pi * 2 / 6
                Circle()
                    .fill(index.isMultiple(of: 3) ? BenyuanColor.accentGold.opacity(0.76) : BenyuanColor.textPrimary.opacity(0.20))
                    .frame(width: index.isMultiple(of: 3) ? 4 : 2.4, height: index.isMultiple(of: 3) ? 4 : 2.4)
                    .offset(x: cos(angle) * size * 0.72, y: sin(angle) * size * 0.23)
                    .blur(radius: index.isMultiple(of: 3) ? 0.1 : 0.5)
            }
        }
        .frame(width: size * 2.0, height: size * 1.36)
    }

    private var miniBlackBody: some View {
        Circle()
            .fill(
                RadialGradient(
                    colors: [
                        BenyuanColor.planetEdge.opacity(0.30),
                        BenyuanColor.aubergineBlack.opacity(0.72),
                        BenyuanColor.bgVoid
                    ],
                    center: UnitPoint(x: 0.34, y: 0.24),
                    startRadius: 2,
                    endRadius: size * 0.58
                )
            )
            .frame(width: size, height: size)
            .overlay(Circle().stroke(BenyuanColor.textPrimary.opacity(0.08), lineWidth: 1))
    }

    private var nebulaBody: some View {
        Circle()
            .fill(
                AngularGradient(
                    colors: [
                        BenyuanColor.bgVoid,
                        BenyuanColor.nebulaViolet.opacity(0.46),
                        BenyuanColor.planetEdge.opacity(0.22),
                        BenyuanColor.bgVoid
                    ],
                    center: .center,
                    angle: .degrees(phase * 10)
                )
            )
            .frame(width: size * 0.92, height: size * 0.92)
            .blur(radius: 0.2)
            .overlay(Circle().stroke(BenyuanColor.accentGold.opacity(0.10), lineWidth: 1))
    }

    private var lensBody: some View {
        Circle()
            .fill(BenyuanColor.bgVoid.opacity(0.74))
            .frame(width: size * 0.78, height: size * 0.78)
            .overlay(Circle().stroke(BenyuanColor.accentGold.opacity(0.18 + progress * 0.10), lineWidth: 1))
            .shadow(color: BenyuanColor.accentGold.opacity(0.13), radius: 14)
    }

    private func closedOrbit(width: CGFloat, height: CGFloat, opacity: Double, speed: Double, dash: [CGFloat] = []) -> some View {
        Ellipse()
            .stroke(
                BenyuanColor.textPrimary.opacity(opacity),
                style: StrokeStyle(lineWidth: 1, lineCap: .round, dash: dash)
            )
            .frame(width: size * width, height: size * height)
            .rotationEffect(.degrees(phase * speed + moduleOffset))
    }

    private var moduleOffset: Double {
        switch module {
        case .a: return -14
        case .b: return 24
        case .c: return 54
        }
    }
}

struct BenyuanStageLens: View {
    var progress: Double
    var intensity: Double = 1

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 24.0)) { timeline in
            let phase = timeline.date.timeIntervalSinceReferenceDate
            let clamped = min(max(progress, 0), 1)

            GeometryReader { proxy in
                let width = proxy.size.width
                let height = proxy.size.height
                let center = CGPoint(x: width * (0.46 + 0.08 * clamped), y: height * 0.40)

                ZStack {
                    RadialGradient(
                        colors: [
                            BenyuanColor.accentGold.opacity(0.10 * intensity),
                            BenyuanColor.nebulaViolet.opacity(0.13 * intensity),
                            .clear
                        ],
                        center: UnitPoint(x: center.x / max(width, 1), y: center.y / max(height, 1)),
                        startRadius: 8,
                        endRadius: width * 0.72
                    )

                    ForEach(0..<4, id: \.self) { index in
                        Ellipse()
                            .trim(from: 0.08, to: 0.68 + clamped * 0.20)
                            .stroke(BenyuanColor.textPrimary.opacity(0.035 + Double(index) * 0.018), style: StrokeStyle(lineWidth: index == 0 ? 1.4 : 1, lineCap: .round, dash: index == 3 ? [4, 16] : []))
                            .frame(width: width * (0.52 + CGFloat(index) * 0.18), height: height * (0.18 + CGFloat(index) * 0.08))
                            .rotationEffect(.degrees(phase * (3.2 + Double(index)) + Double(index) * 31))
                            .position(center)
                    }

                    Circle()
                        .fill(BenyuanColor.bgVoid.opacity(0.62))
                        .frame(width: 18 + clamped * 16, height: 18 + clamped * 16)
                        .overlay(Circle().stroke(BenyuanColor.accentGold.opacity(0.24), lineWidth: 1))
                        .position(center)
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

struct BenyuanNebulaTheaterField: View {
    var progress: Double

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 24.0)) { timeline in
            let phase = timeline.date.timeIntervalSinceReferenceDate
            let clamped = min(max(progress, 0), 1)
            let pulse = 0.5 + 0.5 * sin(phase * 0.32)

            GeometryReader { proxy in
                let width = proxy.size.width
                let height = proxy.size.height
                let center = CGPoint(x: width * (0.42 + clamped * 0.18), y: height * 0.34)

                ZStack {
                    RadialGradient(
                        colors: [
                            BenyuanColor.nebulaViolet.opacity(0.20 + pulse * 0.05),
                            BenyuanColor.planetEdge.opacity(0.10),
                            BenyuanColor.bgVoid.opacity(0.0)
                        ],
                        center: UnitPoint(x: center.x / max(width, 1), y: center.y / max(height, 1)),
                        startRadius: 8,
                        endRadius: width * 0.70
                    )

                    ForEach(0..<5, id: \.self) { index in
                        Ellipse()
                            .stroke(
                                AngularGradient(
                                    colors: [
                                        BenyuanColor.nebulaViolet.opacity(0.08),
                                        BenyuanColor.textPrimary.opacity(0.08 + Double(index) * 0.012),
                                        BenyuanColor.accentGold.opacity(0.05 + pulse * 0.03),
                                        BenyuanColor.nebulaViolet.opacity(0.08)
                                    ],
                                    center: .center,
                                    angle: .degrees(phase * (1.8 + Double(index) * 0.6))
                                ),
                                style: StrokeStyle(lineWidth: index == 0 ? 1.2 : 0.8, lineCap: .round, dash: index == 4 ? [4, 18] : [])
                            )
                            .frame(width: width * (0.62 + CGFloat(index) * 0.12), height: height * (0.18 + CGFloat(index) * 0.055))
                            .rotationEffect(.degrees(-18 + phase * (1.2 + Double(index) * 0.5)))
                            .position(center)
                            .blur(radius: index > 2 ? 0.7 : 0.2)
                    }

                    ForEach(0..<16, id: \.self) { index in
                        let angle = phase * (0.09 + Double(index) * 0.006) + Double(index) * .pi * 2 / 16
                        Circle()
                            .fill(index.isMultiple(of: 5) ? BenyuanColor.accentGold.opacity(0.26) : BenyuanColor.textPrimary.opacity(0.11))
                            .frame(width: index.isMultiple(of: 5) ? 3 : 1.8, height: index.isMultiple(of: 5) ? 3 : 1.8)
                            .position(
                                x: center.x + cos(angle) * width * (0.16 + CGFloat(index % 4) * 0.052),
                                y: center.y + sin(angle) * height * (0.08 + CGFloat(index % 3) * 0.035)
                            )
                            .blur(radius: index.isMultiple(of: 5) ? 0.2 : 0.9)
                    }
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

extension View {
    func minHeight(_ value: CGFloat) -> some View {
        frame(minHeight: value)
    }
}

extension String {
    func removingLeadingEmoji() -> String {
        let scalars = unicodeScalars.drop { scalar in
            scalar.properties.isEmojiPresentation || scalar.properties.isEmoji || scalar == " " || scalar == "\u{FE0F}"
        }
        let value = String(String.UnicodeScalarView(scalars)).trimmingCharacters(in: .whitespacesAndNewlines)
        return value.isEmpty ? self : value
    }
}
