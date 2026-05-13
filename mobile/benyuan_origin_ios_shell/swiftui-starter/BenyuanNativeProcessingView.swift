import SwiftUI

struct BenyuanNativeProcessingView: View {
    @ObservedObject var model: BenyuanNativeFlowModel
    private let processingCardCornerRadius: CGFloat = 42

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
                BenyuanFlowOrbitTrail(progress: model.processingProgress, intensity: 0.48, tilt: -8)
                    .padding(.horizontal, BenyuanSpacing.x2)
                    .opacity(0.88)

                VStack(spacing: 24) {
                    ZStack {
                        BenyuanProcessingPhaseCurrent(progress: model.processingProgress)
                            .frame(width: 248, height: 152)
                        BenyuanDeepCelestialBody(size: 196, progress: model.processingProgress, mode: .accretionBlackHole)
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
                        Text("可以切出 App，云端会继续分析；回来后会自动取回进度。")
                            .font(.system(size: 12, weight: .medium))
                            .lineSpacing(4)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(BenyuanColor.textTertiary)
                            .padding(.horizontal, BenyuanSpacing.x6)
                        if model.activeGenerationJobId != nil {
                            generationStatusBadge
                        }
                    }

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
    }

    private var processingPhaseLabel: String {
        switch model.processingProgress {
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
                    .frame(width: max(22, proxy.size.width * min(max(model.processingProgress, 0), 1)))
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
        model.processingProgress >= Double(index) * 0.28 + 0.08
    }
}
