import SwiftUI

struct BenyuanShellBackdrop: View {
    var showsGhostTitle = true
    var moonAlignment: Alignment = .topTrailing

    var body: some View {
        ZStack(alignment: moonAlignment) {
            BenyuanColor.bgVoid.ignoresSafeArea()

            LinearGradient(
                colors: [
                    BenyuanColor.bgVoid,
                    BenyuanColor.aubergineBlack,
                    BenyuanColor.bgVoid
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            RadialGradient(
                colors: [
                    BenyuanColor.planetEdge.opacity(0.38),
                    BenyuanColor.nebulaViolet.opacity(0.14),
                    BenyuanColor.bgVoid.opacity(0.0)
                ],
                center: UnitPoint(x: 0.78, y: 0.12),
                startRadius: 8,
                endRadius: 520
            )
            .ignoresSafeArea()

            RadialGradient(
                colors: [
                    BenyuanColor.accentGold.opacity(0.12),
                    BenyuanColor.bgVoid.opacity(0.0)
                ],
                center: UnitPoint(x: 0.08, y: 0.78),
                startRadius: 18,
                endRadius: 360
            )
            .ignoresSafeArea()

            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.planetEdge.opacity(0.42),
                            BenyuanColor.aubergineBlack.opacity(0.54),
                            BenyuanColor.bgVoid.opacity(0.96)
                        ],
                        center: UnitPoint(x: 0.36, y: 0.28),
                        startRadius: 12,
                        endRadius: 230
                    )
                )
                .overlay(
                    Circle()
                        .stroke(BenyuanColor.textPrimary.opacity(0.08), lineWidth: 1)
                )
                .frame(width: 330, height: 330)
                .offset(x: moonAlignment == .topTrailing ? 152 : -152, y: -118)
                .shadow(color: BenyuanColor.accentGold.opacity(0.08), radius: 44, x: 0, y: 24)

            if showsGhostTitle {
                Text("本源")
                    .font(.system(size: 172, weight: .black, design: .default))
                    .foregroundStyle(BenyuanColor.textPrimary.opacity(0.045))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                    .padding(.top, 118)
                    .padding(.trailing, -18)
            }
        }
    }
}

struct BenyuanBlackMoonMark: View {
    var size: CGFloat = 156
    var breathes = false

    var body: some View {
        ZStack {
            Ellipse()
                .stroke(BenyuanColor.accentGold.opacity(0.30), lineWidth: 1)
                .frame(width: size * 1.55, height: size * 0.54)
                .rotationEffect(.degrees(-14))
                .offset(y: size * 0.11)

            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.planetEdge.opacity(0.34),
                            BenyuanColor.aubergineBlack.opacity(0.52),
                            BenyuanColor.bgVoid
                        ],
                        center: UnitPoint(x: 0.34, y: 0.24),
                        startRadius: 3,
                        endRadius: size * 0.62
                    )
                )
                .overlay(
                    Circle()
                        .stroke(BenyuanColor.textPrimary.opacity(0.08), lineWidth: 1)
                )
                .frame(width: size, height: size)
                .scaleEffect(breathes ? 1.025 : 0.985)

            Circle()
                .fill(BenyuanColor.bgVoid.opacity(0.78))
                .blur(radius: 7)
                .frame(width: size * 0.56, height: size * 0.56)
                .offset(x: -size * 0.08, y: size * 0.07)
                .scaleEffect(breathes ? 0.96 : 1.03)

            Circle()
                .fill(BenyuanColor.accentGold.opacity(0.92))
                .frame(width: size * 0.052, height: size * 0.052)
                .offset(x: -size * 0.12, y: size * 0.05)

            Circle()
                .fill(BenyuanColor.textSecondary.opacity(0.24))
                .frame(width: size * 0.12, height: size * 0.12)
                .offset(x: size * 0.12, y: size * 0.14)
        }
        .shadow(color: BenyuanColor.accentGold.opacity(0.18), radius: 28)
    }
}
