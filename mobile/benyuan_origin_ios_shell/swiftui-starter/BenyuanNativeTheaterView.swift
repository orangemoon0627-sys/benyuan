import SwiftUI

struct BenyuanNativeTheaterView: View {
    @ObservedObject var model: BenyuanNativeFlowModel
    @State private var novaBurstToken = 0
    @State private var novaBurstOptionId: String?
    @State private var selectedTheaterResponse: String?
    @State private var selectedMirrorResponse: String?

    var body: some View {
        VStack(spacing: 0) {
            BenyuanNativeTopBar(progress: theaterProgress, label: "月下剧场")

            GeometryReader { proxy in
                ZStack(alignment: .top) {
                    BenyuanTheaterAtmosphereLayer(progress: theaterProgress)
                        .frame(height: max(260, proxy.size.height * 0.44))
                        .padding(.top, proxy.size.height * 0.10)
                        .allowsHitTesting(false)
                    BenyuanFlowOrbitTrail(progress: theaterProgress, intensity: 0.46, tilt: -8)
                        .frame(height: max(260, proxy.size.height * 0.46))
                        .padding(.top, proxy.size.height * 0.11)
                        .allowsHitTesting(false)
                    BenyuanMomentaryChoiceFeedback(isActive: model.selectedTheaterOptionId != nil || model.selectedMirrorOptionId != nil)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                        .allowsHitTesting(false)

                    ScrollView(showsIndicators: false) {
                        phaseContent
                            .id(model.theaterPhase)
                            .transition(.opacity.combined(with: .move(edge: .bottom)))
                            .frame(minHeight: max(560, proxy.size.height - BenyuanSpacing.x4), alignment: .top)
                            .padding(.horizontal, BenyuanSpacing.x4)
                            .padding(.top, BenyuanSpacing.x4)
                            .padding(.bottom, BenyuanSpacing.x8)
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var phaseContent: some View {
        switch model.theaterPhase {
        case .act1:
            act1
        case .act2:
            act2
        case .act3:
            act3
        case .epilogue:
            epilogue
        }
    }

    private var theaterProgress: Double {
        switch model.theaterPhase {
        case .act1: return 0.18
        case .act2:
            let total = max(1, model.theater?.theaterScript.act2.choices.count ?? 1)
            return 0.25 + Double(model.theaterChoiceIndex) / Double(total) * 0.3
        case .act3:
            let total = max(1, model.theater?.theaterScript.act3.mirrorQuestions.count ?? 1)
            return 0.62 + Double(model.theaterMirrorIndex) / Double(total) * 0.2
        case .epilogue: return 0.94
        }
    }

    private var act1: some View {
        BenyuanRevealedStack(spacing: BenyuanSpacing.x4) {
            theaterStageRail
            theaterLensCard(
                eyebrow: "ACT I · 入场",
                title: displayText(model.theater?.theaterScript.act1.sceneDescription, fallback: "剧场正在靠近。"),
                detail: keyThemeText,
                mode: .theaterNebula,
                progress: theaterProgress
            )
            Spacer(minLength: BenyuanSpacing.x4)
            BenyuanNativePrimaryButton(title: "进入这一幕") {
                model.enterAct2()
            }
        }
    }

    @ViewBuilder
    private var act2: some View {
        if let choice = model.currentTheaterChoice {
            BenyuanRevealedStack(spacing: BenyuanSpacing.x4) {
                theaterStageRail
                theaterLensCard(
                    eyebrow: "ACT II · 分岔 \(model.theaterChoiceIndex + 1)",
                    title: displayText(choice.scene, fallback: "这一幕正在显影。"),
                    detail: selectedTheaterResponse ?? "选项会改变这座剧场的下一层光线。",
                    mode: .deepSpace,
                    progress: theaterProgress
                )
                VStack(spacing: BenyuanSpacing.x3) {
                    ForEach(Array(choice.options.enumerated()), id: \.element.id) { index, option in
                        BenyuanNativeOptionButton(index: index, title: displayText(option.text, fallback: "沿着这条轨道靠近"), active: model.selectedTheaterOptionId == option.id) {
                            selectedTheaterResponse = displayText(option.response, fallback: "剧场记下了这一次靠近。")
                            novaBurstOptionId = option.id
                            novaBurstToken += 1
                            model.chooseAct2(option)
                        }
                        .overlay(BenyuanSelectionPulseLayer(isActive: model.selectedTheaterOptionId == option.id, cornerRadius: 24))
                        .overlay(BenyuanNovaSelectionBurst(trigger: novaBurstOptionId == option.id ? novaBurstToken : 0))
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                    }
                }
                .padding(.top, BenyuanSpacing.x1)
                Spacer()
            }
            .id("act2-\(model.theaterChoiceIndex)")
            .onChange(of: model.theaterChoiceIndex) { _ in
                selectedTheaterResponse = nil
            }
        }
    }

    @ViewBuilder
    private var act3: some View {
        if let question = model.currentMirrorQuestion {
            BenyuanRevealedStack(spacing: BenyuanSpacing.x4) {
                theaterStageRail
                theaterLensCard(
                    eyebrow: "ACT III · 镜面 \(model.theaterMirrorIndex + 1)",
                    title: displayText(question.question, fallback: "让镜面停在一个方向上："),
                    detail: selectedMirrorResponse ?? displayText(question.dialogue, fallback: "镜面把刚才的选择轻轻推近。"),
                    mode: .accretionBlackHole,
                    progress: theaterProgress
                )
                VStack(spacing: BenyuanSpacing.x3) {
                    ForEach(Array(question.options.enumerated()), id: \.element.id) { index, option in
                        BenyuanNativeOptionButton(index: index, title: displayText(option.text, fallback: "把它交给这条回声"), active: model.selectedMirrorOptionId == option.id) {
                            selectedMirrorResponse = "镜面记下了这一种保护自己的方式。"
                            novaBurstOptionId = option.id
                            novaBurstToken += 1
                            model.chooseAct3(option)
                        }
                        .overlay(BenyuanSelectionPulseLayer(isActive: model.selectedMirrorOptionId == option.id, cornerRadius: 24))
                        .overlay(BenyuanNovaSelectionBurst(trigger: novaBurstOptionId == option.id ? novaBurstToken : 0))
                        .transition(.opacity.combined(with: .move(edge: .trailing)))
                    }
                }
                Spacer()
            }
            .id("act3-\(model.theaterMirrorIndex)")
            .onChange(of: model.theaterMirrorIndex) { _ in
                selectedMirrorResponse = nil
            }
        }
    }

    private var epilogue: some View {
        BenyuanRevealedStack(spacing: BenyuanSpacing.x4) {
            theaterStageRail
            theaterLensCard(
                eyebrow: "EPILOGUE · 折入星图",
                title: "星图正在靠近。",
                detail: displayText(model.theater?.theaterScript.epilogue.closingText, fallback: "最后一镜落下，精神坐标开始显形。"),
                mode: .theaterNebula,
                progress: theaterProgress
            )
            Spacer(minLength: BenyuanSpacing.x4)
            BenyuanNativePrimaryButton(title: "生成我的星图") {
                Task { await model.finishTheaterAndGenerateConstellation() }
            }
        }
    }

    private var theaterStageRail: some View {
        HStack(spacing: BenyuanSpacing.x2) {
            ForEach(theaterStages) { stage in
                theaterStageChip(stage)
            }
        }
        .padding(.horizontal, BenyuanSpacing.x1)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("剧场进度")
    }

    private func theaterStageChip(_ stage: TheaterStage) -> some View {
        let state = theaterStageState(stage.phase)

        return VStack(alignment: .leading, spacing: 7) {
            HStack(spacing: 6) {
                Circle()
                    .fill(state == .active ? BenyuanColor.accentGold : state == .done ? BenyuanColor.textPrimary.opacity(0.72) : BenyuanColor.textTertiary.opacity(0.28))
                    .frame(width: state == .active ? 6 : 4, height: state == .active ? 6 : 4)
                    .shadow(color: BenyuanColor.accentGold.opacity(state == .active ? 0.42 : 0), radius: 8)

                Text(stage.label)
                    .font(.system(size: 9, weight: .black, design: .monospaced))
                    .lineLimit(1)
                    .minimumScaleFactor(0.72)
                    .foregroundStyle(state == .active ? BenyuanColor.accentGold : state == .done ? BenyuanColor.textPrimary.opacity(0.72) : BenyuanColor.textTertiary.opacity(0.54))
            }

            Capsule()
                .fill(state == .active ? BenyuanColor.accentGold.opacity(0.82) : state == .done ? BenyuanColor.textPrimary.opacity(0.20) : BenyuanColor.textPrimary.opacity(0.055))
                .frame(height: state == .active ? 2 : 1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 9)
        .padding(.vertical, 9)
        .background(
            RoundedRectangle(cornerRadius: 17, style: .continuous)
                .fill(state == .active ? BenyuanColor.glassFillStrong.opacity(1.08) : BenyuanColor.glassFill.opacity(0.72))
                .overlay(
                    RoundedRectangle(cornerRadius: 17, style: .continuous)
                        .stroke(state == .active ? BenyuanColor.accentGold.opacity(0.22) : BenyuanColor.glassStroke.opacity(0.74), lineWidth: 1)
                )
        )
    }

    private func theaterLensCard(eyebrow: String, title: String, detail: String, mode: BenyuanDeepCelestialBody.Mode, progress: Double) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            ZStack(alignment: .bottomLeading) {
                BenyuanTheaterScenePortal(progress: progress, mode: mode)
                    .frame(height: 252)
                    .clipShape(RoundedRectangle(cornerRadius: 34, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 34, style: .continuous)
                            .stroke(BenyuanColor.glassStroke.opacity(0.84), lineWidth: 1)
                    )

                LinearGradient(
                    colors: [
                        .clear,
                        BenyuanColor.bgVoid.opacity(0.38),
                        BenyuanColor.bgVoid.opacity(0.82)
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .clipShape(RoundedRectangle(cornerRadius: 34, style: .continuous))

                VStack(alignment: .leading, spacing: BenyuanSpacing.x2) {
                    Text(eyebrow)
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                        .foregroundStyle(BenyuanColor.accentGold.opacity(0.92))
                    Text(title)
                        .font(.system(size: theaterTitleSize(title), weight: .semibold))
                        .lineSpacing(4)
                        .foregroundStyle(BenyuanColor.textPrimary)
                        .minimumScaleFactor(0.76)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(BenyuanSpacing.x4)
            }
            .shadow(color: BenyuanColor.bgVoid.opacity(0.48), radius: 26, y: 18)

            theaterEchoPanel(detail)
        }
    }

    private func theaterEchoPanel(_ detail: String) -> some View {
        HStack(alignment: .top, spacing: BenyuanSpacing.x3) {
            ZStack {
                Circle()
                    .stroke(BenyuanColor.accentGold.opacity(0.22), lineWidth: 1)
                Circle()
                    .fill(BenyuanColor.accentGold.opacity(0.72))
                    .frame(width: 5, height: 5)
            }
            .frame(width: 22, height: 22)
            .padding(.top, 1)

            Text(detail)
                .font(.system(size: 14, weight: .regular))
                .lineSpacing(5)
                .foregroundStyle(BenyuanColor.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(BenyuanSpacing.x4)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(BenyuanColor.glassFill.opacity(0.82))
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(BenyuanColor.glassStroke.opacity(0.72), lineWidth: 1)
                )
        )
    }

    private func theaterTitleSize(_ value: String) -> CGFloat {
        if value.count > 92 { return 19 }
        if value.count > 64 { return 22 }
        if value.count > 36 { return 25 }
        return 29
    }

    private var keyThemeText: String {
        let themes = model.theater?.theaterScript.personalizationSummary.keyThemes
            .map { $0.benyuanSanitizedVisibleText(fallback: "") }
            .filter { !$0.isEmpty }
        guard let themes, !themes.isEmpty else { return "角色 · 场景 · 回声" }
        return themes.prefix(4).joined(separator: " · ")
    }

    private func displayText(_ value: String?, fallback: String) -> String {
        value?.benyuanSanitizedVisibleText(fallback: fallback) ?? fallback
    }

    private var theaterStages: [TheaterStage] {
        [
            TheaterStage(label: "入场", phase: .act1),
            TheaterStage(label: "分岔", phase: .act2),
            TheaterStage(label: "镜面", phase: .act3),
            TheaterStage(label: "星图", phase: .epilogue)
        ]
    }

    private func theaterStageState(_ phase: BenyuanNativeTheaterPhase) -> TheaterStageState {
        let current = theaterStageRank(model.theaterPhase)
        let target = theaterStageRank(phase)
        if target < current { return .done }
        if target == current { return .active }
        return .upcoming
    }

    private func theaterStageRank(_ phase: BenyuanNativeTheaterPhase) -> Int {
        switch phase {
        case .act1: return 0
        case .act2: return 1
        case .act3: return 2
        case .epilogue: return 3
        }
    }
}

private struct TheaterStage: Identifiable {
    let label: String
    let phase: BenyuanNativeTheaterPhase

    var id: String { label }
}

private enum TheaterStageState {
    case done
    case active
    case upcoming
}

private struct BenyuanTheaterScenePortal: View {
    var progress: Double
    var mode: BenyuanDeepCelestialBody.Mode

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 24) { phase in
            let clamped = min(max(progress, 0.04), 1)
            let pulse = 0.5 + 0.5 * sin(phase * 0.38)

            GeometryReader { proxy in
                let width = max(proxy.size.width, 1)
                let height = max(proxy.size.height, 1)
                let center = CGPoint(x: width * (0.48 + clamped * 0.08), y: height * 0.43)
                let bodySize = min(width, height) * 0.52

                ZStack {
                    RoundedRectangle(cornerRadius: 34, style: .continuous)
                        .fill(
                            LinearGradient(
                                colors: [
                                    BenyuanColor.bgSurface.opacity(0.76),
                                    BenyuanColor.aubergineBlack.opacity(0.74),
                                    BenyuanColor.bgVoid.opacity(0.94)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )

                    RadialGradient(
                        colors: [
                            BenyuanColor.accentGold.opacity(0.10 + pulse * 0.05),
                            BenyuanColor.nebulaViolet.opacity(0.18),
                            .clear
                        ],
                        center: UnitPoint(x: center.x / width, y: center.y / height),
                        startRadius: 8,
                        endRadius: width * 0.74
                    )
                    .blendMode(.screen)

                    BenyuanFlowOrbitTrail(progress: clamped, intensity: 0.52, tilt: mode.tilt, preferredFramesPerSecond: 16)
                        .frame(width: width * 1.18, height: height * 0.92)
                        .position(x: width * 0.52, y: height * 0.46)
                        .opacity(0.84)

                    BenyuanDeepCelestialBody(size: bodySize, progress: clamped, mode: mode)
                        .scaleEffect(0.96 + pulse * 0.03)
                        .position(center)

                    ForEach(0..<13, id: \.self) { index in
                        let angle = phase * (0.10 + Double(index) * 0.006) + Double(index) * .pi * 2 / 13
                        let radiusX = width * (0.22 + CGFloat(index % 4) * 0.055)
                        let radiusY = height * (0.14 + CGFloat(index % 3) * 0.038)
                        Circle()
                            .fill(index.isMultiple(of: 5) ? BenyuanColor.accentGold.opacity(0.30) : BenyuanColor.textPrimary.opacity(0.12))
                            .frame(width: index.isMultiple(of: 5) ? 3.5 : 2.0, height: index.isMultiple(of: 5) ? 3.5 : 2.0)
                            .position(x: center.x + cos(angle) * radiusX, y: center.y + sin(angle) * radiusY)
                            .blur(radius: index.isMultiple(of: 5) ? 0.2 : 0.7)
                    }
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}
