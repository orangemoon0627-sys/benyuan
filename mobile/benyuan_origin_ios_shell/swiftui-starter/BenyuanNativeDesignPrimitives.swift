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

    var body: some View {
        content()
            .opacity(isSettled ? 1 : 0.18)
            .offset(x: isSettled ? 0 : initialOffset)
            .blur(radius: isSettled || accessibilityReduceMotion ? 0 : 9)
            .scaleEffect(isSettled ? 1 : 0.988)
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
        withAnimation(.easeOut(duration: accessibilityReduceMotion ? 0.12 : 0.46)) {
            isSettled = true
        }
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
                            .trim(from: 0.04, to: 0.22 + clamped * 0.42)
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        .clear,
                                        BenyuanColor.accentGold.opacity(0.10 + Double(index) * 0.04),
                                        BenyuanColor.textPrimary.opacity(0.08 + pulse * 0.05),
                                        .clear
                                    ],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ),
                                style: StrokeStyle(lineWidth: index == 0 ? 1.4 : 0.9, lineCap: .round)
                            )
                            .frame(width: width * (0.72 + CGFloat(index) * 0.18), height: height * (0.30 + CGFloat(index) * 0.08))
                            .rotationEffect(.degrees(-16 + phase * (4.0 + Double(index) * 1.4) + clamped * 22))
                            .position(center)
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
                        .trim(from: 0.02 + clamped * 0.12, to: min(0.98, 0.28 + clamped * 0.58))
                        .stroke(
                            LinearGradient(
                                colors: [
                                    .clear,
                                    BenyuanColor.accentGold.opacity((0.18 + pulse * 0.08) * intensity),
                                    BenyuanColor.textPrimary.opacity(0.16 * intensity),
                                    .clear
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
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
    var onFallback: (() -> Void)?

    var body: some View {
        VStack(spacing: BenyuanSpacing.x3) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("本源")
                        .font(.system(size: 18, weight: .black))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text(label)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textTertiary)
                }

                Spacer()

                if let onAccount {
                    Button(action: onAccount) {
                        Image(systemName: "person.crop.circle")
                            .font(.system(size: 15, weight: .black))
                            .foregroundStyle(BenyuanColor.textPrimary)
                            .frame(width: 36, height: 36)
                            .background(Circle().fill(BenyuanColor.glassFill).overlay(Circle().stroke(BenyuanColor.glassStroke)))
                    }
                    .buttonStyle(.plain)
                }

                if let onFallback {
                    Button("WEB") { onFallback() }
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                        .foregroundStyle(BenyuanColor.accentGold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Capsule().fill(BenyuanColor.glassFill))
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
                .font(.system(size: 16, weight: .black))
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

                ZStack {
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .fill(BenyuanColor.glassFill.opacity(0.44))
                        .overlay(
                            RoundedRectangle(cornerRadius: 28, style: .continuous)
                                .stroke(BenyuanColor.glassStroke.opacity(0.72), lineWidth: 1)
                        )

                    ForEach(0..<3, id: \.self) { index in
                        let orbitWidth = width * (0.46 + CGFloat(index) * 0.18)
                        let orbitHeight = height * (0.24 + CGFloat(index) * 0.11)
                        Ellipse()
                            .stroke(BenyuanColor.textPrimary.opacity(0.045 + Double(index) * 0.025), lineWidth: 1)
                            .frame(width: orbitWidth, height: orbitHeight)
                            .rotationEffect(.degrees(phase * (5 + Double(index) * 2) + moduleOffset + Double(index) * 18))
                            .position(center)
                    }

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
                        let radius = width * (0.10 + CGFloat(index) * 0.055)
                        Circle()
                            .fill(index == 0 ? BenyuanColor.accentGold.opacity(0.92) : BenyuanColor.textPrimary.opacity(0.25))
                            .frame(width: index == 0 ? 8 : 5, height: index == 0 ? 8 : 5)
                            .position(
                                x: center.x + cos(angle) * radius,
                                y: center.y + sin(angle) * radius * 0.42
                            )
                            .shadow(color: BenyuanColor.accentGold.opacity(index == 0 ? 0.44 : 0.14), radius: 10)
                    }

                    Text(module.title)
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                        .foregroundStyle(BenyuanColor.accentGold.opacity(0.82))
                        .position(x: width * 0.18, y: height * 0.24)
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
