import SwiftUI
import UIKit

struct BenyuanConstellationLayoutBudget {
    enum EndPreviewAnchor {
        case center
        case bottom
    }

    let bottomDockHeight: CGFloat
    let topMaskHeight: CGFloat
    let firstViewportReserve: CGFloat
    let bottomContentReserve: CGFloat
    let endPreviewAnchor: EndPreviewAnchor

    static let defaults = BenyuanConstellationLayoutBudget(
        bottomDockHeight: 116,
        topMaskHeight: 52,
        firstViewportReserve: 96,
        bottomContentReserve: 292,
        endPreviewAnchor: .center
    )

    func scrollBottomPadding(safeAreaBottom: CGFloat) -> CGFloat {
        bottomDockHeight + bottomContentReserve + safeAreaBottom
    }
}

struct BenyuanNativeConstellationView: View {
    @ObservedObject var model: BenyuanNativeFlowModel
    @State private var activeDimensionKey: String?
    private let constellationEndAnchor = "constellation-end-anchor"
    private let layoutBudget = BenyuanConstellationLayoutBudget.defaults

    private let labels: [String: String] = [
        "openness": "开放性",
        "independence": "独立性",
        "emotional_depth": "情感深度",
        "meaning_seeking": "意义追寻",
        "aesthetic_sensitivity": "审美敏感",
        "action_tendency": "行动力",
        "relationship_need": "关系需求"
    ]

    var body: some View {
        VStack(spacing: 0) {
            BenyuanNativeTopBar(progress: 1, label: "精神星图", onAccount: model.showAccount)

            if let data = model.constellation?.psycheConstellation {
                GeometryReader { geometry in
                    ScrollViewReader { proxy in
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: BenyuanSpacing.x8) {
                            BenyuanRevealedStack(delay: 0.02) {
                                archetype(data)
                            }
                            .padding(.bottom, layoutBudget.firstViewportReserve)

                            BenyuanRevealedStack(delay: 0.12) {
                                dimensions(data)
                            }

                            BenyuanRevealedStack(delay: 0.22) {
                                river(data)
                            }

                            BenyuanRevealedStack(delay: 0.30) {
                                resonances(data)
                            }

                            BenyuanRevealedStack(delay: 0.38) {
                                closing
                            }
                        }
                        .padding(.horizontal, BenyuanSpacing.x4)
                        .padding(.top, BenyuanSpacing.x6)
                        .padding(.bottom, layoutBudget.scrollBottomPadding(safeAreaBottom: geometry.safeAreaInsets.bottom))
                    }
                    .safeAreaInset(edge: .top, spacing: 0) {
                        constellationTopScrollMask
                            .frame(height: layoutBudget.topMaskHeight)
                    }
                    .safeAreaInset(edge: .bottom) {
                        finalDock
                            .frame(height: layoutBudget.bottomDockHeight + geometry.safeAreaInsets.bottom)
                    }
                    .task(id: model.prefersConstellationEndPreview) {
                        guard model.prefersConstellationEndPreview else { return }
                        try? await Task.sleep(nanoseconds: 1_450_000_000)
                        await MainActor.run {
                            withAnimation(.easeInOut(duration: 0.82)) {
                                proxy.scrollTo(constellationEndAnchor, anchor: layoutBudget.scrollAnchor)
                            }
                        }
                    }
                }
                }
            }
        }
    }

    private func archetype(_ data: PsycheConstellation) -> some View {
        VStack(alignment: .center, spacing: 20) {
            ZStack {
                BenyuanConstellationDeepFieldMask(progress: leadingConstellationProgress(data))
                    .clipShape(RoundedRectangle(cornerRadius: 44, style: .continuous))
                BenyuanFlowOrbitTrail(progress: leadingConstellationProgress(data), intensity: 0.82, tilt: -10)
                    .padding(.horizontal, BenyuanSpacing.x2)
                    .allowsHitTesting(false)

                RoundedRectangle(cornerRadius: 44, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                BenyuanColor.glassFill.opacity(0.54),
                                BenyuanColor.bgVoid.opacity(0.10),
                                BenyuanColor.glassFillStrong.opacity(0.60)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 44, style: .continuous)
                            .stroke(BenyuanColor.glassStroke.opacity(0.88), lineWidth: 1)
                    )
                    .shadow(color: BenyuanColor.bgVoid.opacity(0.58), radius: 34, y: 24)

                VStack(spacing: BenyuanSpacing.x3) {
                    BenyuanDeepCelestialBody(size: 150, progress: leadingConstellationProgress(data), mode: .constellationMoon)
                    Text("精神星图")
                        .font(.system(size: 12, weight: .black, design: .monospaced))
                        .foregroundStyle(BenyuanColor.accentGold)
                    Text(data.archetype.name)
                        .font(.system(size: 38, weight: .semibold))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(BenyuanColor.textPrimary)
                        .minimumScaleFactor(0.62)
                    Text(data.archetype.englishName)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(BenyuanColor.accentGold.opacity(0.86))
                    Text(data.archetype.coreEssence)
                        .font(.system(size: 17, weight: .regular))
                        .lineSpacing(6)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(BenyuanColor.textSecondary)
                        .padding(.horizontal, BenyuanSpacing.x4)
                }
                .padding(.horizontal, BenyuanSpacing.x4)
                .padding(.vertical, 20)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func leadingConstellationProgress(_ data: PsycheConstellation) -> Double {
        let scores = data.sevenDimensions.values.map { Double($0.score) / 100.0 }
        guard !scores.isEmpty else { return 0.68 }
        return scores.reduce(0, +) / Double(scores.count)
    }

    private func dimensions(_ data: PsycheConstellation) -> some View {
        let dimensions = data.sevenDimensions.map { key, value in
            (key: key, label: labels[key] ?? key, score: value.score, interpretation: value.interpretation)
        }.sorted { $0.score > $1.score }
        let active = dimensions.first { $0.key == activeDimensionKey } ?? dimensions.first

        return VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
            Text("七维轨道")
                .font(.system(size: 13, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold)
            Text(dimensions.prefix(3).map(\.label).joined(separator: " · "))
                .font(.system(size: 27, weight: .semibold))
                .foregroundStyle(BenyuanColor.textPrimary)
            BenyuanDimensionOrbitMap(
                dimensions: dimensions.map { dimension in
                    BenyuanDimensionOrbitMap.Dimension(
                        key: dimension.key,
                        label: dimension.label,
                        score: dimension.score
                    )
                },
                activeKey: active?.key
            )
            .frame(height: 336)
            BenyuanDimensionResonanceGraph(
                dimensions: dimensions.map { dimension in
                    BenyuanDimensionResonanceGraph.Dimension(
                        key: dimension.key,
                        label: dimension.label,
                        score: dimension.score
                    )
                },
                activeKey: active?.key,
                onSelect: { key in
                    activeDimensionKey = key
                }
            )
            Text(dimensionReadingText(active))
                .font(.system(size: 15, weight: .regular))
                .lineSpacing(7)
                .foregroundStyle(BenyuanColor.textSecondary)
                .padding(.top, BenyuanSpacing.x2)
        }
    }

    private func dimensionReadingText(_ dimension: (key: String, label: String, score: Int, interpretation: String)?) -> String {
        guard let dimension else {
            return "这组轨道暂时还在沉默。等更多选择和剧场回应进入星图，它会显出更清楚的自我轮廓。"
        }

        let tendency: String
        if dimension.score >= 82 {
            tendency = "它像一条亮到近乎固执的主轨，说明你并不是偶尔触碰这个主题，而是经常用它决定自己如何靠近世界。"
        } else if dimension.score >= 64 {
            tendency = "它是一条稳定发光的中层轨道，常在关键时刻替你筛选人、事、风景和命运的重量。"
        } else {
            tendency = "它更像暗处的潮汐，不急着宣告自己，却会在压力、亲密或转身离开时忽然显影。"
        }

        return "\(dimension.label)不是一个分数，而是你精神星系里正在运行的力场。\(tendency)\(dimension.interpretation)把它看成一枚坐标：不是用来规定你是谁，而是提醒你，哪些微小反应已经反复替你说出了答案。"
    }

    private func river(_ data: PsycheConstellation) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            riverMoment(label: "本质", title: data.archetype.coreEssence, body: data.narrativeOverview.components(separatedBy: "\n").first ?? data.narrativeOverview)
            if let tension = data.coreTensions.first {
                riverMoment(label: "张力", title: tension.name, body: tension.description)
            }
            if let path = data.growthSuggestions.first {
                riverMoment(label: "路径", title: path.title, body: path.actionableSteps.first ?? path.description)
            }
        }
    }

    private func riverMoment(label: String, title: String, body: String) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
            Text(label)
                .font(.system(size: 12, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold)
            Text(title)
                .font(.system(size: 24, weight: .semibold))
                .foregroundStyle(BenyuanColor.textPrimary)
            Text(body)
                .font(.system(size: 15, weight: .regular))
                .lineSpacing(6)
                .foregroundStyle(BenyuanColor.textSecondary)
        }
        .padding(.leading, BenyuanSpacing.x4)
        .overlay(Rectangle().fill(BenyuanColor.accentGold.opacity(0.34)).frame(width: 1), alignment: .leading)
    }

    private func resonances(_ data: PsycheConstellation) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            Text("继续共鸣")
                .font(.system(size: 13, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold)
            resonanceLine("书籍", values: data.recommendations.books.prefix(2).map { "\($0.title) · \($0.author)" })
            resonanceLine("电影", values: data.recommendations.films.prefix(2).map { "\($0.title) · \($0.director)" })
            resonanceLine("音乐", values: data.recommendations.music.prefix(2).map { "\($0.artist) · \($0.album)" })
        }
    }

    private func resonanceLine(_ label: String, values: [String]) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x2) {
            Text(label)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(BenyuanColor.textTertiary)
            ForEach(values, id: \.self) { value in
                Text(value)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(BenyuanColor.textPrimary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(BenyuanSpacing.x4)
        .background(RoundedRectangle(cornerRadius: 22, style: .continuous).fill(BenyuanColor.glassFill))
    }

    private var closing: some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
            Text("这不是结论")
                .font(.system(size: 13, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold)
            Text("是你此刻的精神坐标。")
                .font(.system(size: 30, weight: .semibold))
                .lineSpacing(4)
                .foregroundStyle(BenyuanColor.textPrimary)
        }
        .id(constellationEndAnchor)
    }

    private var finalDock: some View {
        BenyuanConstellationActionDock(
            onShare: { model.shareConstellation() },
            onSave: { model.saveConstellationImage() },
            onRestart: { model.restart() }
        )
    }

    private var constellationTopScrollMask: some View {
        LinearGradient(
            colors: [
                BenyuanColor.bgVoid.opacity(0.94),
                BenyuanColor.bgVoid.opacity(0.72),
                BenyuanColor.bgVoid.opacity(0)
            ],
            startPoint: .top,
            endPoint: .bottom
        )
        .allowsHitTesting(false)
    }
}

private extension BenyuanConstellationLayoutBudget {
    var scrollAnchor: UnitPoint {
        switch endPreviewAnchor {
        case .center:
            return .center
        case .bottom:
            return .bottom
        }
    }
}

struct BenyuanConstellationActionDock: View {
    let onShare: () -> Void
    let onSave: () -> Void
    let onRestart: () -> Void

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 30.0)) { timeline in
            let phase = timeline.date.timeIntervalSinceReferenceDate
            let pulse = 0.5 + 0.5 * sin(phase * 0.44)

            VStack(spacing: 0) {
                ZStack(alignment: .bottom) {
                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    BenyuanColor.bgVoid.opacity(0),
                                    BenyuanColor.bgVoid.opacity(0.72),
                                    BenyuanColor.bgVoid
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )

                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [
                                    .clear,
                                    BenyuanColor.accentGold.opacity(0.08 + pulse * 0.04),
                                    .clear
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: 190 + pulse * 28, height: 2)
                        .blur(radius: 0.6)
                        .blendMode(BlendMode.screen)
                }
                .frame(height: 44)
                .allowsHitTesting(false)

                HStack(spacing: BenyuanSpacing.x3) {
                    dockButton("分享", phase: phase, offset: 0, action: onShare)
                    dockButton("保存", phase: phase, offset: 1.2, action: onSave)
                    dockButton("重新探索", phase: phase, offset: 2.4, action: onRestart)
                }
                .padding(.horizontal, BenyuanSpacing.x4)
                .padding(.top, BenyuanSpacing.x3)
                .padding(.bottom, 18)
                .background(
                    Rectangle()
                        .fill(BenyuanColor.bgVoid)
                        .overlay(alignment: .top) {
                            Rectangle()
                                .fill(BenyuanColor.textPrimary.opacity(0.035))
                                .frame(height: 1)
                        }
                        .ignoresSafeArea()
                )
            }
            .frame(maxWidth: .infinity)
        }
    }

    private func dockButton(_ title: String, phase: TimeInterval, offset: Double, action: @escaping () -> Void) -> some View {
        let pulse = 0.5 + 0.5 * sin(phase * 0.54 + offset)

        return Button(action: dockAction(action)) {
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(BenyuanColor.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.78)
                .frame(maxWidth: .infinity, minHeight: 48)
                .background(
                    Capsule()
                        .fill(BenyuanColor.bgSurface.opacity(0.92))
                        .overlay(
                            Capsule()
                                .stroke(BenyuanColor.glassStroke.opacity(0.90), lineWidth: 1)
                        )
                        .overlay(
                            Capsule()
                                .stroke(BenyuanColor.accentGold.opacity(0.08 + pulse * 0.08), lineWidth: 1)
                                .blendMode(BlendMode.screen)
                        )
                )
                .shadow(color: BenyuanColor.accentGold.opacity(0.05 + pulse * 0.03), radius: 12, y: 4)
        }
        .buttonStyle(BenyuanPressableMotionStyle(scale: 0.966, glow: 0.13, haptic: nil))
    }

    private func dockAction(_ action: @escaping () -> Void) -> () -> Void {
        {
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
            action()
        }
    }
}

struct BenyuanConstellationDeepFieldMask: View {
    var progress: Double

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 24.0)) { timeline in
            let phase = timeline.date.timeIntervalSinceReferenceDate
            let pulse = 0.5 + 0.5 * sin(phase * 0.46)
            let clamped = min(max(progress, 0.12), 1)

            GeometryReader { proxy in
                let width = proxy.size.width
                let height = proxy.size.height
                let planetSize = min(width * 0.76, height * 0.58)

                ZStack {
                    RadialGradient(
                        colors: [
                            BenyuanColor.planetEdge.opacity(0.34 + pulse * 0.06),
                            BenyuanColor.nebulaViolet.opacity(0.12 + clamped * 0.04),
                            BenyuanColor.bgVoid.opacity(0.76),
                            BenyuanColor.bgVoid.opacity(0.96)
                        ],
                        center: UnitPoint(x: 0.62, y: 0.18),
                        startRadius: 12,
                        endRadius: max(width, height) * 0.86
                    )

                    Circle()
                        .fill(BenyuanColor.bgVoid.opacity(0.88))
                        .frame(width: planetSize, height: planetSize)
                        .overlay(
                            Circle()
                                .stroke(BenyuanColor.textPrimary.opacity(0.06), lineWidth: 1)
                        )
                        .position(x: width * (0.82 + pulse * 0.01), y: -height * 0.02)

                    Ellipse()
                        .stroke(BenyuanColor.accentGold.opacity(0.12 + clamped * 0.12), lineWidth: 1)
                        .frame(width: width * 0.92, height: height * 0.20)
                        .rotationEffect(.degrees(-12 + phase * 1.6))
                        .position(x: width * 0.52, y: height * 0.33)

                    LinearGradient(
                        colors: [
                            .clear,
                            BenyuanColor.bgVoid.opacity(0.34),
                            BenyuanColor.bgVoid.opacity(0.88)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

struct BenyuanDimensionOrbitMap: View {
    struct Dimension: Equatable {
        let key: String
        let label: String
        let score: Int
    }

    let dimensions: [Dimension]
    let activeKey: String?

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 24.0)) { timeline in
            let phase = timeline.date.timeIntervalSinceReferenceDate

            GeometryReader { proxy in
                let side = min(proxy.size.width, proxy.size.height)
                let center = CGPoint(x: proxy.size.width / 2, y: proxy.size.height / 2)

                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [
                                    BenyuanColor.accentGold.opacity(0.10),
                                    BenyuanColor.nebulaViolet.opacity(0.13),
                                    BenyuanColor.bgVoid.opacity(0.0)
                                ],
                                center: .center,
                                startRadius: 4,
                                endRadius: side * 0.55
                            )
                        )
                        .frame(width: side * 0.88, height: side * 0.88)
                        .position(center)

                    ForEach(0..<3, id: \.self) { index in
                        Circle()
                            .stroke(BenyuanColor.textPrimary.opacity(0.045 + Double(index) * 0.018), lineWidth: 1)
                            .frame(width: side * (0.42 + CGFloat(index) * 0.18), height: side * (0.42 + CGFloat(index) * 0.18))
                            .position(center)
                            .rotationEffect(.degrees(phase * (2.5 + Double(index))))
                    }

                    ForEach(Array(dimensions.prefix(7).enumerated()), id: \.element.key) { index, dimension in
                        let score = min(max(Double(dimension.score) / 100.0, 0.18), 1.0)
                        let baseAngle = Double(index) / Double(max(dimensions.prefix(7).count, 1)) * .pi * 2
                        let angle = baseAngle + phase * (0.05 + Double(index % 3) * 0.012)
                        let radius = side * (0.19 + score * 0.25)
                        let point = CGPoint(
                            x: center.x + cos(angle) * radius,
                            y: center.y + sin(angle) * radius * 0.62
                        )
                        let isActive = activeKey == dimension.key

                        Path { path in
                            path.move(to: center)
                            path.addLine(to: point)
                        }
                        .stroke(BenyuanColor.accentGold.opacity(isActive ? 0.30 : 0.11), lineWidth: isActive ? 1.1 : 0.7)

                        Circle()
                            .fill(isActive ? BenyuanColor.accentGold : BenyuanColor.textPrimary.opacity(0.72))
                            .frame(width: isActive ? 10 : 7, height: isActive ? 10 : 7)
                            .shadow(color: BenyuanColor.accentGold.opacity(isActive ? 0.58 : 0.16), radius: isActive ? 14 : 8)
                            .position(point)

                        Text(dimension.label)
                            .font(.system(size: isActive ? 11 : 10, weight: .black, design: .monospaced))
                            .foregroundStyle(isActive ? BenyuanColor.textPrimary : BenyuanColor.textTertiary)
                            .lineLimit(1)
                            .minimumScaleFactor(0.72)
                            .frame(width: 56)
                            .position(x: point.x, y: point.y + (point.y < center.y ? -18 : 18))
                    }

                    Circle()
                        .fill(BenyuanColor.bgVoid.opacity(0.82))
                        .frame(width: side * 0.20, height: side * 0.20)
                        .overlay(
                            Circle()
                                .stroke(BenyuanColor.accentGold.opacity(0.26), lineWidth: 1)
                        )
                        .shadow(color: BenyuanColor.accentGold.opacity(0.18), radius: 18)
                        .position(center)

                    Text("七维")
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                        .foregroundStyle(BenyuanColor.accentGold)
                        .position(center)
                }
            }
        }
        .accessibilityHidden(true)
    }
}

struct BenyuanDimensionResonanceGraph: View {
    struct Dimension: Equatable {
        let key: String
        let label: String
        let score: Int
    }

    let dimensions: [Dimension]
    let activeKey: String?
    let onSelect: (String) -> Void

    var body: some View {
        TimelineView(.animation(minimumInterval: 1.0 / 24.0)) { timeline in
            let phase = timeline.date.timeIntervalSinceReferenceDate

            VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
                ForEach(Array(dimensions.prefix(7).enumerated()), id: \.element.key) { index, dimension in
                    Button {
                        onSelect(dimension.key)
                    } label: {
                        resonanceRow(index: index, dimension: dimension, phase: phase)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(BenyuanSpacing.x4)
            .background(
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .fill(BenyuanColor.bgVoid.opacity(0.42))
                    .overlay(
                        RoundedRectangle(cornerRadius: 26, style: .continuous)
                            .stroke(BenyuanColor.glassStroke.opacity(0.78), lineWidth: 1)
                    )
            )
        }
    }

    private func resonanceRow(index: Int, dimension: Dimension, phase: TimeInterval) -> some View {
        let score = min(max(CGFloat(dimension.score) / 100.0, 0.08), 1)
        let active = activeKey == dimension.key
        let pulse = 0.5 + 0.5 * sin(phase * (0.62 + Double(index) * 0.03))

        return HStack(spacing: BenyuanSpacing.x3) {
            Text(dimension.label)
                .font(.system(size: 13, weight: active ? .black : .semibold, design: .monospaced))
                .foregroundStyle(active ? BenyuanColor.textPrimary : BenyuanColor.textSecondary)
                .lineLimit(1)
                .frame(width: 82, alignment: .leading)

            GeometryReader { proxy in
                let width = max(proxy.size.width, 1)
                let lineWidth = max(28, width * score)
                let starX = min(width - 5, max(5, lineWidth - 2))

                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(BenyuanColor.textPrimary.opacity(0.055))
                        .frame(height: 1)

                    Capsule()
                        .fill(
                            LinearGradient(
                                colors: [
                                    BenyuanColor.accentGold.opacity(active ? 0.54 : 0.22),
                                    BenyuanColor.textPrimary.opacity(active ? 0.52 : 0.22),
                                    .clear
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: lineWidth, height: active ? 3 : 2)
                        .blur(radius: active ? 0.15 : 0.35)

                    Circle()
                        .fill(active ? BenyuanColor.accentGold : BenyuanColor.textPrimary.opacity(0.50))
                        .frame(width: active ? 8 + pulse * 2 : 5, height: active ? 8 + pulse * 2 : 5)
                        .position(x: starX, y: 14)
                        .shadow(color: BenyuanColor.accentGold.opacity(active ? 0.52 : 0.14), radius: active ? 12 : 5)

                    ForEach(0..<3, id: \.self) { particle in
                        let particleX = min(width - 3, max(3, lineWidth * (0.28 + CGFloat(particle) * 0.22)))
                        Circle()
                            .fill(BenyuanColor.textPrimary.opacity(active ? 0.16 : 0.08))
                            .frame(width: 2, height: 2)
                            .position(
                                x: particleX + CGFloat(sin(phase + Double(index + particle))) * 4,
                                y: 14 + CGFloat(particle - 1) * 4
                            )
                    }
                }
            }
            .frame(height: 28)

            Circle()
                .stroke(active ? BenyuanColor.accentGold.opacity(0.72) : BenyuanColor.glassStroke.opacity(0.78), lineWidth: 1)
                .frame(width: 18, height: 18)
                .overlay(
                    Circle()
                        .fill(active ? BenyuanColor.accentGold : BenyuanColor.textPrimary.opacity(0.12))
                        .frame(width: active ? 8 : 4, height: active ? 8 : 4)
                )
        }
        .padding(.vertical, 3)
        .contentShape(Rectangle())
        .animation(.easeOut(duration: 0.18), value: activeKey)
    }
}
