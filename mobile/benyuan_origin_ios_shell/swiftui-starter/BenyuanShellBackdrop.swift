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

            BenyuanLivingDistantMoon(size: 330)
                .offset(x: moonAlignment == .topTrailing ? 152 : -152, y: -118)

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

struct BenyuanDeepCelestialBody: View {
    var size: CGFloat = 220
    var progress: Double = 0.42
    var mode: Mode = .processing

    enum Mode {
        case processing
        case constellation

        var tilt: Double {
            switch self {
            case .processing: return -16
            case .constellation: return -10
            }
        }

        var ringOpacity: Double {
            switch self {
            case .processing: return 0.52
            case .constellation: return 0.64
            }
        }
    }

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let phase = timeline.date.timeIntervalSinceReferenceDate
            let spin = phase.truncatingRemainder(dividingBy: 24) / 24
            let pulse = 0.5 + 0.5 * sin(phase * 0.72)
            let clampedProgress = min(max(progress, 0.04), 1)

            ZStack {
                BenyuanSpectralParticleField(size: size, phase: phase, progress: clampedProgress)

                BenyuanGravitationalLens(size: size, phase: phase, progress: clampedProgress, pulse: pulse)

                BenyuanOrbitalDustBand(size: size, phase: phase, progress: clampedProgress)
                BenyuanAccretionRing(size: size, phase: phase, progress: clampedProgress, mode: mode)
                    .rotationEffect(.degrees(mode.tilt + spin * 360))
                    .scaleEffect(x: 1.05 + pulse * 0.018, y: 0.94 + pulse * 0.012)

                BenyuanEventHorizon(size: size, phase: phase, progress: clampedProgress)

                Circle()
                    .stroke(BenyuanColor.accentGold.opacity(0.18 + clampedProgress * 0.18), lineWidth: 1)
                    .frame(width: size * (0.45 + clampedProgress * 0.14), height: size * (0.45 + clampedProgress * 0.14))
                    .blur(radius: 0.4)
                    .rotationEffect(.degrees(-spin * 220))

                Circle()
                    .fill(BenyuanColor.accentGold.opacity(0.86))
                    .frame(width: size * 0.052, height: size * 0.052)
                    .offset(x: cos(phase * 0.82) * size * 0.16, y: sin(phase * 0.82) * size * 0.08)
                    .shadow(color: BenyuanColor.accentGold.opacity(0.42), radius: 10)

                Circle()
                    .fill(BenyuanColor.textSecondary.opacity(0.28))
                    .frame(width: size * 0.12, height: size * 0.12)
                    .offset(x: cos(phase * 0.46 + 1.4) * size * 0.22, y: sin(phase * 0.46 + 1.4) * size * 0.12)
                    .blur(radius: 0.2)
            }
            .frame(width: size * 1.78, height: size * 1.42)
            .scaleEffect(0.985 + pulse * 0.025)
            .shadow(color: BenyuanColor.accentGold.opacity(0.12 + pulse * 0.05), radius: size * 0.18)
        }
        .frame(width: size * 1.78, height: size * 1.42)
        .accessibilityHidden(true)
    }
}

struct BenyuanLivingDistantMoon: View {
    var size: CGFloat

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 24.0)) { timeline in
            let phase = timeline.date.timeIntervalSinceReferenceDate
            let pulse = 0.5 + 0.5 * sin(phase * 0.18)

            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                BenyuanColor.planetEdge.opacity(0.38 + pulse * 0.05),
                                BenyuanColor.aubergineBlack.opacity(0.54),
                                BenyuanColor.bgVoid.opacity(0.96)
                            ],
                            center: UnitPoint(x: 0.34 + pulse * 0.03, y: 0.26),
                            startRadius: 10,
                            endRadius: size * 0.70
                        )
                    )

                Circle()
                    .fill(BenyuanColor.bgVoid.opacity(0.56))
                    .frame(width: size * 0.82, height: size * 0.82)
                    .blur(radius: size * 0.06)
                    .offset(x: -size * (0.10 + pulse * 0.02), y: size * 0.04)

                Circle()
                    .stroke(BenyuanColor.textPrimary.opacity(0.055 + pulse * 0.02), lineWidth: 1)

                Circle()
                    .stroke(BenyuanColor.accentGold.opacity(0.035), lineWidth: 1)
                    .scaleEffect(0.78 + pulse * 0.04)
                    .blur(radius: 0.6)
            }
            .frame(width: size, height: size)
            .scaleEffect(0.992 + pulse * 0.018)
            .shadow(color: BenyuanColor.accentGold.opacity(0.07 + pulse * 0.035), radius: 46, x: 0, y: 24)
        }
    }
}

struct BenyuanAccretionRing: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        ZStack {
            Ellipse()
                .stroke(BenyuanColor.accentGold.opacity(mode.ringOpacity * 0.36), lineWidth: 1.2)
                .frame(width: size * 1.76, height: size * 0.62)
                .blur(radius: 0.2)

            Ellipse()
                .trim(from: 0.02, to: 0.48 + progress * 0.22)
                .stroke(
                    LinearGradient(
                        colors: [
                            BenyuanColor.accentGold.opacity(0.06),
                            BenyuanColor.textPrimary.opacity(0.58),
                            BenyuanColor.accentGold.opacity(0.82),
                            BenyuanColor.textPrimary.opacity(0.10)
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    style: StrokeStyle(lineWidth: 2.2, lineCap: .round)
                )
                .frame(width: size * 1.86, height: size * 0.66)
                .rotationEffect(.degrees(phase * 7))

            Ellipse()
                .trim(from: 0.56, to: 0.96)
                .stroke(BenyuanColor.planetEdge.opacity(0.22), style: StrokeStyle(lineWidth: 1.4, lineCap: .round, dash: [4, 18]))
                .frame(width: size * 1.58, height: size * 0.54)
                .rotationEffect(.degrees(-phase * 5))
        }
    }
}

struct BenyuanEventHorizon: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    var body: some View {
        let spin = phase.truncatingRemainder(dividingBy: 24) / 24

        ZStack {
            Circle()
                .fill(
                    AngularGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.08),
                            BenyuanColor.planetEdge.opacity(0.28),
                            BenyuanColor.aubergineBlack.opacity(0.66),
                            BenyuanColor.bgVoid,
                            BenyuanColor.accentGold.opacity(0.16),
                            BenyuanColor.textPrimary.opacity(0.08)
                        ],
                        center: .center,
                        angle: .degrees(spin * 44)
                    )
                )
                .mask(
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    .clear,
                                    .black.opacity(0.22),
                                    .black.opacity(0.86),
                                    .black
                                ],
                                center: UnitPoint(x: 0.34, y: 0.26),
                                startRadius: size * 0.08,
                                endRadius: size * 0.54
                            )
                        )
                )
                .frame(width: size, height: size)
                .overlay(
                    Circle()
                        .stroke(BenyuanColor.textPrimary.opacity(0.075), lineWidth: 1)
                )
                .shadow(color: BenyuanColor.bgVoid.opacity(0.84), radius: size * 0.08, x: 0, y: size * 0.04)

            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.bgVoid,
                            BenyuanColor.bgVoid.opacity(0.96),
                            BenyuanColor.lunarBlueDeep.opacity(0.74),
                            .clear
                        ],
                        center: UnitPoint(x: 0.46, y: 0.48),
                        startRadius: 2,
                        endRadius: size * 0.32
                    )
                )
                .frame(width: size * 0.62, height: size * 0.62)
                .shadow(color: BenyuanColor.bgVoid.opacity(0.96), radius: size * 0.08)

            Circle()
                .stroke(
                    LinearGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.03),
                            BenyuanColor.accentGold.opacity(0.22 + progress * 0.08),
                            BenyuanColor.textPrimary.opacity(0.035)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
                .frame(width: size * 0.70, height: size * 0.70)
                .blur(radius: 0.7)
                .rotationEffect(.degrees(-spin * 240))
                .blendMode(BlendMode.screen)
        }
    }
}

struct BenyuanGravitationalLens: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            Circle()
                .fill(BenyuanColor.planetEdge.opacity(0.11 + pulse * 0.05))
                .frame(width: size * 1.48, height: size * 1.48)
                .blur(radius: size * 0.18)

            Circle()
                .stroke(BenyuanColor.textPrimary.opacity(0.045 + progress * 0.035), lineWidth: 1)
                .frame(width: size * (1.10 + pulse * 0.06), height: size * (1.10 + pulse * 0.06))
                .blur(radius: 1.2)
                .blendMode(BlendMode.screen)

            Ellipse()
                .stroke(
                    LinearGradient(
                        colors: [
                            .clear,
                            BenyuanColor.textPrimary.opacity(0.16),
                            BenyuanColor.accentGold.opacity(0.10),
                            .clear
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    style: StrokeStyle(lineWidth: 1.4, lineCap: .round)
                )
                .frame(width: size * 1.60, height: size * 0.42)
                .rotationEffect(.degrees(-18 + sin(phase * 0.24) * 4))
                .blur(radius: 0.6)
                .blendMode(BlendMode.screen)
        }
    }
}

struct BenyuanOrbitalDustBand: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    var body: some View {
        ZStack {
            ForEach(0..<5, id: \.self) { index in
                let drift = phase * (3.2 + Double(index) * 0.7)
                Ellipse()
                    .trim(from: 0.10 + CGFloat(index) * 0.015, to: 0.44 + CGFloat(progress) * 0.18)
                    .stroke(
                        BenyuanColor.textPrimary.opacity(0.030 + Double(index) * 0.012),
                        style: StrokeStyle(lineWidth: index == 0 ? 1.3 : 0.9, lineCap: .round, dash: index.isMultiple(of: 2) ? [3, 18] : [10, 24])
                    )
                    .frame(width: size * (1.18 + CGFloat(index) * 0.16), height: size * (0.40 + CGFloat(index) * 0.055))
                    .rotationEffect(.degrees(-24 + drift))
                    .offset(y: CGFloat(index - 2) * size * 0.012)
                    .blur(radius: index > 2 ? 0.8 : 0.25)
            }
        }
        .blendMode(BlendMode.screen)
    }
}

struct BenyuanSpectralParticleField: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    private let points: [(CGFloat, CGFloat, CGFloat)] = [
        (-0.62, -0.14, 0.62), (-0.48, 0.22, 0.34), (-0.32, -0.36, 0.46),
        (-0.12, 0.34, 0.72), (0.08, -0.42, 0.38), (0.26, 0.24, 0.54),
        (0.42, -0.18, 0.66), (0.58, 0.10, 0.30), (0.68, -0.34, 0.48)
    ]

    var body: some View {
        ZStack {
            ForEach(points.indices, id: \.self) { index in
                let point = points[index]
                let drift = sin(phase * (0.18 + Double(point.2) * 0.2) + Double(index))
                Circle()
                    .fill(index.isMultiple(of: 3) ? BenyuanColor.accentGold.opacity(0.34) : BenyuanColor.textPrimary.opacity(0.16))
                    .frame(width: size * (0.011 + point.2 * 0.008), height: size * (0.011 + point.2 * 0.008))
                    .offset(x: size * point.0 + drift * size * 0.018, y: size * point.1 - drift * size * 0.014)
                    .opacity(0.18 + progress * 0.34)
                    .blur(radius: point.2 > 0.6 ? 0.2 : 0.8)
            }
        }
        .frame(width: size * 1.72, height: size * 1.18)
    }
}
