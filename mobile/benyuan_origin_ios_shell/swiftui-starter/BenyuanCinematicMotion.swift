import SwiftUI

enum BenyuanCinematicTransitionStyle: Equatable {
    case drift
    case passage
    case emergence
    case descent

    var duration: TimeInterval {
        switch self {
        case .drift: return 0.72
        case .passage: return 1.12
        case .emergence: return 1.42
        case .descent: return 1.28
        }
    }

    var velocity: Double {
        switch self {
        case .drift: return 0.42
        case .passage: return 2.8
        case .emergence: return 1.45
        case .descent: return 2.10
        }
    }
}

struct BenyuanCinematicSpaceField: View {
    var progress: Double
    var intensity: Double = 1
    var velocity: Double = 0.28
    var focalPoint = UnitPoint(x: 0.52, y: 0.43)
    var preferredFramesPerSecond: Double = 24

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: preferredFramesPerSecond) { phase in
            GeometryReader { proxy in
                let width = max(proxy.size.width, 1)
                let height = max(proxy.size.height, 1)
                let clampedProgress = min(max(progress, 0), 1)
                let activeVelocity = accessibilityReduceMotion ? 0 : velocity
                let breath = accessibilityReduceMotion ? 0.5 : 0.5 + 0.5 * sin(phase * 0.16)
                let focal = CGPoint(x: width * focalPoint.x, y: height * focalPoint.y)

                ZStack {
                    Image("BenyuanCinematicTransitBackdrop")
                        .resizable()
                        .interpolation(.high)
                        .antialiased(true)
                        .scaledToFill()
                        .frame(width: width, height: height)
                        .scaleEffect(1.08 + CGFloat(clampedProgress) * 0.045 + CGFloat(breath) * 0.012)
                        .offset(
                            x: accessibilityReduceMotion ? 0 : CGFloat(sin(phase * 0.035)) * width * 0.012,
                            y: accessibilityReduceMotion ? 0 : CGFloat(cos(phase * 0.028)) * height * 0.008
                        )
                        .saturation(0.78)
                        .contrast(1.08)
                        .brightness(-0.07)
                        .opacity(0.24 + intensity * 0.42)

                    cinematicParticleCanvas(
                        size: proxy.size,
                        phase: phase,
                        progress: clampedProgress,
                        intensity: intensity,
                        velocity: activeVelocity,
                        focal: focal
                    )

                    RadialGradient(
                        colors: [
                            BenyuanColor.bgVoid.opacity(0.02),
                            BenyuanColor.bgVoid.opacity(0.12),
                            BenyuanColor.bgVoid.opacity(0.78)
                        ],
                        center: focalPoint,
                        startRadius: min(width, height) * 0.06,
                        endRadius: max(width, height) * 0.82
                    )

                    RadialGradient(
                        colors: [
                            BenyuanColor.accentGold.opacity((0.025 + breath * 0.018) * intensity),
                            BenyuanColor.nebulaViolet.opacity(0.028 * intensity),
                            .clear
                        ],
                        center: focalPoint,
                        startRadius: 4,
                        endRadius: min(width, height) * 0.48
                    )
                    .blendMode(.screen)
                }
                .clipped()
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private func cinematicParticleCanvas(
        size: CGSize,
        phase: TimeInterval,
        progress: Double,
        intensity: Double,
        velocity: Double,
        focal: CGPoint
    ) -> some View {
        Canvas(opaque: false, colorMode: .linear, rendersAsynchronously: true) { context, _ in
            drawDistantStars(
                context: &context,
                size: size,
                phase: phase,
                intensity: intensity,
                focal: focal
            )
            drawTransitParticles(
                context: &context,
                size: size,
                phase: phase,
                progress: progress,
                intensity: intensity,
                velocity: velocity,
                focal: focal
            )
        }
        .blendMode(.screen)
    }

    private func drawDistantStars(
        context: inout GraphicsContext,
        size: CGSize,
        phase: TimeInterval,
        intensity: Double,
        focal: CGPoint
    ) {
        for index in 0..<82 {
            let xSeed = cinematicNoise(index * 17 + 3)
            let ySeed = cinematicNoise(index * 29 + 11)
            let twinkle = 0.55 + 0.45 * sin(phase * (0.24 + cinematicNoise(index + 5) * 0.44) + Double(index))
            let distanceFromFocus = hypot(xSeed - focal.x / max(size.width, 1), ySeed - focal.y / max(size.height, 1))
            let alpha = min(0.42, (0.06 + distanceFromFocus * 0.16) * twinkle * intensity)
            let diameter = 0.7 + cinematicNoise(index * 41 + 7) * 1.5
            let rect = CGRect(
                x: xSeed * size.width - diameter / 2,
                y: ySeed * size.height - diameter / 2,
                width: diameter,
                height: diameter
            )
            let color = index.isMultiple(of: 7)
                ? BenyuanColor.accentGold.opacity(alpha)
                : BenyuanColor.textPrimary.opacity(alpha * 0.82)
            context.fill(Path(ellipseIn: rect), with: .color(color))
        }
    }

    private func drawTransitParticles(
        context: inout GraphicsContext,
        size: CGSize,
        phase: TimeInterval,
        progress: Double,
        intensity: Double,
        velocity: Double,
        focal: CGPoint
    ) {
        let speed = max(velocity, 0.015)
        let maximumRadius = hypot(size.width, size.height) * 0.68

        for index in 0..<58 {
            let seed = cinematicNoise(index * 37 + 19)
            let cycleSpeed = 0.035 + cinematicNoise(index * 13 + 2) * 0.055
            let cycle = positiveRemainder(phase * cycleSpeed * speed + seed + progress * 0.18)
            let depth = pow(cycle, 1.72)
            let previousDepth = pow(max(0, cycle - (0.008 + speed * 0.012)), 1.72)
            let angle = cinematicNoise(index * 23 + 5) * .pi * 2 + sin(phase * 0.025 + Double(index)) * 0.025
            let aspectWarp = 0.72 + cinematicNoise(index * 31 + 17) * 0.58
            let radius = maximumRadius * (0.018 + depth * 0.98)
            let previousRadius = maximumRadius * (0.018 + previousDepth * 0.98)
            let point = CGPoint(
                x: focal.x + cos(angle) * radius,
                y: focal.y + sin(angle) * radius * aspectWarp
            )
            let tail = CGPoint(
                x: focal.x + cos(angle) * previousRadius,
                y: focal.y + sin(angle) * previousRadius * aspectWarp
            )

            guard point.x > -80, point.x < size.width + 80, point.y > -80, point.y < size.height + 80 else { continue }

            var path = Path()
            path.move(to: tail)
            path.addLine(to: point)

            let depthAlpha = min(0.72, (0.05 + depth * 0.66) * intensity)
            let leadingColor = index.isMultiple(of: 5)
                ? BenyuanColor.accentGold.opacity(depthAlpha)
                : BenyuanColor.textPrimary.opacity(depthAlpha * 0.74)
            context.stroke(
                path,
                with: .linearGradient(
                    Gradient(colors: [.clear, leadingColor]),
                    startPoint: tail,
                    endPoint: point
                ),
                style: StrokeStyle(lineWidth: 0.45 + depth * 2.1, lineCap: .round)
            )

            if depth > 0.66, index.isMultiple(of: 4) {
                let bloomSize = 1.2 + depth * 3.6
                let bloomRect = CGRect(
                    x: point.x - bloomSize / 2,
                    y: point.y - bloomSize / 2,
                    width: bloomSize,
                    height: bloomSize
                )
                context.fill(Path(ellipseIn: bloomRect), with: .color(leadingColor.opacity(0.68)))
            }
        }
    }
}

struct BenyuanAccretionParticleField: View {
    var progress: Double
    var intensity: Double = 1
    var focalPoint = UnitPoint.center
    var verticalCompression: CGFloat = 0.38
    var particleCount: Int = 84
    var preferredFramesPerSecond: Double = 30

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: preferredFramesPerSecond) { phase in
            GeometryReader { proxy in
                let width = max(proxy.size.width, 1)
                let height = max(proxy.size.height, 1)
                let focal = CGPoint(x: width * focalPoint.x, y: height * focalPoint.y)

                Canvas(opaque: false, colorMode: .linear, rendersAsynchronously: true) { context, _ in
                    drawParticles(
                        context: &context,
                        size: proxy.size,
                        focal: focal,
                        phase: phase,
                        progress: min(max(progress, 0.04), 1)
                    )
                }
                .blendMode(.screen)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private func drawParticles(
        context: inout GraphicsContext,
        size: CGSize,
        focal: CGPoint,
        phase: TimeInterval,
        progress: Double
    ) {
        let maximumRadius = hypot(size.width, size.height) * 0.52
        let flowSpeed = 0.72 + progress * 0.86

        for index in 0..<particleCount {
            let seed = cinematicNoise(index * 43 + 17)
            let angularSeed = cinematicNoise(index * 31 + 7) * .pi * 2
            let radialSpeed = (0.036 + cinematicNoise(index * 19 + 11) * 0.042) * flowSpeed
            let cycle = positiveRemainder(seed - phase * radialSpeed)
            let previousCycle = min(0.999, cycle + 0.018 + radialSpeed * 0.12)
            let radius = maximumRadius * (0.075 + pow(cycle, 1.30) * 0.94)
            let previousRadius = maximumRadius * (0.075 + pow(previousCycle, 1.30) * 0.94)
            let angularSpeed = 0.42 + cinematicNoise(index * 13 + 5) * 0.56
            let spiral = pow(1 - cycle, 1.72) * (7.0 + cinematicNoise(index * 29 + 3) * 4.2)
            let previousSpiral = pow(1 - previousCycle, 1.72) * (7.0 + cinematicNoise(index * 29 + 3) * 4.2)
            let angle = angularSeed + phase * angularSpeed + spiral
            let previousAngle = angularSeed + (phase - 1 / preferredFramesPerSecond) * angularSpeed + previousSpiral
            let lane = 0.78 + cinematicNoise(index * 37 + 23) * 0.42
            let point = CGPoint(
                x: focal.x + CGFloat(cos(angle)) * radius,
                y: focal.y + CGFloat(sin(angle)) * radius * verticalCompression * lane
            )
            let tail = CGPoint(
                x: focal.x + CGFloat(cos(previousAngle)) * previousRadius,
                y: focal.y + CGFloat(sin(previousAngle)) * previousRadius * verticalCompression * lane
            )

            guard point.x > -40, point.x < size.width + 40, point.y > -40, point.y < size.height + 40 else { continue }

            let absorption = min(1, max(0, cycle / 0.12))
            let heat = pow(1 - cycle, 1.18)
            let alpha = min(0.88, (0.08 + heat * 0.72) * absorption * intensity)
            let color = index.isMultiple(of: 5)
                ? BenyuanColor.textPrimary.opacity(alpha)
                : index.isMultiple(of: 3)
                    ? BenyuanColor.accentGold.opacity(alpha * 0.92)
                    : BenyuanColor.planetEdge.opacity(alpha * 0.58)

            var trail = Path()
            trail.move(to: tail)
            trail.addLine(to: point)
            context.stroke(
                trail,
                with: .linearGradient(
                    Gradient(colors: [.clear, color]),
                    startPoint: tail,
                    endPoint: point
                ),
                style: StrokeStyle(lineWidth: 0.35 + heat * 1.75, lineCap: .round)
            )

            if heat > 0.30 || index.isMultiple(of: 7) {
                let diameter = 0.8 + heat * 3.2 + cinematicNoise(index * 53 + 2) * 1.1
                context.fill(
                    Path(ellipseIn: CGRect(x: point.x - diameter / 2, y: point.y - diameter / 2, width: diameter, height: diameter)),
                    with: .color(color.opacity(0.82))
                )
            }
        }
    }
}

struct BenyuanDepthEmergenceField: View {
    var reveal: Double

    var body: some View {
        let clamped = min(max(reveal, 0), 1)

        ZStack {
            BenyuanCinematicSpaceField(
                progress: clamped,
                intensity: 0.30 + (1 - clamped) * 0.46,
                velocity: 0.10 + (1 - clamped) * 1.12,
                focalPoint: UnitPoint(x: 0.50, y: 0.35),
                preferredFramesPerSecond: 24
            )
            .scaleEffect(1.04 + (1 - clamped) * 0.14)

            BenyuanAccretionParticleField(
                progress: 0.32 + clamped * 0.28,
                intensity: 0.16 + (1 - clamped) * 0.44,
                focalPoint: UnitPoint(x: 0.50, y: 0.35),
                verticalCompression: 0.72,
                particleCount: 46,
                preferredFramesPerSecond: 24
            )

            RadialGradient(
                colors: [
                    .clear,
                    BenyuanColor.bgVoid.opacity(0.12 + clamped * 0.08),
                    BenyuanColor.bgVoid.opacity(0.78)
                ],
                center: UnitPoint(x: 0.50, y: 0.35),
                startRadius: 54 + CGFloat(clamped) * 48,
                endRadius: 520
            )
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

struct BenyuanCinematicStageTransition: View {
    var token: UUID
    var style: BenyuanCinematicTransitionStyle

    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion
    @State private var startDate = Date()

    var body: some View {
        if !accessibilityReduceMotion {
            BenyuanMotionTimeline(preferredFramesPerSecond: 30) { phase in
                let elapsed = max(0, phase - startDate.timeIntervalSinceReferenceDate)
                let normalized = min(elapsed / style.duration, 1)
                let envelope = pow(sin(normalized * .pi), 0.78)

                ZStack {
                    BenyuanCinematicSpaceField(
                        progress: normalized,
                        intensity: 0.42 + envelope * 0.88,
                        velocity: style.velocity,
                        focalPoint: UnitPoint(x: 0.52, y: style == .emergence || style == .descent ? 0.38 : 0.44),
                        preferredFramesPerSecond: 30
                    )
                    .scaleEffect(
                        style == .descent
                            ? 1.18 - CGFloat(normalized) * 0.14
                            : 1.02 + CGFloat(normalized) * (style == .passage ? 0.18 : 0.08)
                    )

                    if style == .descent {
                        BenyuanAccretionParticleField(
                            progress: normalized,
                            intensity: 0.66,
                            focalPoint: UnitPoint(x: 0.52, y: 0.38),
                            verticalCompression: 0.76,
                            particleCount: 72,
                            preferredFramesPerSecond: 30
                        )
                    }

                    Color.black.opacity(style == .descent ? 0.08 + normalized * 0.12 : max(0, 0.34 - envelope * 0.22))

                    RadialGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(envelope * 0.10),
                            BenyuanColor.accentGold.opacity(envelope * 0.07),
                            .clear
                        ],
                        center: UnitPoint(x: 0.52, y: 0.42),
                        startRadius: 2,
                        endRadius: 280 + normalized * 240
                    )
                    .blendMode(.screen)
                }
                .opacity(style == .descent ? pow(max(0, 1 - normalized), 0.72) : envelope)
            }
            .id(token)
            .onAppear { restart() }
            .onChange(of: token) { _, _ in restart() }
            .ignoresSafeArea()
            .allowsHitTesting(false)
            .accessibilityHidden(true)
        }
    }

    private func restart() {
        startDate = Date()
    }
}

private func cinematicNoise(_ seed: Int) -> Double {
    let raw = sin(Double(seed) * 12.9898 + 78.233) * 43_758.5453
    return raw - floor(raw)
}

private func positiveRemainder(_ value: Double) -> Double {
    let remainder = value.truncatingRemainder(dividingBy: 1)
    return remainder < 0 ? remainder + 1 : remainder
}
