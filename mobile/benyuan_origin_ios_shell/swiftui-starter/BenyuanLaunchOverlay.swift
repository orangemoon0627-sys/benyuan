import SwiftUI

struct BenyuanLaunchOverlay: View {
    let context: BenyuanShellRouteContext
    let baseURL: URL
    let showsDebug: Bool
    @State private var breathes = false

    var body: some View {
        ZStack {
            BenyuanShellBackdrop()

            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("BENYUAN")
                        .font(.system(size: 11, weight: .semibold, design: .default))
                        .tracking(3.4)
                        .foregroundStyle(BenyuanColor.textPrimary.opacity(0.74))

                    Spacer()

                    Text(context.stageLabel)
                        .font(.system(size: 11, weight: .semibold, design: .default))
                        .tracking(2.8)
                        .foregroundStyle(BenyuanColor.accentGold.opacity(0.92))
                        .textCase(.uppercase)
                }
                .padding(.top, BenyuanSpacing.x6)
                .padding(.horizontal, BenyuanSpacing.x6)

                Spacer(minLength: BenyuanSpacing.x8)

                VStack(alignment: .leading, spacing: BenyuanSpacing.x6) {
                    BenyuanBlackMoonMark(size: 172, breathes: breathes)
                        .frame(maxWidth: .infinity, alignment: .center)
                        .animation(.easeInOut(duration: 2.8).repeatForever(autoreverses: true), value: breathes)

                    Text("本源")
                        .font(.system(size: 82, weight: .black, design: .default))
                        .foregroundStyle(BenyuanColor.textPrimary)
                        .lineLimit(1)
                        .minimumScaleFactor(0.74)

                    Text(context.title)
                        .font(.system(size: BenyuanTypography.xl, weight: .black, design: .default))
                        .lineSpacing(0)
                        .multilineTextAlignment(.leading)
                        .foregroundStyle(BenyuanColor.textPrimary)

                    Text(context.detail)
                        .font(.system(size: BenyuanTypography.base, weight: .semibold, design: .default))
                        .lineSpacing(6)
                        .multilineTextAlignment(.leading)
                        .foregroundStyle(BenyuanColor.textSecondary)
                }
                .padding(.horizontal, BenyuanSpacing.x6)

                Spacer(minLength: BenyuanSpacing.x8)

                VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
                    GeometryReader { proxy in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(BenyuanColor.glassFill)
                            Capsule()
                                .fill(
                                    LinearGradient(
                                        colors: [BenyuanColor.accentGold.opacity(0.62), BenyuanColor.textPrimary.opacity(0.92)],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .frame(width: max(18, proxy.size.width * context.progressValue))
                        }
                    }
                    .frame(height: 3)

                    if showsDebug {
                        Text(baseURL.absoluteString)
                            .font(.system(size: 12, weight: .medium, design: .monospaced))
                            .foregroundStyle(BenyuanColor.accentGold.opacity(0.95))
                            .textSelection(.enabled)
                    }
                }
                .padding(.horizontal, BenyuanSpacing.x6)

                Text("GENERATIVE PSYCHE INTERFACE")
                    .font(.system(size: 10, weight: .semibold, design: .default))
                    .tracking(3.2)
                    .foregroundStyle(BenyuanColor.textTertiary.opacity(0.58))
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.top, BenyuanSpacing.x6)
                    .padding(.bottom, BenyuanSpacing.x6)
            }
        }
        .transition(.opacity.combined(with: .scale(scale: 0.985)))
        .onAppear {
            breathes = true
        }
    }
}
