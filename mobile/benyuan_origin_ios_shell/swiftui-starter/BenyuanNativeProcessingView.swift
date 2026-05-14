import SwiftUI

struct BenyuanNativeProcessingView: View {
    @ObservedObject var model: BenyuanNativeFlowModel
    @State private var displayedProgress = 0.12
    private let processingCardCornerRadius: CGFloat = 42
    private let generationPhases: [GenerationPhase] = [
        GenerationPhase(threshold: 0.18, title: "接收线索", detail: "答案 / 图片"),
        GenerationPhase(threshold: 0.42, title: "多模态读取", detail: "影像情绪"),
        GenerationPhase(threshold: 0.68, title: "剧场折射", detail: "连续剧情"),
        GenerationPhase(threshold: 0.88, title: "星图显影", detail: "精神报告")
    ]

    var body: some View {
        VStack(spacing: BenyuanSpacing.x6) {
            Spacer(minLength: BenyuanSpacing.x12)

            ZStack {
                RoundedRectangle(cornerRadius: processingCardCornerRadius, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                BenyuanColor.glassFillStrong.opacity(0.82),
                                BenyuanColor.bgVoid.opacity(0.36),
                                BenyuanColor.glassFill.opacity(0.42)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: processingCardCornerRadius, style: .continuous)
                            .stroke(BenyuanColor.glassStroke.opacity(0.84), lineWidth: 1)
                    )
                    .shadow(color: BenyuanColor.bgVoid.opacity(0.64), radius: 40, y: 28)
                BenyuanFlowOrbitTrail(progress: displayedProgress, intensity: 0.48, tilt: -8)
                    .padding(.horizontal, BenyuanSpacing.x2)
                    .opacity(0.88)

                VStack(spacing: 24) {
                    ZStack {
                        BenyuanProcessingPhaseCurrent(progress: displayedProgress)
                            .frame(width: 248, height: 152)
                        BenyuanDeepCelestialBody(size: 196, progress: displayedProgress, mode: .accretionBlackHole)
                    }
                    .padding(.top, BenyuanSpacing.x2)

                    VStack(spacing: BenyuanSpacing.x3) {
                        Text(processingPhaseLabel)
                            .font(.system(size: 12, weight: .black, design: .monospaced))
                            .foregroundStyle(BenyuanColor.accentGold.opacity(0.9))
                        Text(processingPercentText)
                            .font(.system(size: 46, weight: .semibold, design: .rounded))
                            .foregroundStyle(BenyuanColor.textPrimary)
                            .contentTransition(.numericText())
                        Text(model.processingTitle)
                            .font(.system(size: 34, weight: .semibold))
                            .minimumScaleFactor(0.72)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(BenyuanColor.textPrimary)
                        Text(model.processingDetail)
                            .font(.system(size: 15, weight: .regular))
                            .lineSpacing(6)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(BenyuanColor.textSecondary)
                            .padding(.horizontal, BenyuanSpacing.x4)
                            .lineLimit(3)
                            .fixedSize(horizontal: false, vertical: true)
                        Text("可以切出 App，云端会继续分析；回来后会自动取回进度。")
                            .font(.system(size: 12, weight: .medium))
                            .lineSpacing(4)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(BenyuanColor.textTertiary)
                            .padding(.horizontal, BenyuanSpacing.x6)
                            .lineLimit(2)
                            .fixedSize(horizontal: false, vertical: true)
                        if model.activeGenerationJobId != nil {
                            generationStatusBadge
                        }
                    }

                    generationPhaseRail
                        .padding(.horizontal, BenyuanSpacing.x6)

                    VStack(spacing: BenyuanSpacing.x4) {
                        progressTrack
                            .frame(height: 4)
                        phaseDots
                    }
                    .padding(.horizontal, BenyuanSpacing.x6)
                    .padding(.bottom, BenyuanSpacing.x4)
                }
            }
            .padding(.horizontal, BenyuanSpacing.x4)

            Spacer(minLength: BenyuanSpacing.x12)
        }
        .onAppear {
            displayedProgress = model.processingProgress
        }
        .onChange(of: model.processingProgress) { _, newValue in
            withAnimation(.easeInOut(duration: 0.82)) {
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
        "\(Int(round(model.processingProgress * 100)))%"
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

    private var generationStatusBadge: some View {
        HStack(spacing: 7) {
            Circle()
                .fill(BenyuanColor.accentGold.opacity(0.88))
                .frame(width: 5, height: 5)
                .shadow(color: BenyuanColor.accentGold.opacity(0.42), radius: 8)
            Text("云端生成已接管")
                .font(.system(size: 11, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold.opacity(0.82))
                .lineLimit(1)
        }
        .padding(.horizontal, BenyuanSpacing.x4)
        .padding(.vertical, 7)
        .background(
            Capsule()
                .fill(BenyuanColor.bgVoid.opacity(0.42))
                .overlay(Capsule().stroke(BenyuanColor.glassStroke.opacity(0.72), lineWidth: 1))
        )
    }

    private var generationPhaseRail: some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x2) {
            HStack(alignment: .center, spacing: BenyuanSpacing.x2) {
                Text("云端阶段")
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .foregroundStyle(BenyuanColor.textTertiary)
                Spacer(minLength: BenyuanSpacing.x2)
                Text(processingPhaseHint)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BenyuanColor.accentGold.opacity(0.82))
                    .lineLimit(1)
                    .minimumScaleFactor(0.76)
            }

            HStack(spacing: BenyuanSpacing.x2) {
                ForEach(generationPhases) { phase in
                    generationPhaseCell(phase)
                }
            }
        }
        .padding(.horizontal, BenyuanSpacing.x3)
        .padding(.vertical, 11)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(BenyuanColor.bgVoid.opacity(0.34))
                .overlay(RoundedRectangle(cornerRadius: 24).stroke(BenyuanColor.glassStroke.opacity(0.66), lineWidth: 1))
        )
    }

    private func generationPhaseCell(_ phase: GenerationPhase) -> some View {
        let state = phaseState(phase)
        return VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Circle()
                    .fill(state.fill)
                    .frame(width: state.dotSize, height: state.dotSize)
                    .shadow(color: state.glow, radius: state.isActive ? 7 : 0)
                Spacer(minLength: 0)
            }

            Text(phase.title)
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(state.titleColor)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
            Text(phase.detail)
                .font(.system(size: 9, weight: .medium))
                .foregroundStyle(BenyuanColor.textTertiary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 9)
        .padding(.vertical, 9)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(state.background)
                .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(state.stroke, lineWidth: 1))
        )
        .animation(.easeOut(duration: 0.28), value: displayedProgress)
    }

    private var processingPhaseHint: String {
        if displayedProgress < 0.42 { return "可以离开，任务会继续" }
        if displayedProgress < 0.68 { return "正在把影像变成叙事种子" }
        if displayedProgress < 0.88 { return "剧场与星图正在接上" }
        return "接近完成，等待最后回收"
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
                titleColor: BenyuanColor.accentGold,
                background: BenyuanColor.accentGold.opacity(0.08),
                stroke: BenyuanColor.accentGold.opacity(0.22)
            )
        }
        if isActive {
            return GenerationPhaseState(
                isActive: true,
                fill: BenyuanColor.textPrimary.opacity(0.88),
                dotSize: 8,
                glow: BenyuanColor.textPrimary.opacity(0.22),
                titleColor: BenyuanColor.textPrimary,
                background: BenyuanColor.glassFillStrong.opacity(0.36),
                stroke: BenyuanColor.textPrimary.opacity(0.16)
            )
        }
        return GenerationPhaseState(
            isActive: false,
            fill: BenyuanColor.textPrimary.opacity(0.18),
            dotSize: 6,
            glow: .clear,
            titleColor: BenyuanColor.textSecondary,
            background: BenyuanColor.glassFill.opacity(0.18),
            stroke: BenyuanColor.glassStroke.opacity(0.48)
        )
    }

    private var phaseDots: some View {
        HStack {
            ForEach(0..<4, id: \.self) { index in
                Circle()
                    .fill(dotIsActive(index) ? BenyuanColor.accentGold : BenyuanColor.textPrimary.opacity(0.15))
                    .frame(width: dotIsActive(index) ? 9 : 7, height: dotIsActive(index) ? 9 : 7)
                    .shadow(color: dotIsActive(index) ? BenyuanColor.accentGold.opacity(0.42) : .clear, radius: 8)
                if index < 3 {
                    Spacer()
                }
            }
        }
    }

    private func dotIsActive(_ index: Int) -> Bool {
        displayedProgress >= Double(index) * 0.28 + 0.08
    }
}

private struct GenerationPhase: Identifiable {
    let id = UUID()
    let threshold: Double
    let title: String
    let detail: String
}

private struct GenerationPhaseState {
    let isActive: Bool
    let fill: Color
    let dotSize: CGFloat
    let glow: Color
    let titleColor: Color
    let background: Color
    let stroke: Color
}
