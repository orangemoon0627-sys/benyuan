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
    let archetypeCardMaxWidth: CGFloat
    let endPreviewAnchor: EndPreviewAnchor

    static let defaults = BenyuanConstellationLayoutBudget(
        bottomDockHeight: 116,
        topMaskHeight: 52,
        firstViewportReserve: 96,
        bottomContentReserve: 300,
        archetypeCardMaxWidth: 370,
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
        "openness": "潜意识开放度",
        "independence": "边界完整度",
        "emotional_depth": "情绪沉潜度",
        "meaning_seeking": "意义欲望",
        "aesthetic_sensitivity": "象征感受力",
        "action_tendency": "现实落地力",
        "relationship_need": "客体联结需求"
    ]

    var body: some View {
        VStack(spacing: 0) {
            BenyuanNativeTopBar(progress: 1, label: "精神星图", onAccount: model.showAccount)

            if let data = model.constellation?.psycheConstellation {
                GeometryReader { geometry in
                    ScrollViewReader { proxy in
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: BenyuanSpacing.x6) {
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
                    .safeAreaInset(edge: .bottom, spacing: 0) {
                        finalDock(bottomEdgeOffset: geometry.safeAreaInsets.bottom)
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
        let progress = leadingConstellationProgress(data)
        let mode = celestialMode(for: data.archetype)
        let celestialFieldHeight: CGFloat = 246

        return VStack(alignment: .center, spacing: BenyuanSpacing.x2) {
            ZStack {
                BenyuanConstellationArchetypeField(progress: progress, mode: mode)
                    .frame(height: celestialFieldHeight)
                    .compositingGroup()
                    .blendMode(.screen)
                    .mask(
                        LinearGradient(
                            colors: [
                                .clear,
                                .black.opacity(0.82),
                                .black,
                                .black.opacity(0.72),
                                .clear
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .allowsHitTesting(false)

                BenyuanFlowOrbitTrail(
                    progress: progress,
                    intensity: constellationFlowTrailIntensity(for: mode),
                    tilt: mode.tilt,
                    preferredFramesPerSecond: 16
                )
                .frame(height: celestialFieldHeight)
                .padding(.horizontal, BenyuanSpacing.x2)
                .compositingGroup()
                .blendMode(.screen)
                .mask(
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.78), .black, .black.opacity(0.60), .clear],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .allowsHitTesting(false)

                BenyuanConstellationSubjectIsolationField(mode: mode)
                BenyuanDeepCelestialBody(size: 204, progress: progress, mode: mode)
                    .contrast(mode.referenceArtworkSubjectContrast)
                    .saturation(mode.referenceArtworkSubjectSaturation)
            }
            .frame(height: 232)
            .padding(.horizontal, -BenyuanSpacing.x2)
            .padding(.top, 8)

            Text("精神星图")
                .font(.system(size: 12, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold)
                .padding(.top, -2)
            Text(data.archetype.name)
                .font(.system(size: 42, weight: .semibold))
                .multilineTextAlignment(.center)
                .foregroundStyle(BenyuanColor.textPrimary)
                .minimumScaleFactor(0.62)
            Text(data.archetype.englishName)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(BenyuanColor.accentGold.opacity(0.86))
                .multilineTextAlignment(.center)
            if data.archetype.displayName != data.archetype.name || data.archetype.displaySubtitle != data.archetype.englishName {
                Text("\(data.archetype.displayName)：\(data.archetype.displaySubtitle)")
                    .font(.system(size: 15, weight: .regular))
                    .lineSpacing(5)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(BenyuanColor.textSecondary.opacity(0.92))
                    .padding(.horizontal, BenyuanSpacing.x3)
            }
            Text(data.archetype.coreEssence)
                .font(.system(size: 17, weight: .regular))
                .lineSpacing(6)
                .multilineTextAlignment(.center)
                .foregroundStyle(BenyuanColor.textSecondary)
                .padding(.horizontal, BenyuanSpacing.x4)
                .padding(.top, BenyuanSpacing.x1)
        }
        .padding(.horizontal, BenyuanSpacing.x4)
        .padding(.top, 10)
        .padding(.bottom, 18)
        .frame(maxWidth: layoutBudget.archetypeCardMaxWidth)
        .frame(minHeight: 448)
        .frame(maxWidth: .infinity, alignment: .center)
    }

    private func leadingConstellationProgress(_ data: PsycheConstellation) -> Double {
        let scores = data.sevenDimensions.values.map { Double($0.score) / 100.0 }
        guard !scores.isEmpty else { return 0.68 }
        return scores.reduce(0, +) / Double(scores.count)
    }

    private func constellationFlowTrailIntensity(for mode: BenyuanDeepCelestialBody.Mode) -> Double {
        switch mode {
        case .eventHorizonDiver, .nebulaWeaver, .solarCorona, .deepSpaceAnchor:
            return 0.24
        case .rainWindowScribe, .moonHarbor, .existentialNomad:
            return 0.30
        default:
            return 0.42
        }
    }

    private func celestialMode(for archetype: PsycheArchetype) -> BenyuanDeepCelestialBody.Mode {
        switch archetype.name.trimmingCharacters(in: .whitespacesAndNewlines) {
        case "远潮观月者":
            return .farTideMoon
        case "星图筑序者":
            return .starMapArchitect
        case "月港栖岸者":
            return .moonHarbor
        case "存在游牧者":
            return .existentialNomad
        case "雨窗抒写者":
            return .rainWindowScribe
        case "事件视界沉潜者":
            return .eventHorizonDiver
        case "星云织梦者":
            return .nebulaWeaver
        case "日冕引燃者":
            return .solarCorona
        case "类地栖居者":
            return .terrestrialPlanet
        case "深空锚定者":
            return .deepSpaceAnchor
        default:
            break
        }

        let fingerprint = [
            archetype.name,
            archetype.englishName,
            archetype.visualPrompt
        ].joined(separator: " ").lowercased()

        if fingerprint.contains("event horizon") || fingerprint.contains("black hole") || fingerprint.contains("事件视界") || fingerprint.contains("黑洞") {
            return .eventHorizonDiver
        }
        if fingerprint.contains("rain-window") || fingerprint.contains("rain window") || fingerprint.contains("雨窗") {
            return .rainWindowScribe
        }
        if fingerprint.contains("star-map") || fingerprint.contains("star map") || fingerprint.contains("architect") || fingerprint.contains("筑序") || fingerprint.contains("星图") {
            return .starMapArchitect
        }
        if fingerprint.contains("moon-harbor") || fingerprint.contains("moon harbor") || fingerprint.contains("月港") {
            return .moonHarbor
        }
        if fingerprint.contains("existential") || fingerprint.contains("nomad") || fingerprint.contains("wanderer") || fingerprint.contains("游牧") {
            return .existentialNomad
        }
        if fingerprint.contains("nebula") || fingerprint.contains("星云") {
            return .nebulaWeaver
        }
        if fingerprint.contains("solar") || fingerprint.contains("corona") || fingerprint.contains("日冕") || fingerprint.contains("太阳") {
            return .solarCorona
        }
        if fingerprint.contains("terrestrial") || fingerprint.contains("earth-like") || fingerprint.contains("类地") || fingerprint.contains("栖居") {
            return .terrestrialPlanet
        }
        if fingerprint.contains("deep space") || fingerprint.contains("anchor") || fingerprint.contains("深空") || fingerprint.contains("锚") {
            return .deepSpaceAnchor
        }
        if fingerprint.contains("moonlit") || fingerprint.contains("远潮") || fingerprint.contains("观月") || fingerprint.contains("月") {
            return .farTideMoon
        }
        return .farTideMoon
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
                .font(.system(size: 25, weight: .semibold))
                .foregroundStyle(BenyuanColor.textPrimary)
            Text(constellationReadingText(data, dimensions: dimensions))
                .font(.system(size: 15, weight: .regular))
                .lineSpacing(7)
                .foregroundStyle(BenyuanColor.textSecondary)
                .padding(.top, 2)
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
            .frame(height: 392)
            .padding(.top, 0)
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
            dimensionInsightCard(active)
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

    private func dimensionInsightCard(_ dimension: (key: String, label: String, score: Int, interpretation: String)?) -> some View {
        let insight = dimensionInsight(dimension)

        return VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
            dimensionInsightRow(label: "核心结论", text: insight.conclusion)
            dimensionInsightRow(label: "潜在防御", text: insight.defense)
            dimensionInsightRow(label: "盲点", text: insight.blindSpot)
            dimensionInsightRow(label: "可用方向", text: insight.direction)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(BenyuanSpacing.x4)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(BenyuanColor.bgSurface.opacity(0.58))
                .overlay(
                    RoundedRectangle(cornerRadius: 26, style: .continuous)
                        .stroke(BenyuanColor.glassStroke.opacity(0.82), lineWidth: 1)
                )
        )
    }

    private func dimensionInsightRow(label: String, text: String) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(label)
                .font(.system(size: 13, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold)
            Text(text)
                .font(.system(size: 15, weight: label == "核心结论" ? .semibold : .regular))
                .lineSpacing(5)
                .foregroundStyle(label == "核心结论" ? BenyuanColor.textPrimary : BenyuanColor.textSecondary)
        }
    }

    private func dimensionInsight(_ dimension: (key: String, label: String, score: Int, interpretation: String)?) -> BenyuanDimensionInsight {
        guard let dimension else {
            return BenyuanDimensionInsight(
                conclusion: "这组轨道还在等待更多线索显影。",
                defense: "暂时不急着下判断，先保留它的空白。",
                blindSpot: "信息不足时，任何过满的解释都会显得粗糙。",
                direction: "继续完成选择和剧场，星图会补上更清楚的轮廓。"
            )
        }

        let intensity = dimension.score >= 78 ? "强显影" : dimension.score >= 60 ? "稳定显影" : dimension.score >= 44 ? "中等显影" : "低显影"
        let cleaned = cleanedDimensionInterpretation(dimension.interpretation)
        let fallback: BenyuanDimensionInsight

        switch dimension.key {
        case "openness":
            fallback = BenyuanDimensionInsight(
                conclusion: "潜意识开放度\(intensity)：你允许复杂、矛盾和未完成的东西在心里停留，尤其是能让旧自我松动的作品、画面和关系处境。",
                defense: "你常用“再理解一下”来延迟进入，这是一种避免被粗糙现实过早固定的保护。",
                blindSpot: "理解有时会替代行动，让真正想要的东西停在想象里。",
                direction: "给一个陌生愿望很小的位置，先观察它是否真的让你更接近自己。"
            )
        case "independence":
            fallback = BenyuanDimensionInsight(
                conclusion: "边界完整度\(intensity)：你靠近世界之前，会先检查自己还在不在自己的位置上。",
                defense: "你保护的是边界，不是冷淡；你怕的是关系太快进入全部房间。",
                blindSpot: "可协商的靠近有时会被你误读成侵入。",
                direction: "把边界说成坐标，而不是墙，让合适的人知道可以停在哪里。"
            )
        case "emotional_depth":
            fallback = BenyuanDimensionInsight(
                conclusion: "情绪沉潜度\(intensity)：你的情绪常先沉到深处，再借一句话、一首歌或一张图浮上来。",
                defense: "维持平静是你的外层光壳，用来给复杂感受争取时间。",
                blindSpot: "别人可能只看见冷静，看不见底下已经很重的潮汐。",
                direction: "不用一次说完，先把感受拆成一句能被接住的话。"
            )
        case "meaning_seeking":
            fallback = BenyuanDimensionInsight(
                conclusion: "意义欲望\(intensity)：你不只问有没有用，更问它能否让生活变得更准确。",
                defense: "你用意义过滤欲望，没有内在理由的靠近很难说服你。",
                blindSpot: "意义门槛太高时，一些本可以先试的小路会被提前排除。",
                direction: "让一个选择先成为小实验，而不是立刻成为终身答案。"
            )
        case "aesthetic_sensitivity":
            fallback = BenyuanDimensionInsight(
                conclusion: "象征感受力\(intensity)：你会用光线、语气、构图和氛围判断一件事是否真实。",
                defense: "你把难以直说的内在经验投射到画面和声音里，再从它们那里读回自己。",
                blindSpot: "美感能保存真实，也可能延后现实命名。",
                direction: "当某个画面击中你，问一句：它替我保存了哪件还没说出口的事。"
            )
        case "action_tendency":
            fallback = BenyuanDimensionInsight(
                conclusion: "现实落地力\(intensity)：你不是完全被动的人；你更像确认轨道后，用一个小动作打破等待。",
                defense: "行动有时是在抵消空白，让不确定性不要长期占据身体。",
                blindSpot: "如果动作只是为了缓解焦虑，它会很快失去方向。",
                direction: "先确认这一步服务的是愿望，还是只是想逃离等待。"
            )
        case "relationship_need":
            fallback = BenyuanDimensionInsight(
                conclusion: "客体联结需求\(intensity)：你要的不是热闹连接，而是能理解边界、慢速和未说出口部分的回应。",
                defense: "你反复确认的是：靠近会不会保留你的完整性。",
                blindSpot: "你太擅长把需要藏成独立，别人可能误以为你并不期待回应。",
                direction: "选择一个可信的人，说出一小块需要，不必把整座房间交出去。"
            )
        default:
            fallback = BenyuanDimensionInsight(
                conclusion: "\(dimension.label)\(intensity)：这条轨道会在压力、亲密或选择时影响你的第一反应。",
                defense: "它帮你保留节奏，也帮你避免被外界过快定义。",
                blindSpot: "当它过度发亮，其他可能性会被暂时遮住。",
                direction: "把它当成坐标，不当成全部答案。"
            )
        }

        guard !cleaned.isEmpty else { return fallback }
        return BenyuanDimensionInsight(
            conclusion: cleaned,
            defense: fallback.defense,
            blindSpot: fallback.blindSpot,
            direction: fallback.direction
        )
    }

    private func cleanedDimensionInterpretation(_ value: String) -> String {
        let retiredPrefixes = ["分数", "分析"].map { "不是一个\($0)，而是" }
        return retiredPrefixes
            .reduce(value) { current, prefix in
                current.replacingOccurrences(of: prefix, with: "")
            }
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func river(_ data: PsycheConstellation) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            riverMoment(label: "本质", title: data.archetype.coreEssence, body: data.narrativeOverview.components(separatedBy: "\n").first ?? data.narrativeOverview)
            if let tension = data.coreTensions.first {
                riverMoment(label: "张力", title: tension.name, body: tension.description)
            }
            if let path = data.growthSuggestions.first {
                pathMoment(path)
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

    private func pathMoment(_ path: PsycheConstellation.GrowthSuggestion) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
            Text("路径")
                .font(.system(size: 12, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold)
            Text(path.title)
                .font(.system(size: 24, weight: .semibold))
                .foregroundStyle(BenyuanColor.textPrimary)
            Text("为什么做")
                .font(.system(size: 12, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold.opacity(0.92))
            pathExplanation(path)
            if let step = path.actionableSteps.first {
                VStack(alignment: .leading, spacing: 7) {
                    Text("可以尝试")
                        .font(.system(size: 12, weight: .black, design: .monospaced))
                        .foregroundStyle(BenyuanColor.accentGold.opacity(0.92))
                    Text(step)
                        .font(.system(size: 15, weight: .semibold))
                        .lineSpacing(6)
                        .foregroundStyle(BenyuanColor.textPrimary.opacity(0.94))
                    Text("会带来什么")
                        .font(.system(size: 12, weight: .black, design: .monospaced))
                        .foregroundStyle(BenyuanColor.accentGold.opacity(0.92))
                        .padding(.top, BenyuanSpacing.x1)
                    Text(pathExpectedEffect(path, step: step))
                        .font(.system(size: 14, weight: .regular))
                        .lineSpacing(5)
                        .foregroundStyle(BenyuanColor.textSecondary)
                }
                .padding(.top, BenyuanSpacing.x1)
            }
        }
        .padding(.leading, BenyuanSpacing.x4)
        .overlay(Rectangle().fill(BenyuanColor.accentGold.opacity(0.34)).frame(width: 1), alignment: .leading)
    }

    private func pathExplanation(_ path: PsycheConstellation.GrowthSuggestion) -> some View {
        Text(path.description)
            .font(.system(size: 15, weight: .regular))
            .lineSpacing(6)
            .foregroundStyle(BenyuanColor.textSecondary)
    }

    private func pathExpectedEffect(_ path: PsycheConstellation.GrowthSuggestion, step: String) -> String {
        let markers = ["这样做会", "会让你", "帮助你", "从而", "用来"]
        for marker in markers {
            if let range = step.range(of: marker) {
                let effect = String(step[range.lowerBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
                if effect.count >= 8 {
                    return effect
                }
            }
        }
        if path.description.contains("边界") {
            return "这样做会让边界从撤退变成可沟通的坐标，减少关系里的误读。"
        }
        if path.description.contains("行动") || path.description.contains("现实") {
            return "这样做会让理解落到现实动作里，减少只在脑内反复校准的消耗。"
        }
        if path.description.contains("情绪") || path.description.contains("感受") {
            return "这样做会让模糊感受变得可辨认，避免它只在身体里反复回放。"
        }
        return "这样做会让这条路径从理解变成可观察的小变化，而不是停留在一句漂亮建议里。"
    }

    private func resonances(_ data: PsycheConstellation) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            Text("继续共鸣")
                .font(.system(size: 13, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold)
            Text("这些不是泛泛的书影音清单，而是这张星图的外部回声：每一项都说明它为什么会和你的精神结构发生共振。")
                .font(.system(size: 14, weight: .regular))
                .lineSpacing(6)
                .foregroundStyle(BenyuanColor.textSecondary)
            resonanceLine(
                "书籍",
                items: data.recommendations.books.prefix(2).map {
                    BenyuanResonanceItem(title: "\($0.title) · \($0.author)", reason: $0.reason)
                }
            )
            resonanceLine(
                "电影",
                items: data.recommendations.films.prefix(2).map {
                    BenyuanResonanceItem(title: "\($0.title) · \($0.director)", reason: $0.reason)
                }
            )
            resonanceLine(
                "音乐",
                items: data.recommendations.music.prefix(2).map {
                    BenyuanResonanceItem(title: "\($0.artist) · \($0.album)", reason: $0.reason)
                }
            )
        }
    }

    private func resonanceLine(_ label: String, items: [BenyuanResonanceItem]) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x2) {
            Text(label)
                .font(.system(size: 13, weight: .bold))
                .foregroundStyle(BenyuanColor.textTertiary)
            ForEach(items) { item in
                resonanceItem(item)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(BenyuanSpacing.x4)
        .background(RoundedRectangle(cornerRadius: 22, style: .continuous).fill(BenyuanColor.glassFill))
    }

    private func resonanceItem(_ item: BenyuanResonanceItem) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(item.title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(BenyuanColor.textPrimary)
            Text(item.reason)
                .font(.system(size: 13, weight: .regular))
                .lineSpacing(5)
                .foregroundStyle(BenyuanColor.textSecondary)
        }
        .padding(.top, BenyuanSpacing.x1)
    }

    private var closing: some View {
        let closingMode = (model.constellation?.psycheConstellation).map { celestialMode(for: $0.archetype) } ?? .farTideMoon

        return BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            let pulse = 0.5 + 0.5 * sin(phase * 0.38)

            ZStack {
                BenyuanConstellationDeepFieldMask(progress: 0.82)
                    .clipShape(RoundedRectangle(cornerRadius: 42, style: .continuous))

                VStack(spacing: BenyuanSpacing.x4) {
                    BenyuanConstellationClosingBody(phase: phase, pulse: pulse, mode: closingMode)

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

    private func finalDock(bottomEdgeOffset: CGFloat) -> some View {
        BenyuanConstellationActionDock(
            bottomEdgeOffset: bottomEdgeOffset,
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

struct BenyuanConstellationClosingBody: View {
    let phase: TimeInterval
    let pulse: Double
    let mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                closingOrbit(index: index)
            }

            BenyuanDeepCelestialBody(size: 116, progress: 0.86, mode: mode)
        }
        .frame(height: 164)
    }

    private func closingOrbit(index: Int) -> some View {
        let trimEnd = 0.64 + pulse * 0.08
        let opacity = 0.11 + Double(index) * 0.045
        let width = 150 + CGFloat(index) * 42
        let height = 48 + CGFloat(index) * 16
        let rotation = -18 + Double(index) * 18 + phase * (1.0 + Double(index) * 0.36)

        return Ellipse()
            .trim(from: 0.08, to: trimEnd)
            .stroke(
                BenyuanColor.accentGold.opacity(opacity),
                style: StrokeStyle(lineWidth: 1, lineCap: .round, dash: index == 2 ? [3, 16] : [])
            )
            .frame(width: width, height: height)
            .rotationEffect(.degrees(rotation))
    }
}

private struct BenyuanResonanceItem: Identifiable {
    let title: String
    let reason: String

    var id: String { "\(title)-\(reason)" }
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

private struct BenyuanDimensionInsight {
    let conclusion: String
    let defense: String
    let blindSpot: String
    let direction: String
}

struct BenyuanConstellationActionDock: View {
    let bottomEdgeOffset: CGFloat
    let onShare: () -> Void
    let onSave: () -> Void
    let onRestart: () -> Void

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 24) { phase in
            let pulse = 0.5 + 0.5 * sin(phase * 0.44)
            let backgroundHeight = 110 + bottomEdgeOffset
            let solidStart = min(0.62, max(0.36, 48 / max(backgroundHeight, 1)))

            ZStack(alignment: .bottom) {
                Rectangle()
                    .fill(
                        LinearGradient(
                            gradient: Gradient(stops: [
                                .init(color: BenyuanColor.bgVoid.opacity(0), location: 0),
                                .init(color: BenyuanColor.bgVoid.opacity(0.78), location: solidStart * 0.62),
                                .init(color: BenyuanColor.bgVoid, location: solidStart),
                                .init(color: BenyuanColor.bgVoid, location: 1)
                            ]),
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .frame(height: backgroundHeight)
                .offset(y: bottomEdgeOffset)
                .ignoresSafeArea(edges: .bottom)
                .allowsHitTesting(false)

                Ellipse()
                    .fill(
                        RadialGradient(
                            colors: [
                                BenyuanColor.accentGold.opacity(0.045 + pulse * 0.025),
                                BenyuanColor.accentGold.opacity(0.014),
                                .clear
                            ],
                            center: .center,
                            startRadius: 0,
                            endRadius: 130
                        )
                    )
                    .frame(width: 250 + pulse * 32, height: 38)
                    .blur(radius: 14)
                    .blendMode(BlendMode.screen)
                    .offset(y: -74)
                    .allowsHitTesting(false)

                HStack(spacing: BenyuanSpacing.x3) {
                    dockButton("分享", phase: phase, offset: 0, action: onShare)
                    dockButton("保存", phase: phase, offset: 1.2, action: onSave)
                    dockButton("重新探索", phase: phase, offset: 2.4, action: onRestart)
                }
                .padding(.horizontal, BenyuanSpacing.x4)
                .padding(.top, BenyuanSpacing.x3)
                .padding(.bottom, 0)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottom)
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

struct BenyuanConstellationArchetypeField: View {
    var progress: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        ZStack {
            BenyuanConstellationBaseField(progress: progress, mode: mode)

            switch mode {
            case .starMapArchitect:
                BenyuanArchetypeStarMapField(progress: progress)
            case .moonHarbor:
                BenyuanArchetypeHarborField(progress: progress)
            case .existentialNomad:
                BenyuanArchetypeNomadField(progress: progress)
            case .rainWindowScribe:
                BenyuanArchetypeRainField(progress: progress)
            case .eventHorizonDiver:
                BenyuanArchetypeEventHorizonField(progress: progress)
            case .nebulaWeaver:
                BenyuanArchetypeNebulaField(progress: progress)
            case .solarCorona:
                BenyuanArchetypeSolarField(progress: progress)
            case .terrestrialPlanet:
                BenyuanArchetypeTerrestrialField(progress: progress)
            case .deepSpaceAnchor:
                BenyuanArchetypeAnchorField(progress: progress)
            default:
                BenyuanArchetypeMoonTideField(progress: progress)
            }
        }
        .allowsHitTesting(false)
    }
}

struct BenyuanConstellationSubjectIsolationField: View {
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        ZStack {
            Ellipse()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.aubergineBlack.opacity(0.42),
                            BenyuanColor.bgVoid.opacity(0.30),
                            mode.subjectIsolationAccent.opacity(0.045),
                            .clear
                        ],
                        center: .center,
                        startRadius: 10,
                        endRadius: 152
                    )
                )
                .frame(width: 286, height: mode.subjectIsolationHeight)
                .blur(radius: 16)
                .blendMode(.plusLighter)

            Ellipse()
                .stroke(
                    LinearGradient(
                        colors: [
                            .clear,
                            mode.subjectIsolationAccent.opacity(0.16),
                            BenyuanColor.textPrimary.opacity(0.05),
                            .clear
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    ),
                    lineWidth: 1
                )
                .frame(width: 286, height: mode.subjectIsolationHeight * 0.72)
                .blur(radius: 0.7)
                .opacity(mode.subjectIsolationRingOpacity)
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

struct BenyuanConstellationBaseField: View {
    var progress: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            let pulse = 0.5 + 0.5 * sin(phase * 0.46)
            let clamped = min(max(progress, 0.12), 1)

            GeometryReader { proxy in
                let width = proxy.size.width
                let height = proxy.size.height

                ZStack {
                    RadialGradient(
                        colors: baseGradientColors(pulse: pulse, progress: clamped),
                        center: baseGradientCenter,
                        startRadius: 10,
                        endRadius: max(width, height) * 0.92
                    )

                    baseOccludingShape(width: width, height: height, pulse: pulse)

                    if usesSparseStarDrift {
                        BenyuanSparseStarDrift(width: width, height: height, phase: phase, progress: clamped)
                    }
                }
            }
        }
    }

    private var baseGradientCenter: UnitPoint {
        switch mode {
        case .eventHorizonDiver: return UnitPoint(x: 0.48, y: 0.34)
        case .nebulaWeaver: return UnitPoint(x: 0.42, y: 0.36)
        case .solarCorona: return UnitPoint(x: 0.50, y: 0.35)
        case .moonHarbor: return UnitPoint(x: 0.30, y: 0.30)
        case .rainWindowScribe: return UnitPoint(x: 0.34, y: 0.26)
        case .deepSpaceAnchor: return UnitPoint(x: 0.48, y: 0.46)
        default: return UnitPoint(x: 0.62, y: 0.18)
        }
    }

    private var usesSparseStarDrift: Bool {
        switch mode {
        case .rainWindowScribe, .moonHarbor:
            return false
        default:
            return true
        }
    }

    private func baseGradientColors(pulse: Double, progress: Double) -> [Color] {
        switch mode {
        case .eventHorizonDiver:
            return [
                BenyuanColor.bgVoid.opacity(0.98),
                BenyuanColor.aubergineBlack.opacity(0.76),
                BenyuanColor.planetEdge.opacity(0.18 + pulse * 0.04),
                BenyuanColor.bgVoid.opacity(0.98)
            ]
        case .nebulaWeaver:
            return [
                BenyuanColor.textPrimary.opacity(0.16 + pulse * 0.03),
                BenyuanColor.nebulaViolet.opacity(0.22 + progress * 0.05),
                BenyuanColor.planetEdge.opacity(0.12),
                BenyuanColor.bgVoid.opacity(0.96)
            ]
        case .solarCorona:
            return [
                BenyuanColor.accentGold.opacity(0.18 + pulse * 0.07),
                BenyuanColor.planetEdge.opacity(0.18),
                BenyuanColor.aubergineBlack.opacity(0.68),
                BenyuanColor.bgVoid.opacity(0.96)
            ]
        case .terrestrialPlanet:
            return [
                BenyuanColor.textPrimary.opacity(0.10 + pulse * 0.03),
                BenyuanColor.planetEdge.opacity(0.20),
                BenyuanColor.accentGold.opacity(0.07 + progress * 0.03),
                BenyuanColor.bgVoid.opacity(0.96)
            ]
        case .deepSpaceAnchor:
            return [
                BenyuanColor.textPrimary.opacity(0.09),
                BenyuanColor.lunarBlueDeep.opacity(0.20),
                BenyuanColor.aubergineBlack.opacity(0.62),
                BenyuanColor.bgVoid.opacity(0.98)
            ]
        case .rainWindowScribe:
            return [
                BenyuanColor.textPrimary.opacity(0.09),
                BenyuanColor.lunarBlueDeep.opacity(0.26),
                BenyuanColor.bgVoid.opacity(0.96)
            ]
        default:
            return [
                BenyuanColor.planetEdge.opacity(0.30 + pulse * 0.05),
                BenyuanColor.nebulaViolet.opacity(0.11 + progress * 0.03),
                BenyuanColor.bgVoid.opacity(0.78),
                BenyuanColor.bgVoid.opacity(0.97)
            ]
        }
    }

    @ViewBuilder
    private func baseOccludingShape(width: CGFloat, height: CGFloat, pulse: Double) -> some View {
        switch mode {
        case .eventHorizonDiver:
            Circle()
                .fill(BenyuanColor.bgVoid.opacity(0.90))
                .frame(width: min(width, height) * 0.56, height: min(width, height) * 0.56)
                .blur(radius: 11)
                .position(x: width * 0.50, y: height * 0.34)
        case .nebulaWeaver, .solarCorona, .starMapArchitect, .rainWindowScribe, .moonHarbor, .existentialNomad, .deepSpaceAnchor:
            EmptyView()
        default:
            let planetSize = min(width * 0.76, height * 0.58)
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.bgVoid.opacity(0.74),
                            BenyuanColor.aubergineBlack.opacity(0.42),
                            .clear
                        ],
                        center: .center,
                        startRadius: planetSize * 0.12,
                        endRadius: planetSize * 0.58
                    )
                )
                .frame(width: planetSize, height: planetSize)
                .blur(radius: 18)
                .position(x: width * (0.82 + pulse * 0.01), y: -height * 0.02)
        }
    }
}

struct BenyuanSparseStarDrift: View {
    var width: CGFloat
    var height: CGFloat
    var phase: TimeInterval
    var progress: Double

    private let points: [(CGFloat, CGFloat, CGFloat)] = [
        (0.16, 0.32, 0.20), (0.28, 0.64, 0.46), (0.38, 0.28, 0.70),
        (0.48, 0.56, 0.34), (0.58, 0.42, 0.62), (0.70, 0.68, 0.38),
        (0.82, 0.34, 0.54), (0.22, 0.78, 0.66), (0.76, 0.52, 0.26)
    ]

    var body: some View {
        ZStack {
            ForEach(points.indices, id: \.self) { index in
                let point = points[index]
                let drift = sin(phase * (0.14 + Double(point.2) * 0.16) + Double(index))
                Circle()
                    .fill(index.isMultiple(of: 3) ? BenyuanColor.accentGold.opacity(0.22 + progress * 0.08) : BenyuanColor.textPrimary.opacity(0.10 + progress * 0.05))
                    .frame(width: 2.2 + point.2 * 2.4, height: 2.2 + point.2 * 2.4)
                    .position(
                        x: width * point.0 + CGFloat(drift) * width * 0.012,
                        y: height * point.1 - CGFloat(drift) * height * 0.010
                    )
                    .blur(radius: point.2 > 0.6 ? 0.2 : 0.7)
            }
        }
    }
}

struct BenyuanArchetypeMoonTideField: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            let pulse = 0.5 + 0.5 * sin(phase * 0.38)

            ZStack {
                ForEach(0..<5, id: \.self) { index in
                    Path { path in
                        let y = 170 + CGFloat(index) * 28
                        path.move(to: CGPoint(x: 20, y: y))
                        for step in 0...28 {
                            let x = 20 + CGFloat(step) * 13
                            let wave = sin(Double(step) * 0.54 + phase * (0.24 + Double(index) * 0.04))
                            path.addLine(to: CGPoint(x: x, y: y + CGFloat(wave) * 4))
                        }
                    }
                    .stroke(BenyuanColor.textPrimary.opacity(0.04 + Double(index) * 0.012), lineWidth: index == 2 ? 1.5 : 0.9)
                    .blur(radius: CGFloat(index % 2) * 0.4)
                }

                Circle()
                    .fill(BenyuanColor.textPrimary.opacity(0.08 + pulse * 0.03))
                    .frame(width: 132, height: 132)
                    .offset(x: -94, y: -116)
                    .blur(radius: 22)
                    .blendMode(.screen)
            }
        }
    }
}

struct BenyuanArchetypeStarMapField: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            ZStack {
                ForEach(0..<4, id: \.self) { index in
                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .stroke(
                            BenyuanColor.textPrimary.opacity(0.045 + Double(index) * 0.014),
                            style: StrokeStyle(lineWidth: 0.9, dash: index.isMultiple(of: 2) ? [4, 14] : [])
                        )
                        .frame(width: 150 + CGFloat(index) * 54, height: 98 + CGFloat(index) * 42)
                        .rotationEffect(.degrees(-18 + Double(index) * 14 + phase * (0.25 + Double(index) * 0.06)))
                        .offset(x: CGFloat(index - 1) * 18, y: CGFloat(index - 2) * 18)
                }

                Path { path in
                    let points = [
                        CGPoint(x: 66, y: 128), CGPoint(x: 168, y: 82), CGPoint(x: 294, y: 134),
                        CGPoint(x: 320, y: 270), CGPoint(x: 188, y: 306), CGPoint(x: 76, y: 240)
                    ]
                    guard let first = points.first else { return }
                    path.move(to: first)
                    for point in points.dropFirst() {
                        path.addLine(to: point)
                    }
                    path.closeSubpath()
                }
                .stroke(BenyuanColor.accentGold.opacity(0.17 + progress * 0.08), lineWidth: 1.3)
                .offset(x: -32, y: -18)
            }
        }
    }
}

struct BenyuanArchetypeHarborField: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            ZStack {
                ForEach(0..<6, id: \.self) { index in
                    Path { path in
                        let y = 170 + CGFloat(index) * 24
                        path.move(to: CGPoint(x: -20, y: y))
                        path.addQuadCurve(
                            to: CGPoint(x: 420, y: y + CGFloat(sin(phase * 0.2 + Double(index))) * 7),
                            control: CGPoint(x: 196, y: y + 18 + CGFloat(index) * 2)
                        )
                    }
                    .stroke(BenyuanColor.textPrimary.opacity(0.045 + Double(index) * 0.014), lineWidth: index == 3 ? 1.5 : 0.9)
                }

                Path { path in
                    path.move(to: CGPoint(x: 46, y: 264))
                    path.addLine(to: CGPoint(x: 210, y: 264))
                    path.move(to: CGPoint(x: 84, y: 264))
                    path.addLine(to: CGPoint(x: 84, y: 356))
                    path.move(to: CGPoint(x: 164, y: 264))
                    path.addLine(to: CGPoint(x: 164, y: 338))
                }
                .stroke(BenyuanColor.accentGold.opacity(0.30 + progress * 0.08), style: StrokeStyle(lineWidth: 1.5, lineCap: .round))

                Circle()
                    .fill(BenyuanColor.accentGold.opacity(0.46))
                    .frame(width: 18, height: 18)
                    .offset(x: 96, y: 18)
                    .blur(radius: 4)
            }
        }
    }
}

struct BenyuanArchetypeNomadField: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            ZStack {
                ForEach(0..<5, id: \.self) { index in
                    Path { path in
                        path.move(to: CGPoint(x: -20, y: 250 + CGFloat(index) * 34))
                        path.addCurve(
                            to: CGPoint(x: 430, y: 80 + CGFloat(index) * 36),
                            control1: CGPoint(x: 104, y: 226 - CGFloat(index) * 12),
                            control2: CGPoint(x: 246, y: 48 + CGFloat(index) * 24)
                        )
                    }
                    .stroke(
                        LinearGradient(
                            colors: [
                                .clear,
                                BenyuanColor.textPrimary.opacity(0.08 + Double(index) * 0.014),
                                BenyuanColor.accentGold.opacity(0.14 + progress * 0.05),
                                .clear
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        style: StrokeStyle(lineWidth: index == 2 ? 1.5 : 0.9, lineCap: .round, dash: index == 0 ? [5, 16] : [])
                    )
                    .rotationEffect(.degrees(sin(phase * 0.18 + Double(index)) * 2.6))
                }

                Circle()
                    .fill(BenyuanColor.accentGold.opacity(0.42))
                    .frame(width: 9, height: 9)
                    .offset(x: -74 + CGFloat(sin(phase * 0.18)) * 12, y: 10)
            }
        }
    }
}

struct BenyuanArchetypeRainField: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            ZStack {
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .stroke(BenyuanColor.textPrimary.opacity(0.055 + progress * 0.03), lineWidth: 1)
                    .frame(width: 280, height: 214)
                    .offset(y: -46)

                Path { path in
                    path.move(to: CGPoint(x: 60, y: 88))
                    path.addLine(to: CGPoint(x: 60, y: 304))
                    path.move(to: CGPoint(x: 200, y: 88))
                    path.addLine(to: CGPoint(x: 200, y: 304))
                    path.move(to: CGPoint(x: 20, y: 188))
                    path.addLine(to: CGPoint(x: 340, y: 188))
                }
                .stroke(BenyuanColor.textPrimary.opacity(0.055), lineWidth: 1)

                ForEach(0..<18, id: \.self) { index in
                    let fall = CGFloat((phase * (0.045 + Double(index % 5) * 0.008) + Double(index) * 0.13).truncatingRemainder(dividingBy: 1))
                    Capsule()
                        .fill(BenyuanColor.textPrimary.opacity(0.10 + progress * 0.04))
                        .frame(width: 1, height: 34 + CGFloat(index % 3) * 12)
                        .offset(x: -146 + CGFloat(index) * 18, y: -146 + fall * 360)
                        .blur(radius: 0.3)
                }
            }
        }
    }
}

struct BenyuanArchetypeEventHorizonField: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            ZStack {
                Circle()
                    .fill(BenyuanColor.bgVoid.opacity(0.86))
                    .frame(width: 260, height: 260)
                    .blur(radius: 8)
                    .offset(y: -32)

                ForEach(0..<4, id: \.self) { index in
                    Ellipse()
                        .stroke(
                            AngularGradient(
                                colors: [
                                    .clear,
                                    BenyuanColor.accentGold.opacity(0.12 + progress * 0.05),
                                    BenyuanColor.textPrimary.opacity(0.10),
                                    .clear
                                ],
                                center: .center,
                                angle: .degrees(phase * (5 + Double(index)))
                            ),
                            style: StrokeStyle(lineWidth: index == 0 ? 1.8 : 1.0, lineCap: .round)
                        )
                        .frame(width: 330 + CGFloat(index) * 34, height: 86 + CGFloat(index) * 16)
                        .rotationEffect(.degrees(-14 + Double(index) * 13 + phase * (1.2 + Double(index) * 0.3)))
                        .blur(radius: index == 3 ? 0.9 : 0.2)
                }
            }
        }
    }
}

struct BenyuanArchetypeNebulaField: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            ZStack {
                ForEach(0..<9, id: \.self) { index in
                    let drift = sin(phase * (0.10 + Double(index) * 0.018) + Double(index))
                    Ellipse()
                        .fill(
                            RadialGradient(
                                colors: [
                                    (index.isMultiple(of: 2) ? BenyuanColor.nebulaViolet : BenyuanColor.textPrimary).opacity(0.10 + progress * 0.07),
                                    .clear
                                ],
                                center: .center,
                                startRadius: 1,
                                endRadius: 120
                            )
                        )
                        .frame(width: 230 + CGFloat(index % 3) * 56, height: 70 + CGFloat(index % 4) * 26)
                        .offset(x: CGFloat(drift) * 32 + CGFloat(index % 3 - 1) * 38, y: CGFloat(index / 3 - 1) * 44)
                        .rotationEffect(.degrees(-28 + Double(index) * 17 + phase * (0.7 + Double(index) * 0.10)))
                        .blur(radius: 11)
                        .blendMode(.screen)
                }
            }
        }
    }
}

struct BenyuanArchetypeSolarField: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            ZStack {
                Circle()
                    .fill(BenyuanColor.accentGold.opacity(0.07 + progress * 0.04))
                    .frame(width: 310, height: 310)
                    .blur(radius: 34)

                ForEach(0..<22, id: \.self) { index in
                    let angle = Double(index) / 22 * .pi * 2 + phase * 0.10
                    Capsule()
                        .fill(BenyuanColor.accentGold.opacity(0.16 + progress * 0.08))
                        .frame(width: 80 + CGFloat(index % 4) * 15, height: index.isMultiple(of: 4) ? 2.4 : 1.4)
                        .offset(x: cos(angle) * 136, y: sin(angle) * 136)
                        .rotationEffect(.radians(angle))
                        .blur(radius: index.isMultiple(of: 4) ? 0.2 : 0.8)
                        .blendMode(.screen)
                }
            }
        }
    }
}

struct BenyuanArchetypeTerrestrialField: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            ZStack {
                ForEach(0..<4, id: \.self) { index in
                    Ellipse()
                        .stroke(BenyuanColor.textPrimary.opacity(0.05 + Double(index) * 0.012), lineWidth: 1)
                        .frame(width: 250 + CGFloat(index) * 48, height: 58 + CGFloat(index) * 20)
                        .rotationEffect(.degrees(-24 + Double(index) * 18 + phase * (0.6 + Double(index) * 0.16)))
                }

                ForEach(0..<7, id: \.self) { index in
                    RoundedRectangle(cornerRadius: 3, style: .continuous)
                        .fill(BenyuanColor.accentGold.opacity(0.16 + progress * 0.10))
                        .frame(width: 14 + CGFloat(index % 2) * 6, height: 4 + CGFloat(index % 3) * 2)
                        .offset(x: -132 + CGFloat(index) * 42, y: 118 + CGFloat(sin(phase * 0.18 + Double(index))) * 5)
                        .blur(radius: 0.35)
                }
            }
        }
    }
}

struct BenyuanArchetypeAnchorField: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
            ZStack {
                ForEach(0..<5, id: \.self) { index in
                    let extent = 84 + CGFloat(index) * 34
                    Path { path in
                        path.move(to: CGPoint(x: 0, y: -extent))
                        path.addLine(to: CGPoint(x: 0, y: extent))
                        path.move(to: CGPoint(x: -extent, y: 0))
                        path.addLine(to: CGPoint(x: extent, y: 0))
                    }
                    .stroke(
                        BenyuanColor.textPrimary.opacity(0.035 + Double(index) * 0.012),
                        style: StrokeStyle(lineWidth: 0.8, lineCap: .round, dash: index > 2 ? [2, 14] : [])
                    )
                    .rotationEffect(.degrees(45 + Double(index) * 11 + phase * (0.22 + Double(index) * 0.06)))
                }

                Path { path in
                    path.move(to: CGPoint(x: 0, y: -96))
                    path.addLine(to: CGPoint(x: 0, y: 96))
                    path.move(to: CGPoint(x: -42, y: 32))
                    path.addQuadCurve(to: CGPoint(x: 42, y: 32), control: CGPoint(x: 0, y: 118))
                    path.move(to: CGPoint(x: -64, y: -8))
                    path.addLine(to: CGPoint(x: 64, y: -8))
                }
                .stroke(BenyuanColor.accentGold.opacity(0.24 + progress * 0.08), style: StrokeStyle(lineWidth: 1.6, lineCap: .round))
                .offset(x: -138, y: -98)
            }
        }
    }
}

struct BenyuanConstellationDeepFieldMask: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
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
        BenyuanMotionTimeline(preferredFramesPerSecond: 18) { phase in

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
        BenyuanMotionTimeline(preferredFramesPerSecond: 16) { phase in
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
