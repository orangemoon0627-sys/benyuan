import SwiftUI
import UIKit

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

enum BenyuanCelestialAssetCatalog {
    struct LayerSet {
        var baseName: String
        var backdropName: String?
        var coreName: String?
        var glowName: String?
        var particlesName: String?

        var hasLayeredArtwork: Bool {
            coreName != nil || glowName != nil || particlesName != nil
        }
    }

    static let layeredSuffixes = (backdrop: "Backdrop", core: "Core", glow: "Glow", particles: "Particles")

    static let requiredAssetNames = [
        "BenyuanCelestialFarTideMoon",
        "BenyuanCelestialStarMapArchitect",
        "BenyuanCelestialMoonHarbor",
        "BenyuanCelestialExistentialNomad",
        "BenyuanCelestialRainWindowScribe",
        "BenyuanCelestialEventHorizonDiver",
        "BenyuanCelestialNebulaWeaver",
        "BenyuanCelestialSolarCorona",
        "BenyuanCelestialTerrestrialPlanet",
        "BenyuanCelestialDeepSpaceAnchor",
    ]

    static func isAvailable(_ assetName: String) -> Bool {
        UIImage(named: assetName) != nil
    }

    static func layerSet(for assetName: String) -> LayerSet {
        let backdropName = assetName + layeredSuffixes.backdrop
        let coreName = assetName + layeredSuffixes.core
        let glowName = assetName + layeredSuffixes.glow
        let particlesName = assetName + layeredSuffixes.particles

        return LayerSet(
            baseName: assetName,
            backdropName: isAvailable(backdropName) ? backdropName : nil,
            coreName: isAvailable(coreName) ? coreName : nil,
            glowName: isAvailable(glowName) ? glowName : nil,
            particlesName: isAvailable(particlesName) ? particlesName : nil
        )
    }
}

struct BenyuanLayeredCelestialAssetRenderer: View {
    var layers: BenyuanCelestialAssetCatalog.LayerSet
    var assetName: String
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        ZStack {
            BenyuanReferenceCelestialArtwork(assetName: layers.baseName, size: size, phase: phase, progress: progress, pulse: pulse, mode: mode)
        }
    }
}

struct BenyuanReferenceCelestialBackdrop: View {
    var layers: BenyuanCelestialAssetCatalog.LayerSet
    var size: CGFloat
    var phase: TimeInterval
    var pulse: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        if let backdropName = layers.backdropName {
            Image(backdropName)
                .resizable()
                .interpolation(.high)
                .antialiased(true)
                .scaledToFit()
                .frame(width: size * 1.82, height: size * 1.52)
                .scaleEffect(1.012 + CGFloat(pulse) * mode.localAssetGlowBreath * 0.38)
                .offset(mode.localAssetBackdropOffset(phase: phase, size: size))
                .rotationEffect(.degrees(mode.localAssetBackdropRotation(phase: phase)))
                .opacity(mode.referenceBackdropOpacity)
                .blendMode(.screen)
        }
    }
}

struct BenyuanReferenceCelestialArtwork: View {
    var assetName: String
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        ZStack {
            Image(assetName)
                .resizable()
                .interpolation(.high)
                .antialiased(true)
                .scaledToFit()
                .frame(width: size * 1.46, height: size * 1.22)
                .scaleEffect(mode.localAssetCoreScale + CGFloat(pulse) * mode.localAssetCoreBreath)
                .offset(mode.localAssetCoreOffset(phase: phase, size: size))
                .rotationEffect(.degrees(mode.localAssetCoreRotation(phase: phase)))
                .opacity(mode.referenceArtworkOpacity)
                .shadow(color: mode.localAssetGlowColor.opacity(0.08 + pulse * 0.05), radius: size * 0.040)

            if mode.referenceArtworkUsesGlowLayer,
               let glowAssetName = BenyuanCelestialAssetCatalog.layerSet(for: assetName).glowName {
                Image(glowAssetName)
                    .resizable()
                    .interpolation(.high)
                    .antialiased(true)
                    .scaledToFit()
                    .frame(width: size * 1.46, height: size * 1.22)
                    .scaleEffect(1.006 + CGFloat(pulse) * mode.localAssetGlowBreath * 0.45)
                    .offset(mode.localAssetGlowOffset(phase: phase, size: size))
                    .rotationEffect(.degrees(mode.localAssetGlowRotation(phase: phase) * 0.25))
                    .opacity(mode.referenceArtworkGlowOpacity + pulse * 0.04)
                    .blur(radius: mode.referenceArtworkGlowBlur)
                    .blendMode(.screen)
            }

            if let particlesAssetName = BenyuanCelestialAssetCatalog.layerSet(for: assetName).particlesName {
                Image(particlesAssetName)
                    .resizable()
                    .interpolation(.high)
                    .antialiased(true)
                    .scaledToFit()
                    .frame(width: size * 1.56, height: size * 1.30)
                    .offset(mode.localAssetParticleLayerOffset(phase: phase, size: size))
                    .rotationEffect(.degrees(mode.localAssetParticleLayerRotation(phase: phase)))
                    .opacity(mode.localAssetParticleOpacity + pulse * 0.08)
                    .blendMode(.screen)
            }

            BenyuanLocalCelestialAssetGlint(size: size, phase: phase, progress: progress, mode: mode)
        }
    }
}

struct BenyuanLayeredCelestialCore: View {
    var layers: BenyuanCelestialAssetCatalog.LayerSet
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        let coreAssetName = layers.coreName ?? layers.baseName

        Image(coreAssetName)
            .resizable()
            .interpolation(.high)
            .antialiased(true)
            .scaledToFit()
            .frame(width: size * 1.46, height: size * 1.22)
            .scaleEffect(mode.localAssetCoreScale + CGFloat(pulse) * mode.localAssetCoreBreath)
            .offset(mode.localAssetCoreOffset(phase: phase, size: size))
            .rotationEffect(.degrees(mode.localAssetCoreRotation(phase: phase)))
            .shadow(color: mode.localAssetGlowColor.opacity(0.10 + pulse * 0.05), radius: size * 0.045)
    }
}

struct BenyuanLayeredCelestialGlow: View {
    var layers: BenyuanCelestialAssetCatalog.LayerSet
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        if let glowAssetName = layers.glowName {
            Image(glowAssetName)
                .resizable()
                .interpolation(.high)
                .antialiased(true)
                .scaledToFit()
                .frame(width: size * 1.46, height: size * 1.22)
                .scaleEffect(1.0 + CGFloat(pulse) * mode.localAssetGlowBreath)
                .offset(mode.localAssetGlowOffset(phase: phase, size: size))
                .rotationEffect(.degrees(mode.localAssetGlowRotation(phase: phase)))
                .blur(radius: mode.localAssetLayeredGlowBlur)
                .opacity(mode.localAssetGlowOpacity + pulse * 0.08)
                .blendMode(.screen)
        } else {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            mode.localAssetGlowColor.opacity(0.12 + pulse * 0.04),
                            mode.localAssetGlowColor.opacity(0.04),
                            .clear
                        ],
                        center: UnitPoint(x: 0.48 + sin(phase * 0.10) * 0.035, y: 0.46),
                        startRadius: size * 0.14,
                        endRadius: size * 0.76
                    )
                )
                .frame(width: size * 1.50, height: size * 1.36)
                .blendMode(.screen)
        }
    }
}

struct BenyuanLayeredCelestialParticles: View {
    var layers: BenyuanCelestialAssetCatalog.LayerSet
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        if let particlesAssetName = layers.particlesName {
            Image(particlesAssetName)
                .resizable()
                .interpolation(.high)
                .antialiased(true)
                .scaledToFit()
                .frame(width: size * 1.56, height: size * 1.30)
                .offset(mode.localAssetParticleLayerOffset(phase: phase, size: size))
                .rotationEffect(.degrees(mode.localAssetParticleLayerRotation(phase: phase)))
                .opacity(mode.localAssetParticleOpacity + pulse * 0.05)
                .blendMode(.screen)
        }
    }
}

struct BenyuanLocalCelestialAssetCore: View {
    var assetName: String
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        ZStack {
            Image(assetName)
                .resizable()
                .interpolation(.high)
                .antialiased(true)
                .scaledToFit()
                .frame(width: size * 1.46, height: size * 1.22)
                .scaleEffect(1.008 + pulse * 0.012)
                .rotationEffect(.degrees(sin(phase * 0.08) * 1.1))
                .blur(radius: 2.4)
                .opacity(0.18 + mode.localAssetGlowOpacity * 0.46 + pulse * 0.04)
                .blendMode(.screen)

            Image(assetName)
                .resizable()
                .interpolation(.high)
                .antialiased(true)
                .scaledToFit()
                .frame(width: size * 1.46, height: size * 1.22)
                .scaleEffect(mode.localAssetCoreScale + CGFloat(pulse) * mode.localAssetCoreBreath)
                .offset(mode.localAssetCoreOffset(phase: phase, size: size))
                .rotationEffect(.degrees(mode.localAssetCoreRotation(phase: phase)))
                .mask(
                    RadialGradient(
                        colors: [
                            .black,
                            .black.opacity(0.995),
                            .black.opacity(0.92),
                            .clear
                        ],
                        center: .center,
                        startRadius: size * 0.36,
                        endRadius: size * 0.92
                    )
                )
                .blendMode(.screen)
                .shadow(color: mode.localAssetGlowColor.opacity(0.10 + pulse * 0.05), radius: size * 0.055)

            BenyuanLocalCelestialAssetGlint(size: size, phase: phase, progress: progress, mode: mode)
        }
    }
}

struct BenyuanLocalCelestialAssetGlint: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        let clamped = min(max(progress, 0.04), 1)
        let pass = phase.truncatingRemainder(dividingBy: 5.8) / 5.8

        return Capsule()
            .fill(
                LinearGradient(
                    colors: [
                        .clear,
                        BenyuanColor.textPrimary.opacity(0.08 + clamped * 0.03),
                        mode.localAssetGlowColor.opacity(0.10 + clamped * 0.06),
                        .clear,
                    ],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .frame(width: size * 0.82, height: 1.4)
            .offset(x: size * (-0.44 + CGFloat(pass) * 0.88), y: size * 0.22)
            .rotationEffect(.degrees(-18))
            .blur(radius: 1.0)
            .opacity(0.36)
            .blendMode(.screen)
    }
}

struct BenyuanLocalCelestialAssetAtmosphere: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        ZStack {
            BenyuanSpectralParticleField(size: size, phase: phase, progress: progress)
                .opacity(mode.localAssetParticleOpacity)

            if mode.referenceArtworkUsesProceduralAtmosphereGlow {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                mode.localAssetGlowColor.opacity(0.16 + pulse * 0.05),
                                BenyuanColor.aubergineBlack.opacity(0.16),
                                .clear
                            ],
                            center: UnitPoint(x: 0.48 + sin(phase * 0.11) * 0.04, y: 0.46),
                            startRadius: size * 0.08,
                            endRadius: size * 0.78
                        )
                    )
                    .frame(width: size * 1.58, height: size * 1.58)
                    .blur(radius: size * 0.08)
                    .blendMode(.screen)
            }

            if mode == .eventHorizonDiver {
                BenyuanGravitationalLens(size: size, phase: phase, progress: progress, pulse: pulse)
                BenyuanOrbitalDustBand(size: size, phase: phase, progress: progress)
                    .opacity(0.72)
            }

            if mode == .nebulaWeaver {
                BenyuanNebulaVeil(size: size, phase: phase, progress: progress)
                    .opacity(0.62)
                BenyuanNebulaThreadField(size: size, phase: phase, progress: progress)
                    .opacity(0.72)
            }

            if mode == .solarCorona {
                BenyuanSolarFlareField(size: size, phase: phase, progress: progress, pulse: pulse)
                    .opacity(0.76)
            }

            if mode == .deepSpaceAnchor {
                BenyuanAnchorCoordinateField(size: size, phase: phase, progress: progress)
                    .opacity(0.62)
            }

            if mode == .terrestrialPlanet && mode.referenceArtworkUsesProceduralAtmosphereGlow {
                BenyuanTerrestrialAtmosphere(size: size, phase: phase, progress: progress)
                    .opacity(0.56)
            }

            if mode == .farTideMoon || mode == .moonHarbor {
                BenyuanLocalTideWake(size: size, phase: phase, progress: progress, pulse: pulse)
            }

            if mode == .rainWindowScribe {
                BenyuanLocalRainTraceField(size: size, phase: phase, progress: progress)
            }

            if mode == .starMapArchitect {
                BenyuanLocalStarMapPulse(size: size, phase: phase, progress: progress)
            }

            if mode == .existentialNomad {
                BenyuanLocalNomadHorizon(size: size, phase: phase, progress: progress)
            }
        }
    }
}

struct BenyuanLocalCelestialAssetMotionOverlay: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double
    var mode: BenyuanDeepCelestialBody.Mode

    @ViewBuilder
    var body: some View {
        switch mode {
        case .farTideMoon:
            BenyuanLocalFarTideMoonMotionPath(size: size, phase: phase, progress: progress, pulse: pulse)
        case .starMapArchitect:
            BenyuanLocalStarMapArchitectMotionPath(size: size, phase: phase, progress: progress, pulse: pulse)
        case .moonHarbor:
            BenyuanLocalMoonHarborMotionPath(size: size, phase: phase, progress: progress, pulse: pulse)
        case .existentialNomad:
            BenyuanLocalExistentialNomadMotionPath(size: size, phase: phase, progress: progress, pulse: pulse)
        case .rainWindowScribe:
            BenyuanLocalRainWindowScribeMotionPath(size: size, phase: phase, progress: progress, pulse: pulse)
        case .eventHorizonDiver:
            BenyuanLocalEventHorizonDiverMotionPath(size: size, phase: phase, progress: progress, pulse: pulse)
        case .nebulaWeaver:
            BenyuanLocalNebulaWeaverMotionPath(size: size, phase: phase, progress: progress, pulse: pulse)
        case .solarCorona:
            BenyuanLocalSolarCoronaMotionPath(size: size, phase: phase, progress: progress, pulse: pulse)
        case .terrestrialPlanet:
            BenyuanLocalTerrestrialPlanetMotionPath(size: size, phase: phase, progress: progress, pulse: pulse)
        case .deepSpaceAnchor:
            BenyuanLocalDeepSpaceAnchorMotionPath(size: size, phase: phase, progress: progress, pulse: pulse)
        default:
            BenyuanLocalFallbackMotionPath(size: size, phase: phase, progress: progress, pulse: pulse, mode: mode)
        }
    }
}

struct BenyuanLocalFarTideMoonMotionPath: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<5, id: \.self) { index in
                let width = size * (0.88 + CGFloat(index) * 0.14)
                let y = size * (0.22 + CGFloat(index) * 0.046)
                Path { path in
                    path.move(to: CGPoint(x: -width / 2, y: y))
                    for step in 0...42 {
                        let x = -width / 2 + width * CGFloat(step) / 42
                        let wave = sin(Double(step) * 0.54 + phase * (0.42 + Double(index) * 0.04))
                        path.addLine(to: CGPoint(x: x, y: y + CGFloat(wave) * size * 0.012))
                    }
                }
                .stroke(
                    LinearGradient(
                        colors: [
                            .clear,
                            BenyuanColor.textPrimary.opacity(0.10 + progress * 0.05),
                            BenyuanColor.accentGold.opacity(0.08 + pulse * 0.05),
                            .clear
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    style: StrokeStyle(lineWidth: index == 1 ? 1.5 : 0.9, lineCap: .round)
                )
                .blur(radius: CGFloat(index) * 0.28)
                .blendMode(.screen)
            }

            ForEach(0..<7, id: \.self) { index in
                let shimmer = 0.5 + 0.5 * sin(phase * (0.44 + Double(index) * 0.03) + Double(index))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [
                                .clear,
                                BenyuanColor.textPrimary.opacity(0.08 + shimmer * 0.09),
                                .clear
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: 1.2 + CGFloat(index % 2), height: size * (0.18 + CGFloat(index % 3) * 0.025))
                    .offset(x: size * (-0.24 + CGFloat(index) * 0.08), y: size * (0.23 + CGFloat(shimmer) * 0.05))
                    .blur(radius: 0.4)
                    .blendMode(.screen)
            }

            Ellipse()
                .trim(from: 0.07, to: 0.92)
                .stroke(
                    AngularGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.04),
                            BenyuanColor.textPrimary.opacity(0.22 + progress * 0.06),
                            BenyuanColor.accentGold.opacity(0.10 + pulse * 0.06),
                            BenyuanColor.textPrimary.opacity(0.04)
                        ],
                        center: .center,
                        angle: .degrees(phase * 4.0)
                    ),
                    style: StrokeStyle(lineWidth: 1.1, lineCap: .round)
                )
                .frame(width: size * 1.18, height: size * 0.40)
                .offset(y: size * 0.10)
                .rotationEffect(.degrees(-8 + sin(phase * 0.14) * 2))
                .blendMode(.screen)
        }
    }
}

struct BenyuanLocalStarMapArchitectMotionPath: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    private static let nodes: [(CGFloat, CGFloat)] = [
        (-0.36, -0.22), (-0.12, -0.34), (0.16, -0.24), (0.34, -0.02),
        (0.10, 0.18), (-0.18, 0.12), (-0.32, 0.32), (0.34, 0.28)
    ]
    private static let edges: [(Int, Int)] = [
        (0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 0), (5, 6), (4, 7), (1, 5), (2, 4)
    ]

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .stroke(
                        BenyuanColor.textPrimary.opacity(0.045 + Double(index) * 0.026),
                        style: StrokeStyle(lineWidth: 0.8, lineCap: .round, dash: [2, 14])
                    )
                    .frame(width: size * (0.58 + CGFloat(index) * 0.20), height: size * (0.58 + CGFloat(index) * 0.20))
                    .rotationEffect(.degrees(phase * (5 + Double(index) * 2.4)))
                    .blendMode(.screen)
            }

            ForEach(Self.edges.indices, id: \.self) { index in
                let edge = Self.edges[index]
                let start = Self.nodes[edge.0]
                let end = Self.nodes[edge.1]
                Path { path in
                    path.move(to: CGPoint(x: start.0 * size, y: start.1 * size))
                    path.addLine(to: CGPoint(x: end.0 * size, y: end.1 * size))
                }
                .stroke(
                    index.isMultiple(of: 3) ? BenyuanColor.accentGold.opacity(0.16 + progress * 0.05) : BenyuanColor.textPrimary.opacity(0.11 + pulse * 0.04),
                    style: StrokeStyle(lineWidth: index.isMultiple(of: 4) ? 1.1 : 0.7, lineCap: .round)
                )
                .blendMode(.screen)
            }

            ForEach(Self.nodes.indices, id: \.self) { index in
                let node = Self.nodes[index]
                let nodePulse = 0.55 + 0.45 * sin(phase * (0.74 + Double(index) * 0.05) + Double(index))
                Circle()
                    .fill(index.isMultiple(of: 3) ? BenyuanColor.accentGold.opacity(0.48 + nodePulse * 0.28) : BenyuanColor.textPrimary.opacity(0.25 + nodePulse * 0.20))
                    .frame(width: index.isMultiple(of: 3) ? 5.0 : 3.2, height: index.isMultiple(of: 3) ? 5.0 : 3.2)
                    .offset(x: node.0 * size, y: node.1 * size)
                    .shadow(color: BenyuanColor.textPrimary.opacity(0.14), radius: 8)
                    .blendMode(.screen)
            }

            Capsule()
                .fill(
                    LinearGradient(
                        colors: [.clear, BenyuanColor.textPrimary.opacity(0.20), BenyuanColor.accentGold.opacity(0.12), .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(width: size * 1.08, height: 1.0)
                .offset(y: size * (-0.38 + CGFloat((phase * 0.09).truncatingRemainder(dividingBy: 1)) * 0.76))
                .rotationEffect(.degrees(-4))
                .blur(radius: 0.5)
                .blendMode(.screen)
        }
    }
}

struct BenyuanLocalMoonHarborMotionPath: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<5, id: \.self) { index in
                Path { path in
                    let y = size * (0.08 + CGFloat(index) * 0.052)
                    path.move(to: CGPoint(x: -size * 0.56, y: y))
                    path.addQuadCurve(
                        to: CGPoint(x: size * 0.54, y: y + CGFloat(sin(phase * 0.24 + Double(index))) * size * 0.018),
                        control: CGPoint(x: 0, y: y + size * (0.040 + CGFloat(index) * 0.004))
                    )
                }
                .stroke(
                    LinearGradient(
                        colors: [.clear, BenyuanColor.textPrimary.opacity(0.09 + progress * 0.04), BenyuanColor.accentGold.opacity(0.08 + pulse * 0.05), .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    style: StrokeStyle(lineWidth: index == 2 ? 1.4 : 0.8, lineCap: .round)
                )
                .blendMode(.screen)
            }

            Path { path in
                path.move(to: CGPoint(x: -size * 0.42, y: size * 0.18))
                path.addCurve(
                    to: CGPoint(x: size * 0.36, y: size * 0.16),
                    control1: CGPoint(x: -size * 0.18, y: size * 0.32),
                    control2: CGPoint(x: size * 0.16, y: size * 0.32)
                )
                path.move(to: CGPoint(x: -size * 0.18, y: size * 0.17))
                path.addLine(to: CGPoint(x: -size * 0.18, y: size * 0.34))
                path.move(to: CGPoint(x: size * 0.10, y: size * 0.17))
                path.addLine(to: CGPoint(x: size * 0.10, y: size * 0.31))
            }
            .stroke(BenyuanColor.accentGold.opacity(0.24 + progress * 0.10), style: StrokeStyle(lineWidth: 1.3, lineCap: .round))
            .shadow(color: BenyuanColor.accentGold.opacity(0.20), radius: 10)
            .blendMode(.screen)

            Circle()
                .fill(BenyuanColor.accentGold.opacity(0.70 + pulse * 0.24))
                .frame(width: size * 0.050, height: size * 0.050)
                .offset(x: size * 0.30, y: size * 0.04)
                .shadow(color: BenyuanColor.accentGold.opacity(0.50), radius: 16)
                .blendMode(.screen)

            Ellipse()
                .trim(from: 0.12, to: 0.82)
                .stroke(BenyuanColor.textPrimary.opacity(0.10 + pulse * 0.04), style: StrokeStyle(lineWidth: 0.9, lineCap: .round))
                .frame(width: size * 0.96, height: size * 0.42)
                .offset(x: -size * 0.04, y: size * 0.02)
                .rotationEffect(.degrees(-10 + sin(phase * 0.20) * 2.5))
                .blendMode(.screen)
        }
    }
}

struct BenyuanLocalExistentialNomadMotionPath: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        let travel = CGFloat((phase * 0.085).truncatingRemainder(dividingBy: 1))

        ZStack {
            ForEach(0..<4, id: \.self) { index in
                Path { path in
                    path.move(to: CGPoint(x: -size * 0.62, y: size * (0.22 + CGFloat(index) * 0.055)))
                    path.addCurve(
                        to: CGPoint(x: size * 0.62, y: size * (-0.22 + CGFloat(index) * 0.085)),
                        control1: CGPoint(x: -size * 0.22, y: size * (0.16 - CGFloat(index) * 0.018)),
                        control2: CGPoint(x: size * 0.16, y: size * (-0.34 + CGFloat(index) * 0.072))
                    )
                }
                .stroke(
                    LinearGradient(
                        colors: [.clear, BenyuanColor.textPrimary.opacity(0.08 + Double(index) * 0.022), BenyuanColor.accentGold.opacity(0.12 + progress * 0.05), .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    style: StrokeStyle(lineWidth: index == 1 ? 1.4 : 0.8, lineCap: .round, dash: index == 0 ? [4, 16] : [])
                )
                .rotationEffect(.degrees(sin(phase * 0.12 + Double(index)) * 2.2))
                .blendMode(.screen)
            }

            Capsule()
                .fill(
                    LinearGradient(
                        colors: [.clear, BenyuanColor.textPrimary.opacity(0.12 + pulse * 0.06), .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(width: size * 1.24, height: 1.1)
                .offset(y: size * 0.19)
                .rotationEffect(.degrees(-8))
                .blur(radius: 0.7)
                .blendMode(.screen)

            Circle()
                .fill(BenyuanColor.accentGold.opacity(0.72))
                .frame(width: size * 0.035, height: size * 0.035)
                .offset(x: size * (-0.54 + travel * 1.08), y: size * (0.26 - travel * 0.50 + sin(Double(travel) * .pi) * 0.05))
                .shadow(color: BenyuanColor.accentGold.opacity(0.44), radius: 14)
                .blendMode(.screen)

            ForEach(0..<9, id: \.self) { index in
                let drift = CGFloat((phase * (0.026 + Double(index % 4) * 0.004) + Double(index) * 0.13).truncatingRemainder(dividingBy: 1))
                Circle()
                    .fill(index.isMultiple(of: 4) ? BenyuanColor.accentGold.opacity(0.24) : BenyuanColor.textPrimary.opacity(0.13))
                    .frame(width: 2.2, height: 2.2)
                    .offset(x: size * (-0.58 + drift * 1.16), y: size * (-0.30 + CGFloat(index % 5) * 0.14))
                    .blur(radius: 0.7)
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanLocalRainWindowScribeMotionPath: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<16, id: \.self) { index in
                let fall = CGFloat((phase * (0.052 + Double(index % 5) * 0.007) + Double(index) * 0.11).truncatingRemainder(dividingBy: 1))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [.clear, BenyuanColor.textPrimary.opacity(0.12 + progress * 0.04), BenyuanColor.accentGold.opacity(index.isMultiple(of: 6) ? 0.10 : 0.03), .clear],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: index.isMultiple(of: 5) ? 1.4 : 0.8, height: size * (0.16 + CGFloat(index % 4) * 0.036))
                    .offset(x: size * (-0.48 + CGFloat(index) * 0.064), y: size * (-0.40 + fall * 0.84))
                    .rotationEffect(.degrees(8))
                    .blur(radius: index.isMultiple(of: 5) ? 0.2 : 0.45)
                    .blendMode(.screen)
            }

            ForEach(0..<3, id: \.self) { index in
                Path { path in
                    let y = size * (-0.04 + CGFloat(index) * 0.12)
                    path.move(to: CGPoint(x: -size * 0.34, y: y))
                    path.addCurve(
                        to: CGPoint(x: size * 0.34, y: y + CGFloat(sin(phase * 0.20 + Double(index))) * size * 0.035),
                        control1: CGPoint(x: -size * 0.12, y: y + size * (0.11 - CGFloat(index) * 0.02)),
                        control2: CGPoint(x: size * 0.12, y: y - size * (0.09 - CGFloat(index) * 0.012))
                    )
                }
                .stroke(
                    index == 1 ? BenyuanColor.accentGold.opacity(0.20 + pulse * 0.08) : BenyuanColor.textPrimary.opacity(0.08 + progress * 0.04),
                    style: StrokeStyle(lineWidth: index == 1 ? 1.2 : 0.8, lineCap: .round)
                )
                .blur(radius: CGFloat(index) * 0.35)
                .blendMode(.screen)
            }

            RoundedRectangle(cornerRadius: size * 0.08, style: .continuous)
                .stroke(BenyuanColor.textPrimary.opacity(0.045 + pulse * 0.025), lineWidth: 1)
                .frame(width: size * 0.96, height: size * 0.70)
                .blendMode(.screen)
        }
    }
}

struct BenyuanLocalEventHorizonDiverMotionPath: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { index in
                Ellipse()
                    .stroke(
                        AngularGradient(
                            colors: [
                                BenyuanColor.accentGold.opacity(0.08 + Double(index) * 0.035),
                                BenyuanColor.textPrimary.opacity(0.18 + progress * 0.05),
                                BenyuanColor.accentGold.opacity(0.24 + pulse * 0.12),
                                BenyuanColor.textPrimary.opacity(0.08),
                                BenyuanColor.accentGold.opacity(0.08 + Double(index) * 0.035)
                            ],
                            center: .center,
                            angle: .degrees(phase * (10 + Double(index) * 2.2))
                        ),
                        style: StrokeStyle(lineWidth: index == 1 ? 1.8 : 1.0, lineCap: .round)
                    )
                    .frame(width: size * (1.10 + CGFloat(index) * 0.16), height: size * (0.38 + CGFloat(index) * 0.052))
                    .rotationEffect(.degrees(-16 + Double(index) * 7 + phase * (1.2 + Double(index) * 0.28)))
                    .blur(radius: CGFloat(index) * 0.35)
                    .blendMode(.screen)
            }

            ForEach(0..<18, id: \.self) { index in
                let angle = phase * (0.48 + Double(index % 4) * 0.038) + Double(index) * .pi * 2 / 18
                let radiusX = size * (0.52 + CGFloat(index % 4) * 0.038)
                let radiusY = size * (0.15 + CGFloat(index % 3) * 0.020)
                Circle()
                    .fill(index.isMultiple(of: 5) ? BenyuanColor.accentGold.opacity(0.62) : BenyuanColor.textPrimary.opacity(0.19))
                    .frame(width: index.isMultiple(of: 5) ? 3.8 : 2.1, height: index.isMultiple(of: 5) ? 3.8 : 2.1)
                    .offset(x: cos(angle) * radiusX, y: sin(angle) * radiusY)
                    .rotationEffect(.degrees(-16))
                    .blur(radius: index.isMultiple(of: 5) ? 0.15 : 0.65)
                    .blendMode(.screen)
            }

            Circle()
                .stroke(BenyuanColor.textPrimary.opacity(0.08 + pulse * 0.04), lineWidth: 1)
                .frame(width: size * (0.56 + pulse * 0.035), height: size * (0.56 + pulse * 0.035))
                .blur(radius: 1.0)
                .blendMode(.screen)
        }
    }
}

struct BenyuanLocalNebulaWeaverMotionPath: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<8, id: \.self) { index in
                Path { path in
                    let startY = size * (-0.34 + CGFloat(index) * 0.095)
                    path.move(to: CGPoint(x: -size * 0.68, y: startY))
                    path.addCurve(
                        to: CGPoint(x: size * 0.68, y: -startY * 0.62),
                        control1: CGPoint(x: -size * 0.22, y: startY + CGFloat(sin(phase * 0.16 + Double(index))) * size * 0.13),
                        control2: CGPoint(x: size * 0.22, y: -startY + CGFloat(cos(phase * 0.14 + Double(index))) * size * 0.13)
                    )
                }
                .stroke(
                    index.isMultiple(of: 2) ? BenyuanColor.nebulaViolet.opacity(0.18 + progress * 0.08) : BenyuanColor.textPrimary.opacity(0.10 + pulse * 0.04),
                    style: StrokeStyle(lineWidth: index == 3 ? 1.5 : 0.8, lineCap: .round, dash: index == 6 ? [2, 13] : [])
                )
                .blur(radius: CGFloat(index % 3) * 0.55)
                .blendMode(.screen)
            }

            ForEach(0..<14, id: \.self) { index in
                let drift = CGFloat(sin(phase * (0.13 + Double(index % 5) * 0.012) + Double(index)))
                Circle()
                    .fill(index.isMultiple(of: 4) ? BenyuanColor.accentGold.opacity(0.36) : BenyuanColor.textPrimary.opacity(0.16))
                    .frame(width: index.isMultiple(of: 4) ? 3.4 : 2.0, height: index.isMultiple(of: 4) ? 3.4 : 2.0)
                    .offset(
                        x: size * (-0.48 + CGFloat(index % 7) * 0.16) + drift * size * 0.038,
                        y: size * (-0.26 + CGFloat(index / 7) * 0.46) - drift * size * 0.030
                    )
                    .blur(radius: index.isMultiple(of: 4) ? 0.15 : 0.7)
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanLocalSolarCoronaMotionPath: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<16, id: \.self) { index in
                let angle = Double(index) / 16 * .pi * 2 + phase * (0.12 + Double(index % 4) * 0.012)
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [
                                BenyuanColor.accentGold.opacity(0.38 + progress * 0.16),
                                BenyuanColor.textPrimary.opacity(0.14 + pulse * 0.08),
                                .clear
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: size * (0.22 + CGFloat(index % 5) * 0.030 + pulse * 0.040), height: index.isMultiple(of: 4) ? 2.4 : 1.4)
                    .offset(x: cos(angle) * size * 0.48, y: sin(angle) * size * 0.48)
                    .rotationEffect(.radians(angle))
                    .blur(radius: index.isMultiple(of: 4) ? 0.20 : 0.80)
                    .blendMode(.screen)
            }

            ForEach(0..<4, id: \.self) { index in
                Circle()
                    .stroke(
                        AngularGradient(
                            colors: [
                                BenyuanColor.accentGold.opacity(0.03),
                                BenyuanColor.accentGold.opacity(0.22 + pulse * 0.08),
                                BenyuanColor.textPrimary.opacity(0.09),
                                BenyuanColor.accentGold.opacity(0.03)
                            ],
                            center: .center,
                            angle: .degrees(phase * (9 + Double(index) * 1.6))
                        ),
                        style: StrokeStyle(lineWidth: index == 1 ? 1.5 : 0.9, lineCap: .round)
                    )
                    .frame(width: size * (0.78 + CGFloat(index) * 0.11), height: size * (0.78 + CGFloat(index) * 0.11))
                    .scaleEffect(x: 1.0 + pulse * 0.018, y: 0.82 + CGFloat(index) * 0.025)
                    .rotationEffect(.degrees(Double(index) * 26 + sin(phase * 0.14) * 4))
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanLocalTerrestrialPlanetMotionPath: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            Circle()
                .stroke(
                    LinearGradient(
                        colors: [
                            .clear,
                            BenyuanColor.textPrimary.opacity(0.20 + progress * 0.05),
                            BenyuanColor.planetEdge.opacity(0.16 + pulse * 0.05),
                            .clear
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1.2
                )
                .frame(width: size * 0.84, height: size * 0.84)
                .blur(radius: 0.4)
                .blendMode(.screen)

            Capsule()
                .fill(
                    LinearGradient(
                        colors: [.clear, BenyuanColor.bgVoid.opacity(0.20), BenyuanColor.textPrimary.opacity(0.08), .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(width: size * 0.72, height: size * 0.92)
                .offset(x: size * (-0.16 + CGFloat(sin(phase * 0.12)) * 0.05))
                .rotationEffect(.degrees(-10))
                .blendMode(.screen)

            ForEach(0..<5, id: \.self) { index in
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [.clear, BenyuanColor.textPrimary.opacity(0.07 + Double(index) * 0.018), BenyuanColor.accentGold.opacity(0.05 + progress * 0.04), .clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: size * (0.52 - CGFloat(abs(index - 2)) * 0.035), height: 1.0)
                    .offset(x: CGFloat(sin(phase * 0.18 + Double(index))) * size * 0.035, y: CGFloat(index - 2) * size * 0.082)
                    .rotationEffect(.degrees(-8))
                    .mask(Circle().frame(width: size * 0.86, height: size * 0.86))
                    .blendMode(.screen)
            }

            ForEach(0..<8, id: \.self) { index in
                let blink = 0.45 + 0.55 * sin(phase * (0.58 + Double(index) * 0.05) + Double(index) * 1.7)
                Circle()
                    .fill(BenyuanColor.accentGold.opacity(0.16 + blink * 0.34))
                    .frame(width: 2.2, height: 2.2)
                    .offset(x: size * (-0.25 + CGFloat(index % 4) * 0.14), y: size * (0.08 + CGFloat(index / 4) * 0.13))
                    .blur(radius: 0.25)
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanLocalDeepSpaceAnchorMotionPath: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { index in
                BenyuanAnchorCoordinateCross(size: size * (0.80 + CGFloat(index) * 0.13), index: index, phase: phase * 0.54)
                    .opacity(0.64)
            }

            Path { path in
                path.move(to: CGPoint(x: -size * 0.58, y: 0))
                path.addLine(to: CGPoint(x: size * 0.58, y: 0))
                path.move(to: CGPoint(x: 0, y: -size * 0.42))
                path.addLine(to: CGPoint(x: 0, y: size * 0.42))
            }
            .stroke(BenyuanColor.textPrimary.opacity(0.08 + progress * 0.04), style: StrokeStyle(lineWidth: 0.8, lineCap: .round, dash: [2, 14]))
            .rotationEffect(.degrees(-20 + sin(phase * 0.10) * 2))
            .blendMode(.screen)

            ForEach(0..<2, id: \.self) { index in
                let travel = CGFloat((phase * (0.070 + Double(index) * 0.018) + Double(index) * 0.45).truncatingRemainder(dividingBy: 1))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [.clear, BenyuanColor.accentGold.opacity(0.22 + pulse * 0.08), BenyuanColor.textPrimary.opacity(0.12), .clear],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: size * 0.26, height: 1.2)
                    .offset(x: size * (-0.52 + travel * 1.04), y: index == 0 ? 0 : size * 0.18)
                    .rotationEffect(.degrees(index == 0 ? -20 : 70))
                    .blur(radius: 0.4)
                    .blendMode(.screen)
            }

            ForEach(0..<10, id: \.self) { index in
                let angle = Double(index) * .pi * 2 / 10 + phase * 0.045
                Circle()
                    .fill(index.isMultiple(of: 3) ? BenyuanColor.accentGold.opacity(0.42) : BenyuanColor.textPrimary.opacity(0.18))
                    .frame(width: index.isMultiple(of: 3) ? 3.4 : 2.0, height: index.isMultiple(of: 3) ? 3.4 : 2.0)
                    .offset(x: cos(angle) * size * 0.58, y: sin(angle) * size * 0.32)
                    .blur(radius: index.isMultiple(of: 3) ? 0.2 : 0.7)
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanLocalFallbackMotionPath: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        ZStack {
            if mode.localAssetShowsPrimaryOrbit {
                BenyuanAccretionRing(size: size, phase: phase, progress: progress, mode: mode)
                    .rotationEffect(.degrees(mode.tilt + phase * mode.localAssetOrbitSpeed))
                    .scaleEffect(x: mode.localAssetOrbitScaleX + pulse * 0.018, y: mode.localAssetOrbitScaleY + pulse * 0.012)
                    .opacity(mode.localAssetOrbitOpacity)
                    .blendMode(.screen)
            }

            ForEach(0..<8, id: \.self) { index in
                let angle = phase * (0.16 + Double(index % 3) * 0.025) + Double(index) * .pi * 2 / 8
                let radius = size * (0.24 + CGFloat(index % 4) * 0.052)
                Circle()
                    .fill(index.isMultiple(of: 4) ? mode.localAssetGlowColor.opacity(0.52) : BenyuanColor.textPrimary.opacity(0.15))
                    .frame(width: index.isMultiple(of: 4) ? 3.4 : 2.0, height: index.isMultiple(of: 4) ? 3.4 : 2.0)
                    .offset(x: cos(angle) * radius, y: sin(angle) * radius * mode.localAssetParticleYScale)
                    .blur(radius: index.isMultiple(of: 4) ? 0.15 : 0.7)
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanLocalTideWake: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                Ellipse()
                    .stroke(
                        LinearGradient(
                            colors: [
                                .clear,
                                BenyuanColor.textPrimary.opacity(0.10 + progress * 0.04),
                                BenyuanColor.accentGold.opacity(0.06 + pulse * 0.04),
                                .clear
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        lineWidth: index == 0 ? 1.4 : 0.8
                    )
                    .frame(width: size * (1.10 + CGFloat(index) * 0.18), height: size * (0.22 + CGFloat(index) * 0.05))
                    .offset(y: size * (0.18 + CGFloat(index) * 0.045))
                    .rotationEffect(.degrees(-8 + sin(phase * 0.18 + Double(index)) * 5))
                    .blur(radius: 0.8 + CGFloat(index) * 0.6)
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanLocalRainTraceField: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    var body: some View {
        ZStack {
            ForEach(0..<9, id: \.self) { index in
                let fall = CGFloat((phase * (0.05 + Double(index) * 0.007) + Double(index) * 0.17).truncatingRemainder(dividingBy: 1))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [
                                .clear,
                                BenyuanColor.textPrimary.opacity(0.12),
                                BenyuanColor.accentGold.opacity(index.isMultiple(of: 4) ? 0.12 : 0.04),
                                .clear
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: 1, height: size * (0.20 + CGFloat(index % 3) * 0.05))
                    .offset(x: size * (-0.48 + CGFloat(index) * 0.12), y: size * (-0.34 + fall * 0.70))
                    .rotationEffect(.degrees(10))
                    .blur(radius: 0.5)
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanLocalStarMapPulse: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .stroke(
                        BenyuanColor.textPrimary.opacity(0.055 + Double(index) * 0.025),
                        style: StrokeStyle(lineWidth: 0.8, lineCap: .round, dash: [2, 12])
                    )
                    .frame(width: size * (0.72 + CGFloat(index) * 0.20), height: size * (0.72 + CGFloat(index) * 0.20))
                    .rotationEffect(.degrees(phase * (5 + Double(index) * 3)))
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanLocalNomadHorizon: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                let drift = sin(phase * (0.10 + Double(index) * 0.03))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [
                                .clear,
                                BenyuanColor.textPrimary.opacity(0.055 + Double(index) * 0.025),
                                BenyuanColor.accentGold.opacity(0.045 + progress * 0.04),
                                .clear
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: size * (1.05 + CGFloat(index) * 0.14), height: 1.2)
                    .offset(x: CGFloat(drift) * size * 0.05, y: size * (0.08 + CGFloat(index) * 0.07))
                    .rotationEffect(.degrees(-10 + Double(index) * 5))
                    .blur(radius: 0.7)
                    .blendMode(.screen)
            }
        }
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
        case solarCorona
        case terrestrialPlanet
        case deepSpace
        case farTideMoon
        case starMapArchitect
        case moonHarbor
        case existentialNomad
        case rainWindowScribe
        case eventHorizonDiver
        case nebulaWeaver
        case deepSpaceAnchor

        static let processing: Mode = .accretionBlackHole
        static let constellation: Mode = .farTideMoon

        var usesReferenceArtworkRender: Bool {
            switch self {
            case .farTideMoon, .starMapArchitect, .moonHarbor, .existentialNomad, .rainWindowScribe, .eventHorizonDiver, .nebulaWeaver, .solarCorona, .terrestrialPlanet, .deepSpaceAnchor:
                return true
            default:
                return false
            }
        }

        var tilt: Double {
            switch self {
            case .accretionBlackHole, .eventHorizonDiver: return -16
            case .theaterNebula, .nebulaWeaver: return 18
            case .constellationMoon, .farTideMoon: return -10
            case .solarCorona: return 6
            case .terrestrialPlanet: return -8
            case .deepSpace, .deepSpaceAnchor: return -22
            case .starMapArchitect: return -4
            case .moonHarbor: return -12
            case .existentialNomad: return 4
            case .rainWindowScribe: return 0
            }
        }

        var ringOpacity: Double {
            switch self {
            case .accretionBlackHole, .eventHorizonDiver: return 0.58
            case .theaterNebula, .nebulaWeaver: return 0.24
            case .constellationMoon, .farTideMoon: return 0.64
            case .solarCorona: return 0.74
            case .terrestrialPlanet: return 0.38
            case .deepSpace, .deepSpaceAnchor: return 0.22
            case .starMapArchitect: return 0.32
            case .moonHarbor: return 0.40
            case .existentialNomad: return 0.26
            case .rainWindowScribe: return 0.18
            }
        }

        var usesSharedSatellites: Bool {
            switch self {
            case .farTideMoon, .starMapArchitect, .moonHarbor, .existentialNomad, .rainWindowScribe, .nebulaWeaver, .eventHorizonDiver, .deepSpaceAnchor:
                return false
            default:
                return true
            }
        }

        var localAssetName: String? {
            switch self {
            case .farTideMoon: return "BenyuanCelestialFarTideMoon"
            case .starMapArchitect: return "BenyuanCelestialStarMapArchitect"
            case .moonHarbor: return "BenyuanCelestialMoonHarbor"
            case .existentialNomad: return "BenyuanCelestialExistentialNomad"
            case .rainWindowScribe: return "BenyuanCelestialRainWindowScribe"
            case .eventHorizonDiver: return "BenyuanCelestialEventHorizonDiver"
            case .nebulaWeaver: return "BenyuanCelestialNebulaWeaver"
            case .solarCorona: return "BenyuanCelestialSolarCorona"
            case .terrestrialPlanet: return "BenyuanCelestialTerrestrialPlanet"
            case .deepSpaceAnchor: return "BenyuanCelestialDeepSpaceAnchor"
            default: return nil
            }
        }

        var localAssetGlowColor: Color {
            switch self {
            case .nebulaWeaver, .theaterNebula:
                return BenyuanColor.nebulaViolet
            case .solarCorona:
                return BenyuanColor.accentGold
            case .terrestrialPlanet:
                return BenyuanColor.planetEdge
            case .deepSpaceAnchor, .starMapArchitect:
                return BenyuanColor.textPrimary
            case .eventHorizonDiver, .accretionBlackHole:
                return BenyuanColor.accentGold
            default:
                return BenyuanColor.textPrimary
            }
        }

        var localAssetGlowOpacity: Double {
            switch self {
            case .rainWindowScribe, .existentialNomad:
                return 0.20
            case .starMapArchitect, .deepSpaceAnchor:
                return 0.24
            case .eventHorizonDiver, .solarCorona, .nebulaWeaver:
                return 0.30
            default:
                return 0.24
            }
        }

        var localAssetParticleOpacity: Double {
            switch self {
            case .rainWindowScribe, .terrestrialPlanet:
                return 0.26
            case .eventHorizonDiver, .nebulaWeaver, .solarCorona, .deepSpaceAnchor:
                return 0.44
            default:
                return 0.34
            }
        }

        var referenceArtworkOpacity: Double {
            switch self {
            case .eventHorizonDiver:
                return 1.0
            case .nebulaWeaver, .solarCorona, .starMapArchitect, .deepSpaceAnchor:
                return 1.0
            case .rainWindowScribe:
                return 1.0
            case .existentialNomad, .terrestrialPlanet:
                return 1.0
            default:
                return 1.0
            }
        }

        var referenceBackdropOpacity: Double {
            switch self {
            case .eventHorizonDiver:
                return 1.0
            case .nebulaWeaver, .solarCorona:
                return 1.0
            case .rainWindowScribe:
                return 1.0
            case .starMapArchitect, .deepSpaceAnchor:
                return 1.0
            case .existentialNomad:
                return 1.0
            case .terrestrialPlanet, .moonHarbor, .farTideMoon:
                return 1.0
            default:
                return 1.0
            }
        }

        var referenceArtworkGlowOpacity: Double {
            switch self {
            case .solarCorona:
                return 0.24
            case .eventHorizonDiver, .nebulaWeaver:
                return 0.18
            case .rainWindowScribe:
                return 0.12
            default:
                return 0.14
            }
        }

        var referenceArtworkUsesGlowLayer: Bool {
            switch self {
            case .farTideMoon, .moonHarbor, .terrestrialPlanet:
                return false
            default:
                return true
            }
        }

        var referenceArtworkUsesProceduralAtmosphereGlow: Bool {
            switch self {
            case .farTideMoon, .moonHarbor, .terrestrialPlanet:
                return false
            default:
                return true
            }
        }

        var referenceArtworkGlowBlur: CGFloat {
            switch self {
            case .rainWindowScribe:
                return 1.0
            case .solarCorona, .eventHorizonDiver, .nebulaWeaver:
                return 1.8
            default:
                return 1.3
            }
        }

        var referenceArtworkSubjectContrast: Double {
            switch self {
            case .farTideMoon, .moonHarbor, .terrestrialPlanet:
                return 1.18
            case .solarCorona, .eventHorizonDiver:
                return 1.10
            default:
                return 1.08
            }
        }

        var referenceArtworkSubjectSaturation: Double {
            switch self {
            case .farTideMoon, .moonHarbor:
                return 1.08
            case .terrestrialPlanet:
                return 1.14
            case .solarCorona:
                return 1.12
            default:
                return 1.06
            }
        }

        var subjectIsolationHeight: CGFloat {
            switch self {
            case .terrestrialPlanet:
                return 236
            case .farTideMoon, .moonHarbor:
                return 190
            default:
                return 214
            }
        }

        var subjectIsolationRingOpacity: Double {
            switch self {
            case .farTideMoon, .moonHarbor, .terrestrialPlanet:
                return 0.28
            default:
                return 0.18
            }
        }

        var subjectIsolationAccent: Color {
            switch self {
            case .solarCorona, .eventHorizonDiver:
                return BenyuanColor.accentGold
            case .terrestrialPlanet:
                return BenyuanColor.planetEdge
            default:
                return BenyuanColor.textPrimary
            }
        }

        var localAssetShowsPrimaryOrbit: Bool {
            switch self {
            case .eventHorizonDiver, .farTideMoon, .moonHarbor, .solarCorona, .deepSpaceAnchor, .starMapArchitect:
                return true
            default:
                return false
            }
        }

        var localAssetOrbitSpeed: Double {
            switch self {
            case .eventHorizonDiver:
                return 28
            case .starMapArchitect, .deepSpaceAnchor:
                return 14
            case .solarCorona:
                return 20
            default:
                return 10
            }
        }

        var localAssetOrbitScaleX: CGFloat {
            switch self {
            case .eventHorizonDiver:
                return 0.96
            case .starMapArchitect, .deepSpaceAnchor:
                return 0.82
            case .solarCorona:
                return 0.72
            default:
                return 0.86
            }
        }

        var localAssetOrbitScaleY: CGFloat {
            switch self {
            case .eventHorizonDiver:
                return 0.76
            case .solarCorona:
                return 0.68
            default:
                return 0.52
            }
        }

        var localAssetOrbitOpacity: Double {
            switch self {
            case .eventHorizonDiver:
                return 0.68
            case .starMapArchitect, .deepSpaceAnchor:
                return 0.32
            case .solarCorona:
                return 0.38
            default:
                return 0.28
            }
        }

        var localAssetParticleYScale: CGFloat {
            switch self {
            case .eventHorizonDiver:
                return 0.42
            case .nebulaWeaver:
                return 0.86
            default:
                return 0.62
            }
        }

        var localAssetCoreScale: CGFloat {
            switch self {
            case .rainWindowScribe:
                return 1.0
            case .eventHorizonDiver, .solarCorona:
                return 0.998
            case .terrestrialPlanet:
                return 0.992
            default:
                return 0.996
            }
        }

        var localAssetCoreBreath: CGFloat {
            switch self {
            case .solarCorona:
                return 0.010
            case .eventHorizonDiver, .terrestrialPlanet:
                return 0.006
            case .rainWindowScribe:
                return 0.003
            default:
                return 0.005
            }
        }

        var localAssetGlowBreath: CGFloat {
            switch self {
            case .solarCorona:
                return 0.034
            case .nebulaWeaver:
                return 0.024
            case .eventHorizonDiver:
                return 0.018
            default:
                return 0.012
            }
        }

        var localAssetLayeredGlowBlur: CGFloat {
            switch self {
            case .rainWindowScribe, .starMapArchitect:
                return 0.8
            case .solarCorona, .nebulaWeaver:
                return 1.4
            default:
                return 1.0
            }
        }

        func localAssetCoreOffset(phase: TimeInterval, size: CGFloat) -> CGSize {
            switch self {
            case .rainWindowScribe:
                return CGSize(width: CGFloat(sin(phase * 0.05)) * size * 0.003, height: 0)
            case .moonHarbor:
                return CGSize(width: CGFloat(sin(phase * 0.10)) * size * 0.006, height: CGFloat(cos(phase * 0.08)) * size * 0.004)
            case .terrestrialPlanet:
                return CGSize(width: CGFloat(sin(phase * 0.11)) * size * 0.010, height: CGFloat(cos(phase * 0.07)) * size * 0.004)
            case .existentialNomad:
                return CGSize(width: CGFloat(sin(phase * 0.06)) * size * 0.014, height: CGFloat(cos(phase * 0.05)) * size * 0.005)
            case .farTideMoon:
                return CGSize(width: CGFloat(sin(phase * 0.07)) * size * 0.006, height: CGFloat(sin(phase * 0.10)) * size * 0.003)
            default:
                return .zero
            }
        }

        func localAssetCoreRotation(phase: TimeInterval) -> Double {
            switch self {
            case .eventHorizonDiver:
                return sin(phase * 0.07) * 0.8
            case .nebulaWeaver:
                return sin(phase * 0.06) * 1.2
            case .solarCorona:
                return sin(phase * 0.10) * 0.9
            case .terrestrialPlanet:
                return sin(phase * 0.08) * 1.4
            case .deepSpaceAnchor:
                return phase * 0.20
            case .starMapArchitect:
                return sin(phase * 0.08) * 0.6
            case .existentialNomad:
                return sin(phase * 0.045) * 0.8
            default:
                return 0
            }
        }

        func localAssetGlowOffset(phase: TimeInterval, size: CGFloat) -> CGSize {
            switch self {
            case .nebulaWeaver:
                return CGSize(width: CGFloat(sin(phase * 0.08)) * size * 0.016, height: CGFloat(cos(phase * 0.07)) * size * 0.012)
            case .solarCorona:
                return CGSize(width: CGFloat(sin(phase * 0.16)) * size * 0.006, height: CGFloat(cos(phase * 0.13)) * size * 0.006)
            case .moonHarbor:
                return CGSize(width: CGFloat(sin(phase * 0.12)) * size * 0.010, height: CGFloat(cos(phase * 0.11)) * size * 0.004)
            case .rainWindowScribe:
                return CGSize(width: 0, height: CGFloat((phase * 0.035).truncatingRemainder(dividingBy: 1)) * size * 0.018)
            case .farTideMoon:
                return CGSize(width: CGFloat(sin(phase * 0.08)) * size * 0.008, height: CGFloat(sin(phase * 0.13)) * size * 0.006)
            default:
                return .zero
            }
        }

        func localAssetBackdropOffset(phase: TimeInterval, size: CGFloat) -> CGSize {
            switch self {
            case .rainWindowScribe:
                return CGSize(width: CGFloat(sin(phase * 0.06)) * size * 0.006, height: CGFloat(sin(phase * 0.04)) * size * 0.010)
            case .nebulaWeaver:
                return CGSize(width: CGFloat(sin(phase * 0.05)) * size * 0.020, height: CGFloat(cos(phase * 0.04)) * size * 0.014)
            case .eventHorizonDiver:
                return CGSize(width: 0, height: CGFloat(sin(phase * 0.05)) * size * 0.004)
            case .moonHarbor, .farTideMoon:
                return CGSize(width: CGFloat(sin(phase * 0.05)) * size * 0.006, height: CGFloat(cos(phase * 0.04)) * size * 0.004)
            default:
                return .zero
            }
        }

        func localAssetBackdropRotation(phase: TimeInterval) -> Double {
            switch self {
            case .eventHorizonDiver:
                return sin(phase * 0.035) * 0.6
            case .nebulaWeaver:
                return sin(phase * 0.045) * 1.2
            case .solarCorona:
                return sin(phase * 0.06) * 0.8
            case .deepSpaceAnchor, .starMapArchitect:
                return sin(phase * 0.035) * 0.5
            default:
                return 0
            }
        }

        func localAssetGlowRotation(phase: TimeInterval) -> Double {
            switch self {
            case .eventHorizonDiver:
                return phase * 1.4
            case .deepSpaceAnchor:
                return phase * 0.35
            case .starMapArchitect:
                return phase * 0.24
            case .solarCorona:
                return sin(phase * 0.12) * 2.0
            case .existentialNomad:
                return sin(phase * 0.05) * 1.1
            default:
                return 0
            }
        }

        func localAssetParticleLayerOffset(phase: TimeInterval, size: CGFloat) -> CGSize {
            switch self {
            case .rainWindowScribe:
                let fall = CGFloat((phase * 0.045).truncatingRemainder(dividingBy: 1))
                return CGSize(width: CGFloat(sin(phase * 0.08)) * size * 0.004, height: (-0.04 + fall * 0.08) * size)
            case .nebulaWeaver:
                return CGSize(width: CGFloat(sin(phase * 0.07)) * size * 0.024, height: CGFloat(cos(phase * 0.06)) * size * 0.018)
            case .moonHarbor:
                return CGSize(width: CGFloat(sin(phase * 0.10)) * size * 0.010, height: CGFloat(cos(phase * 0.14)) * size * 0.006)
            case .existentialNomad:
                return CGSize(width: CGFloat(sin(phase * 0.045)) * size * 0.030, height: 0)
            case .terrestrialPlanet:
                return CGSize(width: CGFloat(sin(phase * 0.12)) * size * 0.018, height: 0)
            case .farTideMoon:
                return CGSize(width: CGFloat(sin(phase * 0.06)) * size * 0.012, height: CGFloat(cos(phase * 0.10)) * size * 0.006)
            default:
                return .zero
            }
        }

        func localAssetParticleLayerRotation(phase: TimeInterval) -> Double {
            switch self {
            case .eventHorizonDiver:
                return phase * 3.0
            case .deepSpaceAnchor:
                return phase * 0.55
            case .starMapArchitect:
                return phase * 0.36
            case .solarCorona:
                return sin(phase * 0.12) * 2.4
            case .nebulaWeaver:
                return sin(phase * 0.06) * 1.6
            default:
                return 0
            }
        }
    }

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 24) { phase in
            let spin = phase.truncatingRemainder(dividingBy: 24) / 24
            let pulse = 0.5 + 0.5 * sin(phase * 0.72)
            let clampedProgress = min(max(progress, 0.04), 1)

            ZStack {
                if mode.usesReferenceArtworkRender,
                   let assetName = mode.localAssetName,
                   BenyuanCelestialAssetCatalog.isAvailable(assetName) {
                    let layerSet = BenyuanCelestialAssetCatalog.layerSet(for: assetName)
                    BenyuanLocalCelestialAssetAtmosphere(size: size, phase: phase, progress: clampedProgress, pulse: pulse, mode: mode)
                    BenyuanReferenceCelestialBackdrop(layers: layerSet, size: size, phase: phase, pulse: pulse, mode: mode)
                    BenyuanLayeredCelestialAssetRenderer(layers: layerSet, assetName: assetName, size: size, phase: phase, progress: clampedProgress, pulse: pulse, mode: mode)
                    BenyuanLocalCelestialAssetMotionOverlay(size: size, phase: phase, progress: clampedProgress, pulse: pulse, mode: mode)
                } else {
                    BenyuanSpectralParticleField(size: size, phase: phase, progress: clampedProgress)

                    if mode == .theaterNebula || mode == .nebulaWeaver {
                        BenyuanNebulaVeil(size: size, phase: phase, progress: clampedProgress)
                    }

                    if mode == .theaterNebula {
                        BenyuanNebulaCore(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                    }

                    if mode == .farTideMoon {
                        BenyuanFarTideMoonCore(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                    }

                    if mode == .starMapArchitect {
                        BenyuanStarMapArchitectCore(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                    }

                    if mode == .moonHarbor {
                        BenyuanMoonHarborCore(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                    }

                    if mode == .existentialNomad {
                        BenyuanExistentialNomadCore(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                    }

                    if mode == .rainWindowScribe {
                        BenyuanRainWindowScribeCore(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                    }

                    if mode == .nebulaWeaver {
                        BenyuanOpenNebulaBloom(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                        BenyuanNebulaThreadField(size: size, phase: phase, progress: clampedProgress)
                    }

                    if mode == .solarCorona {
                        BenyuanSolarFlareField(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                        BenyuanSolarCoronaCore(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                    }

                    if mode == .accretionBlackHole || mode == .deepSpace || mode == .eventHorizonDiver {
                        BenyuanGravitationalLens(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                        BenyuanOrbitalDustBand(size: size, phase: phase, progress: clampedProgress)
                        BenyuanAccretionRing(size: size, phase: phase, progress: clampedProgress, mode: mode)
                            .rotationEffect(.degrees(mode.tilt + spin * (mode == .deepSpace ? 180 : 360)))
                            .scaleEffect(
                                x: mode == .deepSpace ? 0.92 + pulse * 0.012 : 1.05 + pulse * 0.018,
                                y: mode == .deepSpace ? 0.74 + pulse * 0.010 : 0.94 + pulse * 0.012
                            )
                            .opacity(mode == .deepSpace ? 0.48 : 1)
                        if mode == .deepSpace {
                            BenyuanDeepSpaceAnchorCore(size: size, phase: phase, progress: clampedProgress, pulse: pulse, showAnchorGlyph: false)
                        } else {
                            BenyuanEventHorizon(size: size, phase: phase, progress: clampedProgress)
                        }
                    }

                    if mode == .deepSpaceAnchor {
                        BenyuanAnchorCoordinateField(size: size, phase: phase, progress: clampedProgress)
                        BenyuanDeepSpaceAnchorCore(size: size, phase: phase, progress: clampedProgress, pulse: pulse, showAnchorGlyph: true)
                    }

                    if mode == .constellationMoon || mode == .terrestrialPlanet {
                        BenyuanGravitationalLens(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                        if mode == .terrestrialPlanet {
                            BenyuanTerrestrialAtmosphere(size: size, phase: phase, progress: clampedProgress)
                            BenyuanTerrestrialCore(size: size, phase: phase, progress: clampedProgress, pulse: pulse)
                        } else {
                            BenyuanLunarCore(size: size, phase: phase, progress: clampedProgress)
                        }
                    }

                    if mode == .theaterNebula {
                        BenyuanOrbitalDustBand(size: size, phase: phase, progress: clampedProgress)
                        BenyuanAccretionRing(size: size, phase: phase, progress: clampedProgress, mode: mode)
                            .rotationEffect(.degrees(mode.tilt + spin * 120))
                            .scaleEffect(x: 0.96 + pulse * 0.014, y: 0.90 + pulse * 0.016)
                            .opacity(0.54)
                    }

                    if mode.usesSharedSatellites {
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
                }
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
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
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

struct BenyuanFarTideMoonCore: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { index in
                let width = size * (1.12 + CGFloat(index) * 0.18)
                let y = size * (0.30 + CGFloat(index) * 0.075)
                Path { path in
                    path.move(to: CGPoint(x: -width / 2, y: y))
                    for step in 0...36 {
                        let x = -width / 2 + width * CGFloat(step) / 36
                        let wave = sin(Double(step) * 0.58 + phase * (0.36 + Double(index) * 0.04))
                        path.addLine(to: CGPoint(x: x, y: y + CGFloat(wave) * size * 0.014))
                    }
                }
                .stroke(
                    LinearGradient(
                        colors: [
                            .clear,
                            BenyuanColor.textPrimary.opacity(0.12 + progress * 0.04),
                            BenyuanColor.accentGold.opacity(0.16 + progress * 0.06),
                            .clear
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    style: StrokeStyle(lineWidth: index == 0 ? 1.6 : 1.0, lineCap: .round)
                )
                .blur(radius: CGFloat(index) * 0.3)
            }

            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.30),
                            BenyuanColor.planetEdge.opacity(0.30),
                            BenyuanColor.aubergineBlack.opacity(0.76),
                            BenyuanColor.bgVoid
                        ],
                        center: UnitPoint(x: 0.36 + pulse * 0.03, y: 0.26),
                        startRadius: 2,
                        endRadius: size * 0.50
                    )
                )
                .frame(width: size * 0.76, height: size * 0.76)
                .offset(y: -size * 0.10)
                .overlay(
                    Circle()
                        .fill(BenyuanColor.bgVoid.opacity(0.66))
                        .frame(width: size * 0.46, height: size * 0.46)
                        .blur(radius: size * 0.024)
                        .offset(x: -size * 0.08, y: -size * 0.06)
                )
                .shadow(color: BenyuanColor.accentGold.opacity(0.12 + pulse * 0.04), radius: size * 0.16)

            Ellipse()
                .stroke(BenyuanColor.accentGold.opacity(0.20 + progress * 0.08), lineWidth: 1.2)
                .frame(width: size * 1.26, height: size * 0.34)
                .rotationEffect(.degrees(-7 + phase * 1.4))
                .offset(y: size * 0.14)
                .blendMode(.screen)
        }
    }
}

struct BenyuanStarMapArchitectCore: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    private let nodes: [(CGFloat, CGFloat)] = [
        (-0.36, -0.22), (-0.12, -0.34), (0.22, -0.24), (0.38, 0.02),
        (0.18, 0.30), (-0.20, 0.26), (-0.42, 0.02), (0.0, 0.0)
    ]

    var body: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { index in
                RoundedRectangle(cornerRadius: size * 0.04, style: .continuous)
                    .stroke(
                        BenyuanColor.textPrimary.opacity(0.045 + Double(index) * 0.018),
                        style: StrokeStyle(lineWidth: 0.8, dash: index.isMultiple(of: 2) ? [3, 12] : [])
                    )
                    .frame(width: size * (0.54 + CGFloat(index) * 0.20), height: size * (0.36 + CGFloat(index) * 0.14))
                    .rotationEffect(.degrees(-18 + Double(index) * 14 + phase * (0.28 + Double(index) * 0.08)))
                    .blendMode(.screen)
            }

            Path { path in
                guard let first = nodes.first else { return }
                path.move(to: CGPoint(x: first.0 * size, y: first.1 * size))
                for node in nodes.dropFirst() {
                    path.addLine(to: CGPoint(x: node.0 * size, y: node.1 * size))
                }
                path.closeSubpath()
                path.move(to: CGPoint(x: 0, y: 0))
                for node in nodes.prefix(7) {
                    path.addLine(to: CGPoint(x: node.0 * size, y: node.1 * size))
                    path.move(to: CGPoint(x: 0, y: 0))
                }
            }
            .stroke(BenyuanColor.accentGold.opacity(0.18 + progress * 0.10), style: StrokeStyle(lineWidth: 1.2, lineCap: .round, lineJoin: .round))
            .rotationEffect(.degrees(sin(phase * 0.22) * 2.6))

            ForEach(nodes.indices, id: \.self) { index in
                let node = nodes[index]
                Circle()
                    .fill(index == nodes.count - 1 ? BenyuanColor.accentGold.opacity(0.88) : BenyuanColor.textPrimary.opacity(0.42))
                    .frame(width: index == nodes.count - 1 ? size * 0.050 : size * 0.028, height: index == nodes.count - 1 ? size * 0.050 : size * 0.028)
                    .offset(x: node.0 * size, y: node.1 * size)
                    .shadow(color: BenyuanColor.accentGold.opacity(index == nodes.count - 1 ? 0.28 : 0.12), radius: 8)
            }

            Circle()
                .stroke(BenyuanColor.textPrimary.opacity(0.08 + pulse * 0.03), lineWidth: 1)
                .frame(width: size * 0.34, height: size * 0.34)
                .blur(radius: 0.4)
        }
        .frame(width: size * 1.22, height: size * 1.04)
    }
}

struct BenyuanMoonHarborCore: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.22),
                            BenyuanColor.planetEdge.opacity(0.24),
                            BenyuanColor.bgVoid.opacity(0.92)
                        ],
                        center: UnitPoint(x: 0.34, y: 0.24),
                        startRadius: 2,
                        endRadius: size * 0.44
                    )
                )
                .frame(width: size * 0.62, height: size * 0.62)
                .offset(x: -size * 0.18, y: -size * 0.26)
                .overlay(
                    Circle()
                        .fill(BenyuanColor.bgVoid.opacity(0.62))
                        .frame(width: size * 0.42, height: size * 0.42)
                        .blur(radius: size * 0.018)
                        .offset(x: -size * 0.25, y: -size * 0.28)
                )

            ForEach(0..<5, id: \.self) { index in
                let y = size * (0.06 + CGFloat(index) * 0.065)
                let wave = CGFloat(sin(phase * 0.26 + Double(index))) * 3
                let controlY = y + size * (0.035 + CGFloat(index) * 0.006)
                let start = CGPoint(x: -size * 0.62, y: y)
                let end = CGPoint(x: size * 0.62, y: y + wave)
                let control = CGPoint(x: 0, y: controlY)
                let opacity = 0.07 + Double(index) * 0.018 + progress * 0.02
                let lineWidth: CGFloat = index == 2 ? 1.4 : 0.9
                Path { path in
                    path.move(to: start)
                    path.addQuadCurve(to: end, control: control)
                }
                .stroke(
                    BenyuanColor.textPrimary.opacity(opacity),
                    style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                )
            }

            Path { path in
                path.move(to: CGPoint(x: -size * 0.44, y: size * 0.16))
                path.addLine(to: CGPoint(x: size * 0.22, y: size * 0.16))
                path.move(to: CGPoint(x: -size * 0.24, y: size * 0.16))
                path.addLine(to: CGPoint(x: -size * 0.24, y: size * 0.38))
                path.move(to: CGPoint(x: size * 0.03, y: size * 0.16))
                path.addLine(to: CGPoint(x: size * 0.03, y: size * 0.34))
            }
            .stroke(BenyuanColor.accentGold.opacity(0.34 + progress * 0.10), style: StrokeStyle(lineWidth: 1.5, lineCap: .round))
            .shadow(color: BenyuanColor.accentGold.opacity(0.22), radius: 10)

            Circle()
                .fill(BenyuanColor.accentGold.opacity(0.80 + pulse * 0.10))
                .frame(width: size * 0.048, height: size * 0.048)
                .offset(x: size * 0.28, y: size * 0.09)
                .shadow(color: BenyuanColor.accentGold.opacity(0.42), radius: 14)
        }
    }
}

struct BenyuanExistentialNomadCore: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                Path { path in
                    path.move(to: CGPoint(x: -size * 0.62, y: size * (0.20 + CGFloat(index) * 0.08)))
                    path.addCurve(
                        to: CGPoint(x: size * 0.60, y: size * (-0.20 + CGFloat(index) * 0.11)),
                        control1: CGPoint(x: -size * 0.20, y: size * (0.10 - CGFloat(index) * 0.02)),
                        control2: CGPoint(x: size * 0.12, y: size * (-0.34 + CGFloat(index) * 0.08))
                    )
                }
                .stroke(
                    LinearGradient(
                        colors: [
                            .clear,
                            BenyuanColor.textPrimary.opacity(0.10 + Double(index) * 0.025),
                            BenyuanColor.accentGold.opacity(0.18 + progress * 0.06),
                            .clear
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    style: StrokeStyle(lineWidth: index == 1 ? 1.6 : 1, lineCap: .round, dash: index == 0 ? [4, 14] : [])
                )
                .rotationEffect(.degrees(sin(phase * 0.20 + Double(index)) * 3))
            }

            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.planetEdge.opacity(0.22 + pulse * 0.04),
                            BenyuanColor.aubergineBlack.opacity(0.44),
                            .clear
                        ],
                        center: .center,
                        startRadius: 2,
                        endRadius: size * 0.42
                    )
                )
                .frame(width: size * 0.96, height: size * 0.38)
                .rotationEffect(.degrees(-9 + phase * 0.8))
                .blur(radius: 2)

            ForEach(0..<6, id: \.self) { index in
                let angle = Double(index) / 6 * .pi * 2 + phase * 0.10
                Circle()
                    .fill(index == 0 ? BenyuanColor.accentGold.opacity(0.70) : BenyuanColor.textPrimary.opacity(0.22))
                    .frame(width: index == 0 ? 5 : 2.6, height: index == 0 ? 5 : 2.6)
                    .offset(x: cos(angle) * size * (0.34 + CGFloat(index % 2) * 0.08), y: sin(angle) * size * 0.18)
            }
        }
    }
}

struct BenyuanRainWindowScribeCore: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.08, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.055),
                            BenyuanColor.lunarBlueDeep.opacity(0.30),
                            BenyuanColor.bgVoid.opacity(0.82)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: size * 0.98, height: size * 0.72)
                .overlay(
                    RoundedRectangle(cornerRadius: size * 0.08, style: .continuous)
                        .stroke(BenyuanColor.textPrimary.opacity(0.09 + progress * 0.04), lineWidth: 1)
                )

            ForEach(0..<13, id: \.self) { index in
                let x = size * (-0.42 + CGFloat(index) * 0.07)
                let fall = CGFloat((phase * (0.045 + Double(index % 4) * 0.008) + Double(index) * 0.17).truncatingRemainder(dividingBy: 1))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [
                                BenyuanColor.textPrimary.opacity(0.02),
                                BenyuanColor.textPrimary.opacity(0.18 + progress * 0.05),
                                .clear
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(width: 1.2, height: size * (0.16 + CGFloat(index % 3) * 0.038))
                    .offset(x: x + CGFloat(sin(phase * 0.28 + Double(index))) * 2, y: -size * 0.32 + fall * size * 0.72)
                    .blur(radius: 0.25)
            }

            Path { path in
                path.move(to: CGPoint(x: -size * 0.30, y: size * 0.23))
                path.addCurve(
                    to: CGPoint(x: size * 0.34, y: size * 0.18),
                    control1: CGPoint(x: -size * 0.12, y: size * 0.11),
                    control2: CGPoint(x: size * 0.12, y: size * 0.28)
                )
            }
            .stroke(BenyuanColor.accentGold.opacity(0.30 + pulse * 0.06), style: StrokeStyle(lineWidth: 1.2, lineCap: .round))

            Circle()
                .fill(BenyuanColor.accentGold.opacity(0.28 + pulse * 0.12))
                .frame(width: size * 0.08, height: size * 0.08)
                .offset(x: size * 0.20, y: size * 0.18)
                .blur(radius: 3)
        }
    }
}

struct BenyuanNebulaThreadField: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    var body: some View {
        ZStack {
            ForEach(0..<7, id: \.self) { index in
                Path { path in
                    let startY = size * (-0.30 + CGFloat(index) * 0.10)
                    path.move(to: CGPoint(x: -size * 0.62, y: startY))
                    path.addCurve(
                        to: CGPoint(x: size * 0.62, y: -startY * 0.55),
                        control1: CGPoint(x: -size * 0.20, y: startY + CGFloat(sin(phase * 0.20 + Double(index))) * size * 0.10),
                        control2: CGPoint(x: size * 0.18, y: -startY + CGFloat(cos(phase * 0.18 + Double(index))) * size * 0.12)
                    )
                }
                .stroke(
                    index.isMultiple(of: 2) ? BenyuanColor.nebulaViolet.opacity(0.18 + progress * 0.06) : BenyuanColor.textPrimary.opacity(0.10 + progress * 0.04),
                    style: StrokeStyle(lineWidth: index == 3 ? 1.5 : 0.9, lineCap: .round, dash: index == 5 ? [2, 12] : [])
                )
                .blur(radius: CGFloat(index % 3) * 0.45)
                .blendMode(.screen)
            }
        }
    }
}

struct BenyuanOpenNebulaBloom: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        let clamped = min(max(progress, 0.04), 1)

        ZStack {
            ForEach(0..<8, id: \.self) { index in
                let drift = sin(phase * (0.10 + Double(index) * 0.018) + Double(index) * 0.7)
                let vertical = cos(phase * (0.08 + Double(index) * 0.014) + Double(index))
                Ellipse()
                    .fill(
                        RadialGradient(
                            colors: [
                                (index.isMultiple(of: 3) ? BenyuanColor.textPrimary : BenyuanColor.nebulaViolet).opacity(0.10 + clamped * 0.08),
                                BenyuanColor.planetEdge.opacity(0.06 + pulse * 0.03),
                                .clear
                            ],
                            center: UnitPoint(x: 0.42 + drift * 0.10, y: 0.45 + vertical * 0.06),
                            startRadius: 1,
                            endRadius: size * (0.30 + CGFloat(index % 4) * 0.08)
                        )
                    )
                    .frame(
                        width: size * (0.90 + CGFloat(index % 4) * 0.24),
                        height: size * (0.22 + CGFloat(index % 5) * 0.08)
                    )
                    .offset(
                        x: size * (-0.18 + CGFloat(index % 4) * 0.12) + CGFloat(drift) * size * 0.06,
                        y: size * (-0.16 + CGFloat(index / 4) * 0.28) + CGFloat(vertical) * size * 0.05
                    )
                    .rotationEffect(.degrees(-24 + Double(index) * 18 + phase * (0.9 + Double(index) * 0.12)))
                    .blur(radius: 8 + CGFloat(index % 3) * 3)
                    .blendMode(.screen)
            }

            ForEach(0..<18, id: \.self) { index in
                let angle = Double(index) * .pi * 2 / 18 + phase * 0.06
                let radius = size * (0.22 + CGFloat(index % 6) * 0.055)
                Circle()
                    .fill(index.isMultiple(of: 5) ? BenyuanColor.accentGold.opacity(0.42) : BenyuanColor.textPrimary.opacity(0.16))
                    .frame(width: index.isMultiple(of: 5) ? 3.8 : 2.2, height: index.isMultiple(of: 5) ? 3.8 : 2.2)
                    .offset(
                        x: cos(angle) * radius,
                        y: sin(angle * 0.82) * radius * 0.58
                    )
                    .blur(radius: index.isMultiple(of: 5) ? 0.1 : 0.7)
                    .blendMode(.screen)
            }

            Circle()
                .fill(BenyuanColor.textPrimary.opacity(0.08 + pulse * 0.03))
                .frame(width: size * 0.12, height: size * 0.12)
                .blur(radius: 7)
                .blendMode(.screen)
        }
        .frame(width: size * 1.78, height: size * 1.26)
        .shadow(color: BenyuanColor.nebulaViolet.opacity(0.26 + pulse * 0.06), radius: size * 0.22)
    }
}

struct BenyuanSolarCoronaCore: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<12, id: \.self) { index in
                let angle = Double(index) / 12 * .pi * 2 + phase * 0.18
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [
                                BenyuanColor.accentGold.opacity(0.32 + progress * 0.18),
                                BenyuanColor.textPrimary.opacity(0.10),
                                .clear
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: size * (0.36 + pulse * 0.04), height: 2.2)
                    .offset(x: cos(angle) * size * 0.43, y: sin(angle) * size * 0.43)
                    .rotationEffect(.radians(angle))
                    .blur(radius: index.isMultiple(of: 3) ? 0.2 : 1.0)
                    .blendMode(.screen)
            }

            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.18),
                            BenyuanColor.accentGold.opacity(0.44 + pulse * 0.10),
                            BenyuanColor.aubergineBlack.opacity(0.76),
                            BenyuanColor.bgVoid
                        ],
                        center: UnitPoint(x: 0.46, y: 0.42),
                        startRadius: 2,
                        endRadius: size * 0.54
                    )
                )
                .frame(width: size * 0.86, height: size * 0.86)
                .overlay(Circle().stroke(BenyuanColor.accentGold.opacity(0.18 + progress * 0.10), lineWidth: 1))
                .shadow(color: BenyuanColor.accentGold.opacity(0.24 + pulse * 0.12), radius: size * 0.22)

            Circle()
                .fill(BenyuanColor.bgVoid.opacity(0.72))
                .frame(width: size * 0.46, height: size * 0.46)
                .blur(radius: size * 0.018)
        }
    }
}

struct BenyuanSolarFlareField: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        let clamped = min(max(progress, 0.04), 1)

        ZStack {
            Circle()
                .stroke(BenyuanColor.accentGold.opacity(0.10 + clamped * 0.06), lineWidth: 1)
                .frame(width: size * 1.28, height: size * 1.28)
                .blur(radius: 1.2)
                .blendMode(.screen)

            ForEach(0..<20, id: \.self) { index in
                let angle = Double(index) / 20 * .pi * 2 + phase * (0.10 + Double(index % 4) * 0.014)
                let length = size * (0.20 + CGFloat(index % 5) * 0.038 + pulse * 0.035)
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [
                                BenyuanColor.accentGold.opacity(0.42 + clamped * 0.18),
                                BenyuanColor.textPrimary.opacity(0.22),
                                .clear
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: length, height: index.isMultiple(of: 4) ? 2.8 : 1.6)
                    .offset(x: cos(angle) * size * 0.56, y: sin(angle) * size * 0.56)
                    .rotationEffect(.radians(angle))
                    .blur(radius: index.isMultiple(of: 4) ? 0.15 : 0.9)
                    .blendMode(.screen)
            }

            ForEach(0..<10, id: \.self) { index in
                let angle = Double(index) / 10 * .pi * 2 - phase * 0.16
                Circle()
                    .fill(BenyuanColor.accentGold.opacity(0.20 + clamped * 0.20))
                    .frame(width: 3.4, height: 3.4)
                    .offset(x: cos(angle) * size * 0.74, y: sin(angle) * size * 0.74)
                    .blur(radius: 0.4)
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanGasGiantCore: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.22),
                            BenyuanColor.planetEdge.opacity(0.36),
                            BenyuanColor.nebulaViolet.opacity(0.46),
                            BenyuanColor.bgVoid.opacity(0.92)
                        ],
                        center: UnitPoint(x: 0.38 + pulse * 0.03, y: 0.30),
                        startRadius: 2,
                        endRadius: size * 0.62
                    )
                )
                .frame(width: size * 0.94, height: size * 0.94)
                .overlay(Circle().stroke(BenyuanColor.textPrimary.opacity(0.07 + progress * 0.04), lineWidth: 1))

            ForEach(0..<6, id: \.self) { index in
                let y = CGFloat(index - 2) * size * 0.085 + CGFloat(sin(phase * 0.24 + Double(index))) * 2
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [
                                .clear,
                                (index.isMultiple(of: 2) ? BenyuanColor.accentGold : BenyuanColor.textPrimary).opacity(0.12 + Double(index) * 0.018),
                                BenyuanColor.nebulaViolet.opacity(0.10),
                                .clear
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: size * (0.66 - CGFloat(abs(index - 3)) * 0.035), height: size * 0.030)
                    .offset(x: CGFloat(sin(phase * 0.18 + Double(index))) * size * 0.030, y: y)
                    .blur(radius: 0.4)
                    .mask(Circle().frame(width: size * 0.94, height: size * 0.94))
            }

            Ellipse()
                .fill(BenyuanColor.bgVoid.opacity(0.40))
                .frame(width: size * 0.20, height: size * 0.10)
                .overlay(Ellipse().stroke(BenyuanColor.accentGold.opacity(0.18), lineWidth: 1))
                .offset(x: size * 0.18, y: size * 0.03)
                .rotationEffect(.degrees(-12 + phase * 1.4))
        }
        .shadow(color: BenyuanColor.planetEdge.opacity(0.18 + pulse * 0.06), radius: size * 0.18)
    }
}

struct BenyuanTerrestrialCore: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.24),
                            BenyuanColor.planetEdge.opacity(0.30),
                            BenyuanColor.aubergineBlack.opacity(0.72),
                            BenyuanColor.bgVoid
                        ],
                        center: UnitPoint(x: 0.34 + pulse * 0.03, y: 0.24),
                        startRadius: 2,
                        endRadius: size * 0.62
                    )
                )
                .frame(width: size * 0.90, height: size * 0.90)
                .overlay(Circle().stroke(BenyuanColor.textPrimary.opacity(0.08 + progress * 0.04), lineWidth: 1))

            ForEach(0..<4, id: \.self) { index in
                RoundedRectangle(cornerRadius: size * 0.06, style: .continuous)
                    .fill((index.isMultiple(of: 2) ? BenyuanColor.accentGold : BenyuanColor.textPrimary).opacity(0.10 + progress * 0.08))
                    .frame(width: size * (0.24 + CGFloat(index) * 0.045), height: size * 0.06)
                    .offset(
                        x: CGFloat(cos(phase * 0.18 + Double(index))) * size * 0.18,
                        y: CGFloat(index - 2) * size * 0.10
                    )
                    .rotationEffect(.degrees(-18 + Double(index) * 22))
                    .blur(radius: 0.5)
                    .mask(Circle().frame(width: size * 0.90, height: size * 0.90))
            }

            ForEach(0..<5, id: \.self) { index in
                Circle()
                    .fill(BenyuanColor.accentGold.opacity(0.22 + progress * 0.16))
                    .frame(width: 3, height: 3)
                    .offset(
                        x: CGFloat(cos(Double(index) * 1.4 + phase * 0.12)) * size * 0.25,
                        y: CGFloat(sin(Double(index) * 1.1 + phase * 0.10)) * size * 0.22
                    )
                    .blur(radius: 0.2)
            }
        }
        .shadow(color: BenyuanColor.accentGold.opacity(0.10 + pulse * 0.04), radius: size * 0.14)
    }
}

struct BenyuanTerrestrialAtmosphere: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    var body: some View {
        let clamped = min(max(progress, 0.04), 1)

        ZStack {
            ForEach(0..<4, id: \.self) { index in
                Ellipse()
                    .stroke(
                        LinearGradient(
                            colors: [
                                .clear,
                                BenyuanColor.textPrimary.opacity(0.08 + clamped * 0.04),
                                BenyuanColor.accentGold.opacity(0.08 + clamped * 0.05),
                                .clear
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        style: StrokeStyle(lineWidth: index == 0 ? 1.4 : 0.9, lineCap: .round, dash: index == 3 ? [2, 14] : [])
                    )
                    .frame(width: size * (1.10 + CGFloat(index) * 0.16), height: size * (0.18 + CGFloat(index) * 0.045))
                    .rotationEffect(.degrees(-28 + Double(index) * 16 + phase * (0.9 + Double(index) * 0.26)))
                    .offset(y: CGFloat(index - 2) * size * 0.018)
                    .blur(radius: index > 1 ? 0.5 : 0.1)
                    .blendMode(.screen)
            }

            ForEach(0..<5, id: \.self) { index in
                RoundedRectangle(cornerRadius: 3, style: .continuous)
                    .fill(BenyuanColor.accentGold.opacity(0.18 + clamped * 0.12))
                    .frame(width: size * (0.030 + CGFloat(index % 2) * 0.012), height: size * (0.010 + CGFloat(index % 3) * 0.006))
                    .offset(
                        x: size * (-0.28 + CGFloat(index) * 0.14),
                        y: size * (0.28 + CGFloat(sin(phase * 0.16 + Double(index))) * 0.025)
                    )
                    .blur(radius: 0.35)
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanDeepSpaceAnchorCore: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double
    var pulse: Double
    var showAnchorGlyph: Bool = true

    var body: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { index in
                BenyuanAnchorCoordinateCross(
                    size: size,
                    index: index,
                    phase: phase
                )
            }

            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.10),
                            BenyuanColor.lunarBlueDeep.opacity(0.46),
                            BenyuanColor.bgVoid.opacity(0.98)
                        ],
                        center: UnitPoint(x: 0.42, y: 0.34),
                        startRadius: 2,
                        endRadius: size * 0.48
                    )
                )
                .frame(width: size * 0.54, height: size * 0.54)
                .overlay(Circle().stroke(BenyuanColor.textPrimary.opacity(0.08 + progress * 0.04), lineWidth: 1))
                .shadow(color: BenyuanColor.textPrimary.opacity(0.08 + pulse * 0.04), radius: size * 0.12)

            ForEach(0..<7, id: \.self) { index in
                let angle = Double(index) / 7 * .pi * 2 + phase * 0.08
                Circle()
                    .fill(index.isMultiple(of: 3) ? BenyuanColor.accentGold.opacity(0.46) : BenyuanColor.textPrimary.opacity(0.22))
                    .frame(width: index.isMultiple(of: 3) ? 3.4 : 2.2, height: index.isMultiple(of: 3) ? 3.4 : 2.2)
                    .offset(x: cos(angle) * size * 0.62, y: sin(angle) * size * 0.16)
                    .blur(radius: index.isMultiple(of: 3) ? 0.2 : 0.6)
            }

            if showAnchorGlyph {
                BenyuanAnchorGlyph(size: size, progress: progress)
                    .scaleEffect(0.96 + pulse * 0.025)
            }
        }
    }
}

struct BenyuanAnchorGlyph: View {
    var size: CGFloat
    var progress: Double

    var body: some View {
        Path { path in
            path.move(to: CGPoint(x: 0, y: -size * 0.28))
            path.addLine(to: CGPoint(x: 0, y: size * 0.30))
            path.move(to: CGPoint(x: -size * 0.12, y: size * 0.16))
            path.addQuadCurve(
                to: CGPoint(x: size * 0.12, y: size * 0.16),
                control: CGPoint(x: 0, y: size * 0.34)
            )
            path.move(to: CGPoint(x: -size * 0.18, y: -size * 0.02))
            path.addLine(to: CGPoint(x: size * 0.18, y: -size * 0.02))
        }
        .stroke(BenyuanColor.accentGold.opacity(0.26 + progress * 0.10), style: StrokeStyle(lineWidth: 1.4, lineCap: .round))
        .blendMode(.screen)
    }
}

struct BenyuanAnchorCoordinateField: View {
    var size: CGFloat
    var phase: TimeInterval
    var progress: Double

    var body: some View {
        ZStack {
            ForEach(0..<5, id: \.self) { index in
                BenyuanAnchorCoordinateCross(
                    size: size * (0.78 + CGFloat(index) * 0.09),
                    index: index,
                    phase: phase
                )
                .opacity(0.72)
            }

            ForEach(0..<9, id: \.self) { index in
                let angle = Double(index) / 9 * .pi * 2 + phase * (0.05 + Double(index % 3) * 0.006)
                Circle()
                    .fill(index.isMultiple(of: 3) ? BenyuanColor.accentGold.opacity(0.42) : BenyuanColor.textPrimary.opacity(0.16))
                    .frame(width: index.isMultiple(of: 3) ? 3.6 : 2.2, height: index.isMultiple(of: 3) ? 3.6 : 2.2)
                    .offset(x: cos(angle) * size * 0.62, y: sin(angle) * size * 0.34)
                    .blur(radius: index.isMultiple(of: 3) ? 0.2 : 0.8)
            }
        }
    }
}

struct BenyuanAnchorCoordinateCross: View {
    var size: CGFloat
    var index: Int
    var phase: TimeInterval

    var body: some View {
        let indexValue = CGFloat(index)
        let extent = size * (0.28 + indexValue * 0.08)
        let opacity = 0.030 + Double(index) * 0.012
        let dash: [CGFloat] = index == 3 ? [2, 12] : []
        let rotation = 45 + Double(index) * 10 + phase * (0.24 + Double(index) * 0.08)

        return Path { path in
            path.move(to: CGPoint(x: 0, y: -extent))
            path.addLine(to: CGPoint(x: 0, y: extent))
            path.move(to: CGPoint(x: -extent, y: 0))
            path.addLine(to: CGPoint(x: extent, y: 0))
        }
        .stroke(
            BenyuanColor.textPrimary.opacity(opacity),
            style: StrokeStyle(lineWidth: 0.8, lineCap: .round, dash: dash)
        )
        .rotationEffect(.degrees(rotation))
        .blendMode(.screen)
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
