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
        case accretionBlackHole
        case theaterNebula
        case constellationMoon

        static let processing: Mode = .accretionBlackHole
        static let constellation: Mode = .constellationMoon

        var tilt: Double {
            switch self {
            case .accretionBlackHole: return -16
            case .theaterNebula: return 18
            case .constellationMoon: return -10
            }
        }

        var ringOpacity: Double {
            switch self {
            case .accretionBlackHole: return 0.58
            case .theaterNebula: return 0.24
            case .constellationMoon: return 0.64
            }
        }
    }

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 30) { phase in
            let spin = phase.truncatingRemainder(dividingBy: 24) / 24
            let pulse = 0.5 + 0.5 * sin(phase * 0.72)
            let clampedProgress = min(max(progress, 0.04), 1)

            ZStack {
                BenyuanSpectralParticleField(size: size, phase: phase, progress: clampedProgress)

                if mode == .theaterNebula {
                    BenyuanNebulaVeil(size: size, phase: phase, progress: clampedProgress)
                    BenyuanNebulaCore(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                }

                if mode == .accretionBlackHole {
                    BenyuanGravitationalLens(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                    BenyuanOrbitalDustBand(size: size, phase: phase, progress: clampedProgress)
                    BenyuanAccretionRing(size: size, phase: phase, progress: clampedProgress, mode: mode)
                        .rotationEffect(.degrees(mode.tilt + spin * 360))
                        .scaleEffect(x: 1.05 + pulse * 0.018, y: 0.94 + pulse * 0.012)
                    BenyuanEventHorizon(size: size, phase: phase, progress: clampedProgress)
                }

                if mode == .constellationMoon {
                    BenyuanGravitationalLens(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                    BenyuanLunarCore(size: size, phase: phase, progress: clampedProgress)
                }

                if mode == .theaterNebula {
                    BenyuanOrbitalDustBand(size: size, phase: phase, progress: clampedProgress)
                    BenyuanAccretionRing(size: size, phase: phase, progress: clampedProgress, mode: mode)
                        .rotationEffect(.degrees(mode.tilt + spin * 120))
                        .scaleEffect(x: 0.96 + pulse * 0.014, y: 0.90 + pulse * 0.016)
                        .opacity(0.54)
                }

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
        BenyuanMotionTimeline(preferredFramesPerSecond: 24) { phase in
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
                .stroke(
                    AngularGradient(
                        colors: [
                            BenyuanColor.accentGold.opacity(0.18),
                            BenyuanColor.textPrimary.opacity(0.58),
                            BenyuanColor.accentGold.opacity(0.82),
                            BenyuanColor.textPrimary.opacity(0.18),
                            BenyuanColor.accentGold.opacity(0.18)
                        ],
                        center: .center,
                        angle: .degrees(phase * 7)
                    ),
                    style: StrokeStyle(lineWidth: 2.2, lineCap: .round)
                )
                .frame(width: size * 1.86, height: size * 0.66)
                .rotationEffect(.degrees(phase * 7))

            Ellipse()
                .stroke(BenyuanColor.planetEdge.opacity(0.20), style: StrokeStyle(lineWidth: 1.1, lineCap: .round, dash: [2, 14]))
                .frame(width: size * 1.58, height: size * 0.54)
                .rotationEffect(.degrees(-phase * 5))

            ForEach(0..<9, id: \.self) { index in
                let angle = phase * (0.34 + Double(index) * 0.025) + Double(index) * .pi * 2 / 9
                let orbitX = cos(angle) * size * 0.88
                let orbitY = sin(angle) * size * 0.30
                Circle()
                    .fill(index.isMultiple(of: 3) ? BenyuanColor.accentGold.opacity(0.70) : BenyuanColor.textPrimary.opacity(0.24))
                    .frame(width: index.isMultiple(of: 3) ? 3.6 : 2.2, height: index.isMultiple(of: 3) ? 3.6 : 2.2)
                    .offset(x: orbitX, y: orbitY)
                    .blur(radius: index.isMultiple(of: 3) ? 0.2 : 0.6)
            }
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

            Ellipse()
                .stroke(BenyuanColor.accentGold.opacity(0.055), style: StrokeStyle(lineWidth: 0.8, lineCap: .round, dash: [2, 13]))
                .frame(width: size * 1.74, height: size * 0.48)
                .rotationEffect(.degrees(8 - sin(phase * 0.20) * 3))
                .blendMode(BlendMode.screen)
        }
    }
}

struct BenyuanNebulaVeil: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    var body: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { index in
                let drift = sin(phase * (0.16 + Double(index) * 0.035) + Double(index))
                Ellipse()
                    .fill(
                        RadialGradient(
                            colors: [
                                BenyuanColor.nebulaViolet.opacity(0.18 + progress * 0.08),
                                BenyuanColor.planetEdge.opacity(0.08),
                                .clear
                            ],
                            center: UnitPoint(x: 0.42 + drift * 0.05, y: 0.48),
                            startRadius: 2,
                            endRadius: size * (0.44 + CGFloat(index) * 0.08)
                        )
                    )
                    .frame(width: size * (1.28 + CGFloat(index) * 0.26), height: size * (0.46 + CGFloat(index) * 0.12))
                    .rotationEffect(.degrees(phase * (1.4 + Double(index) * 0.6) + Double(index) * 32))
                    .blur(radius: 8 + CGFloat(index) * 2)
                    .blendMode(.screen)
            }

            ForEach(0..<14, id: \.self) { index in
                let angle = phase * (0.12 + Double(index) * 0.011) + Double(index) * .pi * 2 / 14
                let radius = size * (0.20 + CGFloat(index % 5) * 0.055)
                Circle()
                    .fill(index.isMultiple(of: 4) ? BenyuanColor.accentGold.opacity(0.34) : BenyuanColor.textPrimary.opacity(0.13))
                    .frame(width: index.isMultiple(of: 4) ? 3.2 : 2, height: index.isMultiple(of: 4) ? 3.2 : 2)
                    .offset(x: cos(angle) * radius, y: sin(angle) * radius * 0.52)
                    .blur(radius: index.isMultiple(of: 4) ? 0.2 : 0.8)
            }
        }
        .frame(width: size * 1.84, height: size * 1.18)
    }
}

struct BenyuanNebulaCore: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        let spin = phase.truncatingRemainder(dividingBy: 40) / 40
        let clamped = min(max(progress, 0.04), 1)

        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.16 + pulse * 0.04),
                            BenyuanColor.nebulaViolet.opacity(0.34 + clamped * 0.08),
                            BenyuanColor.planetEdge.opacity(0.18),
                            BenyuanColor.bgVoid.opacity(0.10),
                            .clear
                        ],
                        center: UnitPoint(x: 0.44 + pulse * 0.04, y: 0.42),
                        startRadius: 2,
                        endRadius: size * 0.54
                    )
                )
                .frame(width: size * 0.86, height: size * 0.86)
                .blur(radius: 4)
                .blendMode(.screen)

            Circle()
                .fill(
                    AngularGradient(
                        colors: [
                            BenyuanColor.bgVoid.opacity(0.10),
                            BenyuanColor.nebulaViolet.opacity(0.38),
                            BenyuanColor.textPrimary.opacity(0.17),
                            BenyuanColor.accentGold.opacity(0.11),
                            BenyuanColor.bgVoid.opacity(0.10)
                        ],
                        center: .center,
                        angle: .degrees(spin * 360)
                    )
                )
                .mask(
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    .black,
                                    .black.opacity(0.72),
                                    .black.opacity(0.22),
                                    .clear
                                ],
                                center: UnitPoint(x: 0.48, y: 0.48),
                                startRadius: size * 0.02,
                                endRadius: size * 0.48
                            )
                        )
                )
                .frame(width: size * 0.74, height: size * 0.74)
                .rotationEffect(.degrees(phase * 2.4))
                .blur(radius: 1.2)
                .blendMode(.screen)

            ForEach(0..<3, id: \.self) { index in
                Ellipse()
                    .stroke(
                        AngularGradient(
                            colors: [
                                BenyuanColor.nebulaViolet.opacity(0.02),
                                BenyuanColor.textPrimary.opacity(0.12 + Double(index) * 0.025),
                                BenyuanColor.accentGold.opacity(0.06 + clamped * 0.05),
                                BenyuanColor.nebulaViolet.opacity(0.02)
                            ],
                            center: .center,
                            angle: .degrees(phase * (2.0 + Double(index) * 0.5))
                        ),
                        style: StrokeStyle(lineWidth: index == 0 ? 1.2 : 0.8, lineCap: .round)
                    )
                    .frame(width: size * (1.18 + CGFloat(index) * 0.18), height: size * (0.54 + CGFloat(index) * 0.08))
                    .rotationEffect(.degrees(20 + phase * (1.2 + Double(index) * 0.3) + Double(index) * 20))
                    .blur(radius: CGFloat(index) * 0.5)
                    .blendMode(.screen)
            }

            ForEach(0..<10, id: \.self) { index in
                let angle = phase * (0.18 + Double(index) * 0.012) + Double(index) * .pi * 2 / 10
                let radiusX = size * (0.18 + CGFloat(index % 4) * 0.045)
                let radiusY = size * (0.12 + CGFloat(index % 3) * 0.034)
                Circle()
                    .fill(index.isMultiple(of: 4) ? BenyuanColor.accentGold.opacity(0.44) : BenyuanColor.textPrimary.opacity(0.17))
                    .frame(width: index.isMultiple(of: 4) ? 3.4 : 2.1, height: index.isMultiple(of: 4) ? 3.4 : 2.1)
                    .offset(x: cos(angle) * radiusX, y: sin(angle) * radiusY)
                    .blur(radius: index.isMultiple(of: 4) ? 0.2 : 0.7)
            }
        }
        .shadow(color: BenyuanColor.nebulaViolet.opacity(0.20 + pulse * 0.06), radius: size * 0.20)
    }
}

struct BenyuanLunarCore: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    var body: some View {
        let pulse = 0.5 + 0.5 * sin(phase * 0.44)

        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.28),
                            BenyuanColor.planetEdge.opacity(0.32),
                            BenyuanColor.aubergineBlack.opacity(0.70),
                            BenyuanColor.bgVoid
                        ],
                        center: UnitPoint(x: 0.36 + pulse * 0.03, y: 0.24),
                        startRadius: 2,
                        endRadius: size * 0.62
                    )
                )
                .frame(width: size * 0.92, height: size * 0.92)
                .overlay(Circle().stroke(BenyuanColor.textPrimary.opacity(0.08 + progress * 0.04), lineWidth: 1))

            Circle()
                .fill(BenyuanColor.bgVoid.opacity(0.60))
                .frame(width: size * 0.58, height: size * 0.58)
                .blur(radius: size * 0.026)
                .offset(x: -size * 0.10, y: size * 0.05)

            Ellipse()
                .stroke(
                    AngularGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.10),
                            BenyuanColor.accentGold.opacity(0.34 + progress * 0.10),
                            BenyuanColor.textPrimary.opacity(0.20),
                            BenyuanColor.accentGold.opacity(0.08),
                            BenyuanColor.textPrimary.opacity(0.10)
                        ],
                        center: .center,
                        angle: .degrees(phase * 3.2)
                    ),
                    lineWidth: 1.4
                )
                .frame(width: size * 1.34, height: size * 0.46)
                .rotationEffect(.degrees(-10 + phase * 2.2))
                .blendMode(.screen)
        }
        .shadow(color: BenyuanColor.accentGold.opacity(0.10 + pulse * 0.05), radius: size * 0.16)
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
