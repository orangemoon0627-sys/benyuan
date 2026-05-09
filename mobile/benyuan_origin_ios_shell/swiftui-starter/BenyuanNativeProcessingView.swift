import SwiftUI

struct BenyuanNativeProcessingView: View {
    @ObservedObject var model: BenyuanNativeFlowModel

    var body: some View {
        VStack(spacing: BenyuanSpacing.x6) {
            Spacer(minLength: BenyuanSpacing.x12)

            ZStack {
                RoundedRectangle(cornerRadius: 48, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                BenyuanColor.glassFillStrong,
                                BenyuanColor.bgVoid.opacity(0.18),
                                BenyuanColor.glassFill.opacity(0.54)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 48, style: .continuous)
                            .stroke(BenyuanColor.glassStroke.opacity(0.92), lineWidth: 1)
                    )
                    .shadow(color: BenyuanColor.bgVoid.opacity(0.64), radius: 40, y: 28)

                VStack(spacing: 28) {
                    ZStack {
                        BenyuanProcessingPhaseCurrent(progress: model.processingProgress)
                            .frame(width: 270, height: 170)
                        BenyuanDeepCelestialBody(size: 214, progress: model.processingProgress, mode: .processing)
                    }
                    .padding(.top, BenyuanSpacing.x2)

                    VStack(spacing: BenyuanSpacing.x3) {
                        Text(processingPhaseLabel)
                            .font(.system(size: 12, weight: .black, design: .monospaced))
                            .foregroundStyle(BenyuanColor.accentGold.opacity(0.9))
                        Text(model.processingTitle)
                            .font(.system(size: 42, weight: .black))
                            .minimumScaleFactor(0.72)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(BenyuanColor.textPrimary)
                        Text(model.processingDetail)
                            .font(.system(size: 16, weight: .semibold))
                            .lineSpacing(6)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(BenyuanColor.textSecondary)
                            .padding(.horizontal, BenyuanSpacing.x6)
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

    private var progressTrack: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(BenyuanColor.textPrimary.opacity(0.08))
                Capsule()
                    .fill(LinearGradient(colors: [BenyuanColor.accentGold.opacity(0.75), BenyuanColor.textPrimary.opacity(0.88)], startPoint: .leading, endPoint: .trailing))
                    .frame(width: max(22, proxy.size.width * model.processingProgress))
            }
        }
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
