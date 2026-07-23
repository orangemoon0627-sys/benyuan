import SwiftUI

struct BenyuanNativeTheaterView: View {
    @ObservedObject var model: BenyuanNativeFlowModel
    @Environment(\.accessibilityReduceMotion) private var accessibilityReduceMotion
    @State private var novaBurstToken = 0
    @State private var novaBurstOptionId: String?

    var body: some View {
        VStack(spacing: 0) {
            BenyuanNativeTopBar(progress: theaterProgress, label: "月下剧场")

            GeometryReader { proxy in
                ZStack(alignment: .top) {
                    BenyuanTheaterAtmosphereLayer(progress: theaterProgress)
                        .frame(height: max(260, proxy.size.height * 0.44))
                        .padding(.top, proxy.size.height * 0.10)
                        .allowsHitTesting(false)
                    BenyuanMomentaryChoiceFeedback(isActive: model.isTheaterChoiceFeedbackVisible)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                        .allowsHitTesting(false)

                    if model.theaterPhase == .act1 {
                        act1ReadingPage(availableHeight: proxy.size.height)
                            .id(model.theaterPhase)
                            .transition(theaterTransition)
                    } else {
                        ScrollViewReader { scrollProxy in
                            ScrollView(showsIndicators: false) {
                                Color.clear
                                    .frame(height: 0)
                                    .id(theaterScrollTopAnchor)

                                phaseContent
                                    .id(model.theaterPhase)
                                    .transition(theaterTransition)
                                    .frame(minHeight: max(560, proxy.size.height - BenyuanSpacing.x4), alignment: .top)
                                    .padding(.horizontal, BenyuanSpacing.x4)
                                    .padding(.top, BenyuanSpacing.x4)
                                    .padding(.bottom, BenyuanSpacing.x8)
                            }
                            .id("theater-scroll-\(model.theaterPhase)")
                            .onChange(of: model.theaterPhase) { _, _ in
                                if accessibilityReduceMotion {
                                    scrollProxy.scrollTo(theaterScrollTopAnchor, anchor: .top)
                                } else {
                                    withAnimation(.easeOut(duration: 0.18)) {
                                        scrollProxy.scrollTo(theaterScrollTopAnchor, anchor: .top)
                                    }
                                }
                            }
                            .onChange(of: model.theaterChoiceIndex) { _, _ in
                                if accessibilityReduceMotion {
                                    scrollProxy.scrollTo(theaterScrollTopAnchor, anchor: .top)
                                } else {
                                    withAnimation(.easeOut(duration: 0.18)) {
                                        scrollProxy.scrollTo(theaterScrollTopAnchor, anchor: .top)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        .safeAreaInset(edge: .bottom, spacing: 0) {
            if model.theaterPhase == .act2 {
                theaterChoiceBottomBar
            }
        }
    }

    private var theaterScrollTopAnchor: String { "benyuan-theater-scroll-top" }
    private var theaterTransition: AnyTransition {
        accessibilityReduceMotion ? .opacity : .opacity.combined(with: .move(edge: .bottom))
    }

    @ViewBuilder
    private var phaseContent: some View {
        switch model.theaterPhase {
        case .act1:
            EmptyView()
        case .act2:
            act2
        }
    }

    private var theaterProgress: Double {
        switch model.theaterPhase {
        case .act1: return 0.18
        case .act2:
            let count = max(model.requiredTheaterChoiceCount, 1)
            return 0.24 + (Double(model.theaterChoiceIndex + 1) / Double(count)) * 0.60
        }
    }

    private func act1ReadingPage(availableHeight: CGFloat) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            act1ReadingScroll(
                displayText(model.theater?.theaterScript.act1.sceneDescription, fallback: "剧场正在靠近。")
            )

            BenyuanNativePrimaryButton(title: "进入这一幕") {
                model.enterAct2()
            }
        }
        .frame(minHeight: max(560, availableHeight - BenyuanSpacing.x4), alignment: .top)
        .padding(.horizontal, BenyuanSpacing.x4)
        .padding(.top, BenyuanSpacing.x4)
        .padding(.bottom, BenyuanSpacing.x4)
    }

    private func act1ReadingScroll(_ text: String) -> some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
                ForEach(Array(readingParagraphs(text).enumerated()), id: \.offset) { _, paragraph in
                    Text(paragraph)
                        .font(.system(size: theaterAct1ReadingSize(text), weight: .semibold))
                        .lineSpacing(8)
                        .foregroundStyle(BenyuanColor.textPrimary)
                        .minimumScaleFactor(0.82)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .topLeading)
                }
            }
            .frame(maxWidth: .infinity, alignment: .topLeading)
                .padding(.top, BenyuanSpacing.x2)
                .padding(.bottom, BenyuanSpacing.x12)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .mask(
            LinearGradient(
                stops: [
                    .init(color: .clear, location: 0),
                    .init(color: .black, location: 0.025),
                    .init(color: .black, location: 0.90),
                    .init(color: .clear, location: 1)
                ],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }

    @ViewBuilder
    private var act2: some View {
        if let choice = model.currentTheaterChoice {
            BenyuanRevealedStack(spacing: BenyuanSpacing.x4) {
                theaterLensCard(
                    title: displayText(choice.scene, fallback: "这一幕正在显影。"),
                    detail: currentTheaterResponse,
                    mode: .deepSpace,
                    progress: theaterProgress
                )
                VStack(spacing: BenyuanSpacing.x3) {
                    ForEach(Array(choice.options.prefix(4).enumerated()), id: \.element.id) { index, option in
                        BenyuanNativeOptionButton(index: index, title: displayText(option.text, fallback: "沿着这条轨道靠近"), active: model.selectedTheaterOptionId == option.id, pressScale: 1) {
                            novaBurstOptionId = option.id
                            novaBurstToken += 1
                            model.chooseAct2(option)
                        }
                        .disabled(model.isTheaterConstellationEntrySubmitting)
                        .overlay(BenyuanSelectionPulseLayer(isActive: model.selectedTheaterOptionId == option.id, cornerRadius: 24))
                        .overlay(BenyuanNovaSelectionBurst(trigger: novaBurstOptionId == option.id ? novaBurstToken : 0))
                        .transition(theaterTransition)
                    }
                }
                .padding(.top, BenyuanSpacing.x1)

                Spacer()
            }
            .id("act2-\(model.theaterChoiceIndex)")
        }
    }

    private var currentTheaterResponse: String? {
        guard let choice = model.currentTheaterChoice,
              let selectedId = model.selectedTheaterOptionId,
              let option = choice.options.first(where: { $0.id == selectedId }) else { return nil }
        return displayText(option.response, fallback: "这一幕记下了你的选择。")
    }

    private var theaterChoiceBottomBar: some View {
        let isFirstChoice = model.theaterChoiceIndex == 0
        let canContinue = model.hasAnsweredCurrentTheaterChoice && !model.isTheaterConstellationEntrySubmitting
        return HStack(spacing: BenyuanSpacing.x3) {
            Button { model.previousTheaterChoice() } label: {
                Image(systemName: "chevron.up")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(isFirstChoice ? BenyuanColor.textTertiary : BenyuanColor.textSecondary)
                    .frame(width: 54, height: 54)
                    .background(Circle().fill(isFirstChoice ? BenyuanColor.glassFill.opacity(0.62) : BenyuanColor.glassFill))
            }
            .accessibilityLabel("上一幕")
            .disabled(isFirstChoice || model.isTheaterConstellationEntrySubmitting)
            .buttonStyle(BenyuanPressableMotionStyle(scale: 0.96, glow: 0.08, haptic: .light))

            BenyuanNativePrimaryButton(
                title: model.isLastTheaterChoice ? "进入生成星图" : "下一幕",
                disabled: !canContinue
            ) {
                if model.isLastTheaterChoice {
                    Task { await model.enterConstellationGenerationFromTheater() }
                } else {
                    model.nextTheaterChoice()
                }
            }
        }
        .padding(.horizontal, BenyuanSpacing.x4)
        .padding(.vertical, BenyuanSpacing.x4)
        .background(BenyuanColor.bgVoid.opacity(0.82).ignoresSafeArea())
    }

    private func theaterLensCard(
        title: String,
        detail: String?,
        mode: BenyuanDeepCelestialBody.Mode,
        progress: Double
    ) -> some View {
        return VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
            Text(title)
                .font(.system(size: theaterTitleSize(title), weight: .semibold))
                .lineSpacing(4)
                .foregroundStyle(BenyuanColor.textPrimary)
                .minimumScaleFactor(0.76)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, minHeight: 116, alignment: .topLeading)
                .padding(.horizontal, BenyuanSpacing.x4)
                .padding(.vertical, BenyuanSpacing.x3)
                .background {
                    ZStack {
                        LinearGradient(
                            colors: [
                                BenyuanColor.bgVoid.opacity(0.88),
                                BenyuanColor.aubergineBlack.opacity(0.70),
                                BenyuanColor.bgSurface.opacity(0.40)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )

                        BenyuanTheaterScenePortal(progress: progress, mode: mode)
                            .opacity(0.42)
                            .clipped()
                            .allowsHitTesting(false)

                        LinearGradient(
                            colors: [
                                BenyuanColor.bgVoid.opacity(0.94),
                                BenyuanColor.bgVoid.opacity(0.74),
                                BenyuanColor.bgVoid.opacity(0.28)
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                        .allowsHitTesting(false)
                    }
                }
            .frame(maxWidth: .infinity)
            .clipShape(RoundedRectangle(cornerRadius: 34, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 34, style: .continuous)
                    .stroke(BenyuanColor.glassStroke.opacity(0.84), lineWidth: 1)
            )
            .shadow(color: BenyuanColor.bgVoid.opacity(0.48), radius: 26, y: 18)

            theaterEchoPanel(detail)
        }
    }

    private func theaterEchoPanel(_ detail: String?) -> some View {
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

            Text(detail ?? "")
                .font(.system(size: 14, weight: .regular))
                .lineSpacing(5)
                .foregroundStyle(BenyuanColor.textSecondary)
                .minimumScaleFactor(0.86)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(BenyuanSpacing.x4)
        .frame(minHeight: 76, alignment: .top)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(BenyuanColor.glassFill.opacity(0.82))
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .stroke(BenyuanColor.glassStroke.opacity(0.72), lineWidth: 1)
                )
        )
        .opacity(detail == nil ? 0 : 1)
        .accessibilityHidden(detail == nil)
    }

    private func theaterTitleSize(_ value: String) -> CGFloat {
        if value.count > 92 { return 19 }
        if value.count > 64 { return 22 }
        if value.count > 36 { return 25 }
        return 29
    }

    private func theaterAct1ReadingSize(_ value: String) -> CGFloat {
        if value.count > 360 { return 25 }
        if value.count > 260 { return 27 }
        return 29
    }

    private func displayText(_ value: String?, fallback: String) -> String {
        value?.benyuanSanitizedVisibleText(fallback: fallback) ?? fallback
    }

    private func readingParagraphs(_ text: String) -> [String] {
        let normalized = text.replacingOccurrences(of: "\r\n", with: "\n")
        let paragraphs = normalized
            .components(separatedBy: "\n\n")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return paragraphs.isEmpty ? [text] : paragraphs
    }
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

                    BenyuanCinematicSpaceField(
                        progress: clamped,
                        intensity: mode == .deepSpace ? 0.74 : 0.56,
                        velocity: 0.26 + clamped * 0.42,
                        focalPoint: UnitPoint(x: center.x / width, y: center.y / height),
                        preferredFramesPerSecond: 24
                    )
                    .frame(width: width * 1.12, height: height * 1.06)
                    .position(x: width * 0.50, y: height * 0.50)

                    BenyuanDeepCelestialBody(size: bodySize, progress: clamped, mode: mode)
                        .scaleEffect(mode == .deepSpace ? 0.84 + CGFloat(clamped) * 0.24 : 0.94 + pulse * 0.025)
                        .position(center)
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}
