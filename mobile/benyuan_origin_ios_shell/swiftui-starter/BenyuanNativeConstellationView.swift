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
        firstViewportReserve: 72,
        bottomContentReserve: 326,
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
        VStack(alignment: .center, spacing: 14) {
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

                VStack(spacing: BenyuanSpacing.x2) {
                    BenyuanDeepCelestialBody(size: 184, progress: leadingConstellationProgress(data), mode: .constellationMoon)
                        .padding(.bottom, 2)
                    Text("精神星图")
                        .font(.system(size: 12, weight: .black, design: .monospaced))
                        .foregroundStyle(BenyuanColor.accentGold)
                    Text(data.archetype.name)
                        .font(.system(size: 40, weight: .semibold))
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
                        .padding(.top, BenyuanSpacing.x1)
                }
                .padding(.horizontal, BenyuanSpacing.x4)
                .padding(.top, 18)
                .padding(.bottom, 22)
            }
            .frame(minHeight: 448)
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

        return VStack(alignment: .leading, spacing: BenyuanSpacing.x2) {
            Text("七维轨道")
                .font(.system(size: 13, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold)
            Text(dimensions.prefix(3).map(\.label).joined(separator: " · "))
                .font(.system(size: 27, weight: .semibold))
                .foregroundStyle(BenyuanColor.textPrimary)
            Text(constellationReadingText(data, dimensions: dimensions))
                .font(.system(size: 15, weight: .regular))
                .lineSpacing(7)
                .foregroundStyle(BenyuanColor.textSecondary)
                .padding(.top, BenyuanSpacing.x1)
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
            .frame(height: 384)
            .padding(.top, BenyuanSpacing.x1)
            BenyuanDimensionLineageGraph(
                dimensions: dimensions.map { dimension in
                    BenyuanDimensionLineageGraph.Dimension(
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
                .font(.system(size: 16, weight: .regular))
                .lineSpacing(7)
                .foregroundStyle(BenyuanColor.textSecondary)
                .padding(.top, BenyuanSpacing.x2)
        }
    }

    private func constellationReadingText(
        _ data: PsycheConstellation,
        dimensions: [(key: String, label: String, score: Int, interpretation: String)]
    ) -> String {
        let primary = dimensions.first?.label ?? data.archetype.name
        let secondary = dimensions.dropFirst().first?.label ?? "内在边界"
        let third = dimensions.dropFirst(2).first?.label ?? "深处直觉"

        return "这张星图不是把你压缩成性格标签，而是在标出当下最有引力的几条精神轨道。\(primary)像主月面，\(secondary)与\(third)围绕它形成潮汐；它们一起决定你如何靠近关系、作品、选择和未说出口的愿望。"
    }

    private func dimensionReadingText(_ dimension: (key: String, label: String, score: Int, interpretation: String)?) -> String {
        guard let dimension else {
            return "这组轨道暂时还在沉默。等更多选择和剧场回应进入星图，它会显出更清楚的自我轮廓。"
        }

        let brightness: String
        if dimension.score >= 82 {
            brightness = "它像一条亮到近乎固执的主轨，说明你并不是偶尔触碰这个主题，而是经常用它决定自己如何靠近世界。"
        } else if dimension.score >= 64 {
            brightness = "它是一条稳定发光的中层轨道，常在关键时刻替你筛选人、事、风景和命运的重量。"
        } else {
            brightness = "它更像暗处的潮汐，不急着宣告自己，却会在压力、亲密或转身离开时忽然显影。"
        }

        let invitation: String
        switch dimension.key {
        case "openness":
            invitation = "当它被点亮，你会更愿意让陌生经验先停留一会儿，再决定是否命名。"
        case "independence":
            invitation = "当它被点亮，你会把节奏感看得很重：靠近可以发生，但不能以失去自己为代价。"
        case "emotional_depth":
            invitation = "当它被点亮，情绪不只是反应，而像一口井，里面藏着需要、记忆和某种未完成的保护。"
        case "meaning_seeking":
            invitation = "当它被点亮，你会追问一件事是否值得，不只看结果，也看它有没有让生命变得更准确。"
        case "aesthetic_sensitivity":
            invitation = "当它被点亮，光线、语气、材质和沉默都会变成判断真实感的线索。"
        case "action_tendency":
            invitation = "当它被点亮，你需要把感受落到动作里，让一个小决定先替未来打开门。"
        case "relationship_need":
            invitation = "当它被点亮，你在寻找的不是热闹，而是一种能容纳复杂性的回应。"
        default:
            invitation = "当它被点亮，你会在日常细节里反复确认：什么真正靠近你，什么只是经过你。"
        }

        return "\(dimension.label)不是一个分数，而是你精神星系里正在运行的力场。\(brightness)\(dimension.interpretation)\(invitation)把它看成一枚坐标：不是用来规定你是谁，而是提醒你，哪些微小反应已经反复替你说出了答案。"
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
        BenyuanMotionTimeline(preferredFramesPerSecond: 24) { phase in
            let pulse = 0.5 + 0.5 * sin(phase * 0.38)

            ZStack {
                BenyuanConstellationDeepFieldMask(progress: 0.82)
                    .clipShape(RoundedRectangle(cornerRadius: 42, style: .continuous))

                VStack(spacing: BenyuanSpacing.x4) {
                    ZStack {
                        ForEach(0..<3, id: \.self) { index in
                            Ellipse()
                                .trim(from: 0.08, to: 0.64 + pulse * 0.08)
                                .stroke(
                                    BenyuanColor.accentGold.opacity(0.11 + Double(index) * 0.045),
                                    style: StrokeStyle(lineWidth: 1, lineCap: .round, dash: index == 2 ? [3, 16] : [])
                                )
                                .frame(width: 150 + CGFloat(index) * 42, height: 48 + CGFloat(index) * 16)
                                .rotationEffect(.degrees(-18 + Double(index) * 18 + phase * (1.0 + Double(index) * 0.36)))
                        }

                        BenyuanDeepCelestialBody(size: 116, progress: 0.86, mode: .constellationMoon)
                    }
                    .frame(height: 164)

                    VStack(spacing: BenyuanSpacing.x2) {
                        Text("这不是结论")
                            .font(.system(size: 13, weight: .black, design: .monospaced))
                            .foregroundStyle(BenyuanColor.accentGold)
                        Text("是你此刻的精神坐标。")
                            .font(.system(size: 31, weight: .semibold))
                            .lineSpacing(4)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(BenyuanColor.textPrimary)
                        Text("带着它回到生活里：不必马上解释自己，只要在下一次选择、靠近、停顿时，认出那条已经发亮的轨道。")
                            .font(.system(size: 16, weight: .regular))
                            .lineSpacing(7)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(BenyuanColor.textSecondary)
                            .padding(.horizontal, BenyuanSpacing.x3)
                            .padding(.top, BenyuanSpacing.x2)
                    }
                }
                .padding(.horizontal, BenyuanSpacing.x6)
                .padding(.top, BenyuanSpacing.x6)
                .padding(.bottom, BenyuanSpacing.x8)
            }
            .overlay(
                RoundedRectangle(cornerRadius: 42, style: .continuous)
                    .stroke(BenyuanColor.glassStroke.opacity(0.78), lineWidth: 1)
            )
            .shadow(color: BenyuanColor.bgVoid.opacity(0.54), radius: 32, y: 22)
            .id(constellationEndAnchor)
        }
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
        BenyuanMotionTimeline(preferredFramesPerSecond: 30) { phase in
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
        BenyuanMotionTimeline(preferredFramesPerSecond: 24) { phase in
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
        BenyuanMotionTimeline(preferredFramesPerSecond: 24) { phase in

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
                        let labelX = min(max(point.x, 32), proxy.size.width - 32)
                        let labelY = min(max(point.y + (point.y < center.y ? -14 : 14), 14), proxy.size.height - 14)

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
                            .frame(width: 64)
                            .position(x: labelX, y: labelY)
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

struct BenyuanDimensionLineageGraph: View {
    struct Dimension: Equatable {
        let key: String
        let label: String
        let score: Int
    }

    let dimensions: [Dimension]
    let activeKey: String?
    let onSelect: (String) -> Void

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 24) { phase in
            GeometryReader { proxy in
                let visible = Array(dimensions.prefix(7))
                let width = max(proxy.size.width, 1)
                let height = max(proxy.size.height, 1)
                let activeDimension = visible.first { $0.key == activeKey } ?? visible.first

                ZStack {
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    BenyuanColor.bgVoid.opacity(0.66),
                                    BenyuanColor.glassFill.opacity(0.30),
                                    BenyuanColor.bgSurface.opacity(0.52)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 30, style: .continuous)
                                .stroke(BenyuanColor.glassStroke.opacity(0.78), lineWidth: 1)
                        )

                    RadialGradient(
                        colors: [
                            BenyuanColor.accentGold.opacity(0.10),
                            BenyuanColor.nebulaViolet.opacity(0.09),
                            .clear
                        ],
                        center: UnitPoint(x: 0.28, y: 0.18),
                        startRadius: 8,
                        endRadius: max(width, height) * 0.82
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))

                    lineagePaths(dimensions: visible, size: proxy.size, phase: phase)

                    ForEach(Array(visible.enumerated()), id: \.element.key) { index, dimension in
                        let point = lineagePoint(index: index, dimension: dimension, size: proxy.size, phase: phase)
                        Button {
                            onSelect(dimension.key)
                        } label: {
                            lineageNode(index: index, dimension: dimension, activeDimension: activeDimension, phase: phase)
                        }
                        .buttonStyle(.plain)
                        .position(point)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("星迹谱系")
                            .font(.system(size: 11, weight: .black, design: .monospaced))
                            .foregroundStyle(BenyuanColor.accentGold.opacity(0.90))
                        Text(activeDimension?.label ?? "七维")
                            .font(.system(size: 19, weight: .semibold))
                            .foregroundStyle(BenyuanColor.textPrimary)
                            .lineLimit(1)
                            .minimumScaleFactor(0.76)
                        Text("点亮一枚星点，查看它在你精神星系里的运行方式。")
                            .font(.system(size: 12, weight: .regular))
                            .lineSpacing(4)
                            .foregroundStyle(BenyuanColor.textTertiary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: width * 0.54, alignment: .leading)
                    .position(x: width * 0.33, y: height * 0.24)
                }
            }
        }
        .frame(height: 296)
    }

    private func lineagePaths(dimensions: [Dimension], size: CGSize, phase: TimeInterval) -> some View {
        ZStack {
            ForEach(Array(dimensions.enumerated()), id: \.element.key) { index, dimension in
                let point = lineagePoint(index: index, dimension: dimension, size: size, phase: phase)
                let nextIndex = (index + 1) % max(dimensions.count, 1)
                let nextDimension = dimensions[nextIndex]
                let nextPoint = lineagePoint(index: nextIndex, dimension: nextDimension, size: size, phase: phase)
                let active = activeKey == dimension.key || activeKey == nextDimension.key

                Path { path in
                    path.move(to: point)
                    let control = CGPoint(
                        x: (point.x + nextPoint.x) / 2 + CGFloat(sin(phase * 0.18 + Double(index))) * 24,
                        y: (point.y + nextPoint.y) / 2 - CGFloat(cos(phase * 0.15 + Double(index))) * 18
                    )
                    path.addQuadCurve(to: nextPoint, control: control)
                }
                .stroke(
                    LinearGradient(
                        colors: [
                            BenyuanColor.accentGold.opacity(active ? 0.32 : 0.12),
                            BenyuanColor.textPrimary.opacity(active ? 0.22 : 0.075),
                            BenyuanColor.nebulaViolet.opacity(active ? 0.20 : 0.08)
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    style: StrokeStyle(lineWidth: active ? 1.6 : 0.9, lineCap: .round, dash: active ? [] : [2, 10])
                )
                .blendMode(.screen)
            }
        }
    }

    private func lineageNode(
        index: Int,
        dimension: Dimension,
        activeDimension: Dimension?,
        phase: TimeInterval
    ) -> some View {
        let active = activeDimension?.key == dimension.key
        let score = min(max(CGFloat(dimension.score) / 100.0, 0.18), 1)
        let pulse = 0.5 + 0.5 * sin(phase * (0.62 + Double(index) * 0.05))
        let nodeSize = 34 + score * 18 + (active ? pulse * 5 : 0)

        return VStack(spacing: 6) {
            ZStack {
                Circle()
                    .stroke(BenyuanColor.accentGold.opacity(active ? 0.28 + pulse * 0.16 : 0.11), lineWidth: 1)
                    .frame(width: nodeSize + 16, height: nodeSize + 16)
                    .blur(radius: active ? 0.1 : 0.35)
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                (active ? BenyuanColor.accentGold : BenyuanColor.textPrimary).opacity(active ? 0.82 : 0.42),
                                BenyuanColor.nebulaViolet.opacity(active ? 0.22 : 0.12),
                                BenyuanColor.bgVoid.opacity(0.12)
                            ],
                            center: .center,
                            startRadius: 1,
                            endRadius: nodeSize * 0.72
                        )
                    )
                    .frame(width: nodeSize, height: nodeSize)
                    .overlay(
                        Circle()
                            .stroke(active ? BenyuanColor.textPrimary.opacity(0.42) : BenyuanColor.glassStroke.opacity(0.62), lineWidth: 1)
                    )
                    .shadow(color: BenyuanColor.accentGold.opacity(active ? 0.34 : 0.10), radius: active ? 18 : 8)

                ForEach(0..<2, id: \.self) { particle in
                    Circle()
                        .fill(BenyuanColor.textPrimary.opacity(active ? 0.34 : 0.16))
                        .frame(width: active ? 3 : 2, height: active ? 3 : 2)
                        .offset(
                            x: CGFloat(cos(phase * 0.8 + Double(index + particle) * 1.7)) * (nodeSize * 0.30),
                            y: CGFloat(sin(phase * 0.7 + Double(index + particle) * 1.4)) * (nodeSize * 0.22)
                        )
                }
            }
            .frame(width: 72, height: 72)

            Text(dimension.label)
                .font(.system(size: active ? 12 : 11, weight: active ? .black : .semibold, design: .monospaced))
                .foregroundStyle(active ? BenyuanColor.textPrimary : BenyuanColor.textTertiary)
                .lineLimit(1)
                .minimumScaleFactor(0.62)
                .frame(width: 72)
        }
        .contentShape(Rectangle())
        .animation(.easeOut(duration: 0.20), value: activeKey)
    }

    private func lineagePoint(index: Int, dimension: Dimension, size: CGSize, phase: TimeInterval) -> CGPoint {
        let width = max(size.width, 1)
        let height = max(size.height, 1)
        let score = min(max(CGFloat(dimension.score) / 100.0, 0.16), 1)
        let count = max(CGFloat(dimensions.prefix(7).count), 1)
        let angle = CGFloat(index) / count * .pi * 2 - .pi * 0.58 + CGFloat(phase) * 0.012
        let radiusX = width * (0.26 + score * 0.13)
        let radiusY = height * (0.23 + score * 0.12)
        let center = CGPoint(x: width * 0.54, y: height * 0.58)

        return CGPoint(
            x: min(width - 50, max(50, center.x + cos(angle) * radiusX)),
            y: min(height - 48, max(64, center.y + sin(angle) * radiusY))
        )
    }
}
