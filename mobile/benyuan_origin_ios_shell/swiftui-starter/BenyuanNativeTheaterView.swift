import SwiftUI

struct BenyuanNativeTheaterView: View {
    @ObservedObject var model: BenyuanNativeFlowModel

    var body: some View {
        VStack(spacing: 0) {
            BenyuanNativeTopBar(progress: theaterProgress, label: "原生剧场")

            GeometryReader { proxy in
                ZStack(alignment: .top) {
                    BenyuanStageLens(progress: theaterProgress, intensity: 1.08)
                        .allowsHitTesting(false)
                    BenyuanFlowOrbitTrail(progress: theaterProgress, intensity: 0.76, tilt: -14)
                        .frame(height: max(260, proxy.size.height * 0.44))
                        .padding(.top, proxy.size.height * 0.10)
                        .allowsHitTesting(false)

                    ScrollView(showsIndicators: false) {
                        phaseContent
                            .frame(minHeight: max(560, proxy.size.height - BenyuanSpacing.x4), alignment: .top)
                            .padding(.horizontal, BenyuanSpacing.x4)
                            .padding(.top, BenyuanSpacing.x6)
                            .padding(.bottom, BenyuanSpacing.x8)
                    }
                }
                .id(model.theaterPhase)
                .transition(.opacity.combined(with: .scale(scale: 0.985)))
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
        BenyuanRevealedStack(spacing: BenyuanSpacing.x8) {
            Spacer(minLength: 24)
            BenyuanDeepCelestialBody(size: 136, progress: theaterProgress, mode: .constellation)
            Text(model.theater?.theaterScript.act1.sceneDescription ?? "剧场正在靠近。")
                .font(.system(size: theaterTitleSize(model.theater?.theaterScript.act1.sceneDescription ?? ""), weight: .black))
                .lineSpacing(2)
                .foregroundStyle(BenyuanColor.textPrimary)
                .minimumScaleFactor(0.72)
                .fixedSize(horizontal: false, vertical: true)
            Text(model.theater?.theaterScript.personalizationSummary.keyThemes.joined(separator: " · ") ?? "角色 · 场景 · 回声")
                .font(.system(size: 14, weight: .semibold))
                .lineSpacing(5)
                .foregroundStyle(BenyuanColor.textSecondary)
            Spacer()
            BenyuanNativePrimaryButton(title: "进入这一幕") {
                model.enterAct2()
            }
        }
    }

    @ViewBuilder
    private var act2: some View {
        if let choice = model.currentTheaterChoice {
            BenyuanRevealedStack(spacing: BenyuanSpacing.x6) {
                Spacer(minLength: 28)
                Text("靠近一个方向")
                    .font(.system(size: 12, weight: .black, design: .monospaced))
                    .foregroundStyle(BenyuanColor.accentGold)
                Text(choice.scene)
                    .font(.system(size: theaterTitleSize(choice.scene), weight: .black))
                    .lineSpacing(2)
                    .foregroundStyle(BenyuanColor.textPrimary)
                    .minimumScaleFactor(0.72)
                    .fixedSize(horizontal: false, vertical: true)
                VStack(spacing: BenyuanSpacing.x3) {
                    ForEach(Array(choice.options.enumerated()), id: \.element.id) { index, option in
                        BenyuanNativeOptionButton(index: index, title: option.text, active: model.selectedTheaterOptionId == option.id) {
                            model.chooseAct2(option)
                        }
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                    }
                }
                Spacer()
            }
            .id("act2-\(model.theaterChoiceIndex)")
        }
    }

    @ViewBuilder
    private var act3: some View {
        if let question = model.currentMirrorQuestion {
            BenyuanRevealedStack(spacing: BenyuanSpacing.x6) {
                Spacer(minLength: 28)
                Text(question.dialogue)
                    .font(.system(size: 15, weight: .semibold))
                    .lineSpacing(5)
                    .foregroundStyle(BenyuanColor.textSecondary)
                Text(question.question)
                    .font(.system(size: theaterTitleSize(question.question), weight: .black))
                    .lineSpacing(2)
                    .foregroundStyle(BenyuanColor.textPrimary)
                    .minimumScaleFactor(0.72)
                    .fixedSize(horizontal: false, vertical: true)
                VStack(spacing: BenyuanSpacing.x3) {
                    ForEach(Array(question.options.enumerated()), id: \.element.id) { index, option in
                        BenyuanNativeOptionButton(index: index, title: option.text, active: false) {
                            model.chooseAct3(option)
                        }
                        .transition(.opacity.combined(with: .move(edge: .trailing)))
                    }
                }
                Spacer()
            }
            .id("act3-\(model.theaterMirrorIndex)")
        }
    }

    private var epilogue: some View {
        BenyuanRevealedStack(spacing: BenyuanSpacing.x6) {
            Spacer()
            BenyuanDeepCelestialBody(size: 156, progress: theaterProgress, mode: .processing)
            Text("星图正在靠近。")
                .font(.system(size: 42, weight: .black))
                .multilineTextAlignment(.center)
                .foregroundStyle(BenyuanColor.textPrimary)
            Text(model.theater?.theaterScript.epilogue.closingText ?? "最后一镜落下，精神坐标开始显形。")
                .font(.system(size: 16, weight: .semibold))
                .lineSpacing(6)
                .multilineTextAlignment(.center)
                .foregroundStyle(BenyuanColor.textSecondary)
            Spacer()
            BenyuanNativePrimaryButton(title: "生成我的星图") {
                Task { await model.finishTheaterAndGenerateConstellation() }
            }
        }
    }

    private func theaterTitleSize(_ value: String) -> CGFloat {
        if value.count > 86 { return 26 }
        if value.count > 56 { return 29 }
        return 34
    }
}
