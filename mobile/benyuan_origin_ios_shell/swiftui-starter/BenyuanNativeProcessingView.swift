import SwiftUI

struct BenyuanNativeProcessingView: View {
    @ObservedObject var model: BenyuanNativeFlowModel
    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion
    @State private var displayedProgress = 0.12
    private let generationPhases: [GenerationPhase] = [
        GenerationPhase(threshold: 0.18, title: "接收线索"),
        GenerationPhase(threshold: 0.42, title: "多模态读取"),
        GenerationPhase(threshold: 0.68, title: "剧场折射"),
        GenerationPhase(threshold: 0.88, title: "星图显影")
    ]

    var body: some View {
        GeometryReader { geometry in
            let artworkSize = min(224, max(196, geometry.size.width * 0.56))

            ZStack {
                BenyuanCinematicSpaceField(
                    progress: displayedProgress,
                    intensity: 0.72,
                    velocity: 0.34 + displayedProgress * 1.30,
                    focalPoint: UnitPoint(x: 0.52, y: 0.36),
                    preferredFramesPerSecond: 30
                )
                .ignoresSafeArea()

                LinearGradient(
                    colors: [
                        BenyuanColor.bgVoid.opacity(0.14),
                        .clear,
                        BenyuanColor.bgVoid.opacity(0.32),
                        BenyuanColor.bgVoid.opacity(0.92)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                VStack(spacing: 0) {
                    Spacer(minLength: max(28, geometry.safeAreaInsets.top + 8))

                    ZStack {
                        Circle()
                            .fill(
                                RadialGradient(
                                    colors: [
                                        BenyuanColor.textPrimary.opacity(0.10),
                                        BenyuanColor.accentGold.opacity(0.055),
                                        .clear
                                    ],
                                    center: .center,
                                    startRadius: 4,
                                    endRadius: artworkSize * 0.72
                                )
                            )
                            .frame(width: artworkSize * 1.44, height: artworkSize * 1.44)
                            .blur(radius: 18)
                            .blendMode(.screen)

                        processingArtwork(size: artworkSize)
                            .scaleEffect(0.96 + CGFloat(displayedProgress) * 0.08)
                    }
                    .frame(height: min(310, geometry.size.height * 0.36))

                    VStack(spacing: BenyuanSpacing.x2) {
                        Text(processingPhaseLabel)
                            .font(.system(size: 11, weight: .black, design: .monospaced))
                            .foregroundStyle(BenyuanColor.accentGold.opacity(0.88))
                        Text(processingPercentText)
                            .font(.system(size: 54, weight: .semibold, design: .rounded))
                            .foregroundStyle(BenyuanColor.textPrimary)
                            .contentTransition(accessibilityReduceMotion ? .identity : .numericText())
                        Text(model.processingTitle)
                            .font(.system(size: 28, weight: .semibold))
                            .minimumScaleFactor(0.72)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(BenyuanColor.textPrimary)
                            .lineLimit(2)
                            .frame(height: 72, alignment: .center)
                    }
                    .padding(.horizontal, BenyuanSpacing.x6)

                    Spacer(minLength: BenyuanSpacing.x3)

                    generationPhaseRail
                        .padding(.horizontal, BenyuanSpacing.x6)

                    progressTrack
                        .frame(height: 3)
                        .padding(.top, BenyuanSpacing.x4)
                        .padding(.horizontal, BenyuanSpacing.x6)

                    Spacer(minLength: max(30, geometry.safeAreaInsets.bottom + 18))
                }
                .frame(width: geometry.size.width, height: geometry.size.height)
                .accessibilityElement(children: .combine)
                .accessibilityLabel("\(model.processingTitle)，\(processingPercentText)")
            }
        }
        .onAppear {
            displayedProgress = model.processingProgress
        }
        .onChange(of: model.processingProgress) { _, newValue in
            withAnimation(accessibilityReduceMotion ? nil : .easeInOut(duration: 0.82)) {
                displayedProgress = min(max(newValue, displayedProgress), 1)
            }
        }
    }

    private var processingPhaseLabel: String {
        switch displayedProgress {
        case ..<0.28: return "校准中"
        case ..<0.58: return "显影中"
        case ..<0.84: return "折射中"
        default: return "收束中"
        }
    }

    private var processingPercentText: String {
        "\(Int(round(displayedProgress * 100)))%"
    }

    private func processingArtwork(size: CGFloat) -> some View {
        BenyuanDeepCelestialBody(size: size, progress: displayedProgress, mode: .accretionBlackHole)
        .accessibilityHidden(true)
    }

    private var progressTrack: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(BenyuanColor.textPrimary.opacity(0.08))
                Capsule()
                    .fill(LinearGradient(colors: [BenyuanColor.accentGold.opacity(0.75), BenyuanColor.textPrimary.opacity(0.88)], startPoint: .leading, endPoint: .trailing))
                    .frame(width: max(22, proxy.size.width * min(max(displayedProgress, 0), 1)))
            }
        }
    }

    private var generationPhaseRail: some View {
        HStack(alignment: .top, spacing: BenyuanSpacing.x2) {
            ForEach(generationPhases) { phase in
                generationPhaseCell(phase)
            }
        }
    }

    private func generationPhaseCell(_ phase: GenerationPhase) -> some View {
        let state = phaseState(phase)
        return VStack(spacing: 8) {
            Circle()
                .fill(state.fill)
                .frame(width: 8, height: 8)
                .scaleEffect(state.dotSize / 8)
                .shadow(color: state.glow, radius: state.isActive ? 7 : 0)
            Text(phase.title)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(state.titleColor)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .frame(maxWidth: .infinity)
        .animation(accessibilityReduceMotion ? nil : .easeOut(duration: 0.28), value: displayedProgress)
    }

    private func phaseState(_ phase: GenerationPhase) -> GenerationPhaseState {
        let activeWindowStart = phase.threshold - 0.22
        let isDone = displayedProgress >= phase.threshold
        let isActive = !isDone && displayedProgress >= activeWindowStart
        if isDone {
            return GenerationPhaseState(
                isActive: false,
                fill: BenyuanColor.accentGold,
                dotSize: 7,
                glow: BenyuanColor.accentGold.opacity(0.32),
                titleColor: BenyuanColor.accentGold
            )
        }
        if isActive {
            return GenerationPhaseState(
                isActive: true,
                fill: BenyuanColor.textPrimary.opacity(0.88),
                dotSize: 8,
                glow: BenyuanColor.textPrimary.opacity(0.22),
                titleColor: BenyuanColor.textPrimary
            )
        }
        return GenerationPhaseState(
            isActive: false,
            fill: BenyuanColor.textPrimary.opacity(0.18),
            dotSize: 6,
            glow: .clear,
            titleColor: BenyuanColor.textTertiary
        )
    }
}

private struct GenerationPhase: Identifiable {
    let threshold: Double
    let title: String

    var id: String { title }
}

private struct GenerationPhaseState {
    let isActive: Bool
    let fill: Color
    let dotSize: CGFloat
    let glow: Color
    let titleColor: Color
}
