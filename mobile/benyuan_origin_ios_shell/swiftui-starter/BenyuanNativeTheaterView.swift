import SwiftUI

struct BenyuanNativeTheaterView: View {
    @ObservedObject var model: BenyuanNativeFlowModel
    @State private var novaBurstToken = 0
    @State private var novaBurstOptionId: String?
    @State private var selectedTheaterResponse: String?

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
                    BenyuanMomentaryChoiceFeedback(isActive: model.isTheaterChoiceFeedbackVisible)
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                        .allowsHitTesting(false)

                    if model.theaterPhase == .act1 {
                        act1ReadingPage(availableHeight: proxy.size.height)
                            .id(model.theaterPhase)
                            .transition(.opacity.combined(with: .move(edge: .bottom)))
                    } else {
                        ScrollViewReader { scrollProxy in
                            ScrollView(showsIndicators: false) {
                                Color.clear
                                    .frame(height: 0)
                                    .id(theaterScrollTopAnchor)

                                phaseContent
                                    .id(model.theaterPhase)
                                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                                    .frame(minHeight: max(560, proxy.size.height - BenyuanSpacing.x4), alignment: .top)
                                    .padding(.horizontal, BenyuanSpacing.x4)
                                    .padding(.top, BenyuanSpacing.x4)
                                    .padding(.bottom, BenyuanSpacing.x8)
                            }
                            .id("theater-scroll-\(model.theaterPhase)")
                            .onChange(of: model.theaterPhase) { _, _ in
                                withAnimation(.easeOut(duration: 0.18)) {
                                    scrollProxy.scrollTo(theaterScrollTopAnchor, anchor: .top)
                                }
                            }
                            .onChange(of: model.theaterChoiceIndex) { _, _ in
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

    private var theaterScrollTopAnchor: String { "benyuan-theater-scroll-top" }

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
        case .act2: return 0.76
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
                    detail: selectedTheaterResponse ?? "选项会改变这座剧场的下一层光线。",
                    mode: .deepSpace,
                    progress: theaterProgress
                )
                VStack(spacing: BenyuanSpacing.x3) {
                    ForEach(Array(choice.options.prefix(4).enumerated()), id: \.element.id) { index, option in
                        BenyuanNativeOptionButton(index: index, title: displayText(option.text, fallback: "沿着这条轨道靠近"), active: model.selectedTheaterOptionId == option.id, pressScale: 1) {
                            guard !model.hasAnsweredCurrentTheaterChoice else { return }
                            selectedTheaterResponse = displayText(option.response, fallback: "剧场记下了这一次靠近。")
                            novaBurstOptionId = option.id
                            novaBurstToken += 1
                            model.chooseAct2(option)
                        }
                        .disabled(model.hasAnsweredCurrentTheaterChoice || model.isTheaterConstellationEntrySubmitting)
                        .overlay(BenyuanSelectionPulseLayer(isActive: model.selectedTheaterOptionId == option.id, cornerRadius: 24))
                        .overlay(BenyuanNovaSelectionBurst(trigger: novaBurstOptionId == option.id ? novaBurstToken : 0))
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                    }
                }
                .padding(.top, BenyuanSpacing.x1)

                if model.canEnterConstellationGenerationFromTheater {
                    VStack(alignment: .leading, spacing: BenyuanSpacing.x2) {
                        Text("四轮选择已经收束。")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(BenyuanColor.textSecondary)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        BenyuanNativePrimaryButton(
                            title: model.isTheaterConstellationEntrySubmitting ? "正在进入星图" : "进入生成星图",
                            disabled: model.isTheaterConstellationEntrySubmitting
                        ) {
                            Task {
                                await model.enterConstellationGenerationFromTheater()
                            }
                        }
                    }
                    .padding(.top, BenyuanSpacing.x2)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
                }

                Spacer()
            }
            .id("act2-\(model.theaterChoiceIndex)")
            .onChange(of: model.theaterChoiceIndex) { _ in
                selectedTheaterResponse = nil
            }
        }
    }

    private func theaterLensCard(
        title: String,
        detail: String,
        mode: BenyuanDeepCelestialBody.Mode,
        progress: Double
    ) -> some View {
        let cardHeight = theaterLensCardHeight(title)

        return VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
            ZStack(alignment: .topLeading) {
                RoundedRectangle(cornerRadius: 34, style: .continuous)
                    .fill(
                        LinearGradient(
                            colors: [
                                BenyuanColor.bgVoid.opacity(0.88),
                                BenyuanColor.aubergineBlack.opacity(0.70),
                                BenyuanColor.bgSurface.opacity(0.40)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                BenyuanTheaterScenePortal(progress: progress, mode: mode)
                    .frame(height: cardHeight)
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

                Text(title)
                    .font(.system(size: theaterTitleSize(title), weight: .semibold))
                    .lineSpacing(4)
                    .foregroundStyle(BenyuanColor.textPrimary)
                    .minimumScaleFactor(0.76)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, BenyuanSpacing.x4)
                    .padding(.vertical, BenyuanSpacing.x3)
            }
            .frame(maxWidth: .infinity)
            .frame(minHeight: cardHeight, alignment: .topLeading)
            .clipShape(RoundedRectangle(cornerRadius: 34, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 34, style: .continuous)
                    .stroke(BenyuanColor.glassStroke.opacity(0.84), lineWidth: 1)
            )
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

    private func theaterAct1ReadingSize(_ value: String) -> CGFloat {
        if value.count > 360 { return 25 }
        if value.count > 260 { return 27 }
        return 29
    }

    private func theaterLensCardHeight(_ title: String) -> CGFloat {
        if title.count > 150 { return 286 }
        if title.count > 110 { return 246 }
        if title.count > 64 { return 206 }
        if title.count > 24 { return 176 }
        return 132
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

                    BenyuanFlowOrbitTrail(progress: clamped, intensity: mode == .deepSpace ? 0.72 : 0.52, tilt: mode.tilt, preferredFramesPerSecond: 16)
                        .frame(width: width * 1.18, height: height * 0.92)
                        .position(x: width * 0.52, y: height * 0.46)
                        .opacity(mode == .deepSpace ? 0.96 : 0.84)

                    BenyuanDeepCelestialBody(size: bodySize, progress: clamped, mode: mode)
                        .scaleEffect(mode == .deepSpace ? 0.88 + CGFloat(clamped) * 0.28 : 0.96 + pulse * 0.03)
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
