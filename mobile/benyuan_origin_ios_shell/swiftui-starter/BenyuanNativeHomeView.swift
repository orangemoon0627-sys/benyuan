import AuthenticationServices
import SwiftUI

struct BenyuanNativeHomeView: View {
    @ObservedObject var model: BenyuanNativeFlowModel
    @ObservedObject private var wechatAuth = BenyuanWechatAuthClient.shared

    var body: some View {
        VStack(spacing: 0) {
            header

            GeometryReader { geometry in
                ScrollView(showsIndicators: false) {
                    BenyuanRevealedStack(spacing: 0) {
                        Color.clear
                            .frame(height: BenyuanSpacing.x2)

                        celestialHero

                        Spacer(minLength: BenyuanSpacing.x8)

                        homeEntryGroup
                    }
                    .frame(minHeight: geometry.size.height - BenyuanSpacing.x2, alignment: .top)
                    .padding(.horizontal, BenyuanSpacing.x4)
                    .padding(.top, BenyuanSpacing.x2)
                    .padding(.bottom, BenyuanSpacing.x2)
                }
            }
        }
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("本源")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(BenyuanColor.textPrimary)
                Text("私人月相档案")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BenyuanColor.textTertiary)
            }

            Spacer()

            Button(action: model.showAccount) {
                Image(systemName: "person.crop.circle")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(BenyuanColor.textPrimary)
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(BenyuanColor.glassFill).overlay(Circle().stroke(BenyuanColor.glassStroke)))
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, BenyuanSpacing.x4)
        .padding(.top, BenyuanSpacing.x3)
    }

    private var celestialHero: some View {
        BenyuanHomeOriginPortal(progress: model.flowMotionProgress)
        .frame(maxWidth: .infinity)
        .frame(height: 286)
        .padding(.top, 2)
        .accessibilityLabel("本源入口深场")
    }

    private var actionPanel: some View {
        VStack(spacing: BenyuanSpacing.x3) {
            Button {
                Task { await model.beginNativeExplorationFromHome() }
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(primaryActionTitle)
                            .font(.system(size: 16, weight: .semibold))
                        Text("从最近一次真实反应开始。")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(BenyuanColor.textTertiary)
                    }
                    Spacer()
                    Image(systemName: "arrow.right")
                        .font(.system(size: 14, weight: .bold))
                }
                .foregroundStyle(BenyuanColor.textPrimary)
                .padding(.horizontal, 20)
                .frame(maxWidth: .infinity, minHeight: 64)
                .background(Capsule().fill(BenyuanColor.primaryCTA).overlay(Capsule().stroke(BenyuanColor.accentGold.opacity(0.32))))
            }
            .buttonStyle(BenyuanPressableMotionStyle(scale: 0.974, glow: 0.14))
            .disabled(!model.canExploreFromHome)
            .opacity(model.canExploreFromHome ? 1 : 0.52)

            HStack(spacing: BenyuanSpacing.x3) {
                secondaryButton(title: "我的本源", systemImage: "clock.arrow.circlepath") {
                    model.showAccount()
                }
            }
        }
    }

    private var homeEntryGroup: some View {
        VStack(spacing: BenyuanSpacing.x4) {
            homeCopyBlock

            if shouldShowIdentityGate {
                identityGatePanel
            } else {
                actionPanel
            }
        }
        .padding(.bottom, BenyuanSpacing.x2)
    }

    private var identityGatePanel: some View {
        VStack(spacing: BenyuanSpacing.x3) {
            if shouldShowAppleLogin {
                homeAppleLoginButton
            }

            HStack(spacing: BenyuanSpacing.x2) {
                Button {
                    Task { await startWechatLogin() }
                } label: {
                    homeAuthPill(title: "微信登录", systemImage: "message.fill")
                }
                .buttonStyle(.plain)

                Button {
                    Task { await model.continueAsGuest() }
                } label: {
                    homeAuthPill(title: "访客预览", systemImage: "moonphase.waxing.crescent")
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, BenyuanSpacing.x4)
        .padding(.vertical, BenyuanSpacing.x4)
        .background(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(BenyuanColor.glassFill.opacity(0.76))
                .overlay(
                    RoundedRectangle(cornerRadius: 28, style: .continuous)
                        .stroke(BenyuanColor.glassStroke.opacity(0.78), lineWidth: 1)
                )
        )
    }

    private var homeCopyBlock: some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            HStack(spacing: BenyuanSpacing.x2) {
                Rectangle()
                    .fill(BenyuanColor.accentGold.opacity(0.72))
                    .frame(width: 28, height: 1)
                Text("ORIGIN BEFORE LIGHT")
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .tracking(1.8)
                    .foregroundStyle(BenyuanColor.accentGold.opacity(0.72))
            }

            Text("其实在宇宙大爆炸的那一瞬间，\n你就已经诞生了")
                .font(.system(size: 29, weight: .semibold))
                .lineSpacing(8)
                .minimumScaleFactor(0.78)
                .foregroundStyle(BenyuanColor.textPrimary)
                .frame(maxWidth: 352, alignment: .leading)
        }
        .padding(.leading, BenyuanSpacing.x1)
        .padding(.trailing, BenyuanSpacing.x6)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var homeAppleLoginButton: some View {
        ZStack {
            HStack(spacing: BenyuanSpacing.x3) {
                Image(systemName: "apple.logo")
                    .font(.system(size: 17, weight: .semibold))
                Text("用 Apple 登录")
                    .font(.system(size: 15, weight: .semibold))
                Spacer()
                Image(systemName: "arrow.right")
                    .font(.system(size: 13, weight: .bold))
            }
            .foregroundStyle(BenyuanColor.bgVoid)
            .padding(.horizontal, BenyuanSpacing.x6)
            .frame(maxWidth: .infinity, minHeight: 54, maxHeight: 54)
            .background(Capsule().fill(BenyuanColor.textPrimary))
            .overlay(Capsule().stroke(BenyuanColor.textPrimary.opacity(0.18), lineWidth: 1))
            .allowsHitTesting(false)
            .accessibilityHidden(true)

            SignInWithAppleButton(.continue) { request in
                request.requestedScopes = [.fullName]
                model.toast = nil
            } onCompletion: { result in
                handleAppleCompletion(result)
            }
            .signInWithAppleButtonStyle(.white)
            .frame(maxWidth: .infinity, minHeight: 54, maxHeight: 54)
            .clipShape(Capsule())
            .opacity(0.001)
            .accessibilityLabel("用 Apple 登录")
        }
        .frame(maxWidth: .infinity, minHeight: 54, maxHeight: 54)
    }

    private var primaryActionTitle: String {
        if !model.canExploreFromHome {
            return "登录后开始探索"
        }
        return model.session.part1Id == nil ? "开始新的探索" : "继续上次探索"
    }

    private var shouldShowIdentityGate: Bool {
        !model.canExploreFromHome
    }

    private var shouldShowAppleLogin: Bool {
        model.session.authSession?.provider != .apple
    }

    private var isWechatEntryReady: Bool {
        model.isWechatAuthReady && wechatAuth.authState == .ready
    }

    private func secondaryButton(title: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: systemImage)
                    .font(.system(size: 13, weight: .semibold))
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.78)
            }
            .foregroundStyle(BenyuanColor.textPrimary)
            .frame(maxWidth: .infinity, minHeight: 44)
            .background(Capsule().fill(BenyuanColor.glassFill).overlay(Capsule().stroke(BenyuanColor.glassStroke)))
        }
        .buttonStyle(BenyuanPressableMotionStyle(scale: 0.974, glow: 0.08, haptic: nil))
    }

    private func handleAppleCompletion(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let identityTokenData = credential.identityToken,
                  let identityToken = String(data: identityTokenData, encoding: .utf8) else {
                model.toast = "Apple 凭证暂时没有返回。"
                return
            }

            let authorizationCode = credential.authorizationCode.flatMap { String(data: $0, encoding: .utf8) }
            let displayName = [credential.fullName?.givenName, credential.fullName?.familyName]
                .compactMap { $0 }
                .joined()
            Task {
                await model.continueWithApple(
                    identityToken: identityToken,
                    authorizationCode: authorizationCode,
                    displayName: displayName.isEmpty ? nil : displayName
                )
            }
        case .failure(let error):
            model.toast = BenyuanAppleAuthorizationCopy.toastMessage(for: error)
        }
    }

    private func startWechatLogin() async {
        guard model.isWechatAuthReady else {
            model.toast = "微信登录还在接入开放平台，请先用 Apple 登录。"
            return
        }

        do {
            let code = try await wechatAuth.requestCode()
            await model.continueWithWechat(code: code, displayName: "微信用户")
        } catch {
            model.toast = error.localizedDescription
        }
    }

    private func homeAuthPill(title: String, systemImage: String) -> some View {
        HStack(spacing: 7) {
            Image(systemName: systemImage)
                .font(.system(size: 12, weight: .semibold))
            Text(title)
                .font(.system(size: 12, weight: .black))
                .lineLimit(1)
                .minimumScaleFactor(0.78)
            Spacer(minLength: 0)
        }
        .foregroundStyle(BenyuanColor.textPrimary)
        .padding(.horizontal, BenyuanSpacing.x3)
        .frame(maxWidth: .infinity, minHeight: 38)
        .background(Capsule().fill(BenyuanColor.glassFill.opacity(0.88)).overlay(Capsule().stroke(BenyuanColor.glassStroke.opacity(0.92))))
    }
}

private struct BenyuanHomeOriginPortal: View {
    var progress: Double

    var body: some View {
        BenyuanMotionTimeline(preferredFramesPerSecond: 18) { phase in
            let clamped = min(max(progress, 0.04), 1)
            let pulse = 0.5 + 0.5 * sin(phase * 0.42)

            GeometryReader { proxy in
                let width = max(proxy.size.width, 1)
                let height = max(proxy.size.height, 1)
                let center = CGPoint(x: width * 0.50, y: height * 0.50)

                ZStack {
                    BenyuanHomeSourceHaze(width: width, height: height, pulse: pulse)
                    BenyuanHomeSourceFilaments(width: width, height: height, phase: phase, progress: clamped)
                    BenyuanHomeCalibrationLattice(width: width, height: height, phase: phase, progress: clamped)
                    BenyuanHomeMoonEntrance(center: center, width: width, height: height, phase: phase, pulse: pulse)
                    BenyuanHomeLunarGlint(width: width, height: height, phase: phase, pulse: pulse)
                    BenyuanHomeSourceParticles(width: width, height: height, phase: phase, pulse: pulse)
                }
                .mask(
                    LinearGradient(
                        colors: [
                            .clear,
                            .black.opacity(0.88),
                            .black,
                            .black.opacity(0.88),
                            .clear
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

private struct BenyuanHomeSourceHaze: View {
    let width: CGFloat
    let height: CGFloat
    let pulse: Double

    var body: some View {
        ZStack {
            RadialGradient(
                colors: [
                    BenyuanColor.textPrimary.opacity(0.10 + pulse * 0.035),
                    BenyuanColor.accentGold.opacity(0.060 + pulse * 0.025),
                    BenyuanColor.nebulaViolet.opacity(0.16),
                    .clear
                ],
                center: UnitPoint(x: 0.50, y: 0.50),
                startRadius: 8,
                endRadius: width * 0.58
            )

            Ellipse()
                .fill(
                    LinearGradient(
                        colors: [
                            .clear,
                            BenyuanColor.textPrimary.opacity(0.070 + pulse * 0.025),
                            BenyuanColor.accentGold.opacity(0.052),
                            .clear
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(width: width * 0.86, height: height * 0.30)
                .blur(radius: 18)
                .offset(y: height * 0.03)
                .blendMode(.screen)
        }
    }
}

private struct BenyuanHomeSourceFilaments: View {
    let width: CGFloat
    let height: CGFloat
    let phase: TimeInterval
    let progress: Double

    var body: some View {
        ZStack {
            ForEach(0..<7, id: \.self) { index in
                let side: CGFloat = index.isMultiple(of: 2) ? -1 : 1
                let row = CGFloat(index - 3)
                let drift = CGFloat(sin(phase * (0.12 + Double(index) * 0.012) + Double(index))) * height * 0.018
                Path { path in
                    let start = CGPoint(x: width * (side < 0 ? 0.06 : 0.94), y: height * (0.38 + row * 0.032) + drift)
                    let end = CGPoint(x: width * (0.48 + side * 0.018), y: height * (0.50 + row * 0.010))
                    path.move(to: start)
                    path.addCurve(
                        to: end,
                        control1: CGPoint(x: width * (side < 0 ? 0.22 : 0.78), y: start.y + height * 0.04),
                        control2: CGPoint(x: width * (side < 0 ? 0.35 : 0.65), y: end.y - height * 0.08)
                    )
                }
                .stroke(
                    LinearGradient(
                        colors: [
                            .clear,
                            BenyuanColor.textPrimary.opacity(0.055 + progress * 0.025),
                            BenyuanColor.accentGold.opacity(index.isMultiple(of: 3) ? 0.13 : 0.055),
                            .clear
                        ],
                        startPoint: side < 0 ? .leading : .trailing,
                        endPoint: side < 0 ? .trailing : .leading
                    ),
                    style: StrokeStyle(lineWidth: index == 3 ? 1.2 : 0.8, lineCap: .round)
                )
                .blur(radius: index == 3 ? 0.4 : 0.9)
            }
        }
        .blendMode(.screen)
    }
}

private struct BenyuanHomeCalibrationLattice: View {
    let width: CGFloat
    let height: CGFloat
    let phase: TimeInterval
    let progress: Double

    var body: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { index in
                RoundedRectangle(cornerRadius: 22 + CGFloat(index) * 3, style: .continuous)
                    .stroke(
                        BenyuanColor.textPrimary.opacity(0.035 + Double(index) * 0.008),
                        style: StrokeStyle(lineWidth: 0.8, lineCap: .round, dash: index == 1 ? [3, 16] : [])
                    )
                    .frame(width: width * (0.34 + CGFloat(index) * 0.105), height: height * (0.18 + CGFloat(index) * 0.055))
                    .rotationEffect(.degrees(-9 + Double(index) * 5 + sin(phase * 0.07 + Double(index)) * 1.8))
                    .offset(x: CGFloat(index - 2) * width * 0.010, y: CGFloat(index - 1) * height * 0.012)
            }

            Path { path in
                path.move(to: CGPoint(x: width * 0.34, y: height * 0.50))
                path.addLine(to: CGPoint(x: width * 0.43, y: height * 0.39))
                path.addLine(to: CGPoint(x: width * 0.56, y: height * 0.43))
                path.addLine(to: CGPoint(x: width * 0.65, y: height * 0.54))
                path.addLine(to: CGPoint(x: width * 0.51, y: height * 0.63))
                path.closeSubpath()
            }
            .stroke(BenyuanColor.accentGold.opacity(0.12 + progress * 0.05), style: StrokeStyle(lineWidth: 1, lineJoin: .round))
            .blur(radius: 0.25)
        }
    }
}

private struct BenyuanHomeMoonEntrance: View {
    let center: CGPoint
    let width: CGFloat
    let height: CGFloat
    let phase: TimeInterval
    let pulse: Double

    var body: some View {
        let artworkSize = min(width * 0.86, height * 1.08)
        let driftY = CGFloat(sin(phase * 0.10)) * height * 0.010
        let breath = 1.0 + pulse * 0.010

        ZStack {
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            BenyuanColor.textPrimary.opacity(0.16 + pulse * 0.06),
                            BenyuanColor.nebulaViolet.opacity(0.10),
                            .clear
                        ],
                        center: .center,
                        startRadius: artworkSize * 0.15,
                        endRadius: artworkSize * 0.55
                    )
                )
                .frame(width: artworkSize * 1.02, height: artworkSize * 1.02)
                .blur(radius: 12)
                .blendMode(.screen)

            Image("BenyuanHomeMoonEntrance")
                .resizable()
                .scaledToFill()
                .frame(width: artworkSize * 1.03, height: artworkSize * 1.03)
                .contrast(1.14)
                .saturation(1.04)
                .scaleEffect(breath)
                .rotationEffect(.degrees(sin(phase * 0.035) * 0.9))
                .mask(
                    RadialGradient(
                        colors: [
                            .black,
                            .black.opacity(0.96),
                            .black.opacity(0.72),
                            .black.opacity(0.18),
                            .clear
                        ],
                        center: .center,
                        startRadius: artworkSize * 0.12,
                        endRadius: artworkSize * 0.60
                    )
                )
                .blendMode(.screen)
                .shadow(color: BenyuanColor.textPrimary.opacity(0.14 + pulse * 0.05), radius: 28)
        }
        .position(x: center.x, y: center.y + driftY)
    }
}

private struct BenyuanHomeLunarGlint: View {
    let width: CGFloat
    let height: CGFloat
    let phase: TimeInterval
    let pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<3, id: \.self) { index in
                let rotation = phase * (2.0 + Double(index) * 0.32) + Double(index) * 38

                Ellipse()
                    .stroke(
                        LinearGradient(
                            colors: [
                                .clear,
                                BenyuanColor.textPrimary.opacity(0.030 + pulse * 0.018),
                                BenyuanColor.accentGold.opacity(index == 1 ? 0.095 : 0.050),
                                .clear
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        style: StrokeStyle(lineWidth: index == 1 ? 0.9 : 0.65, lineCap: .round, dash: index == 2 ? [2, 14] : [])
                    )
                    .frame(width: width * (0.52 + CGFloat(index) * 0.09), height: height * (0.22 + CGFloat(index) * 0.030))
                    .rotationEffect(.degrees(-12 + Double(index) * 10 + sin(rotation * 0.02) * 2.0))
                    .offset(y: height * (0.01 + CGFloat(index - 1) * 0.018))
            }
        }
        .blendMode(.screen)
    }
}

private struct BenyuanHomeSourceParticles: View {
    let width: CGFloat
    let height: CGFloat
    let phase: TimeInterval
    let pulse: Double

    var body: some View {
        ZStack {
            ForEach(0..<18, id: \.self) { index in
                let baseAngle = Double(index) * .pi * 2 / 18
                let angle = baseAngle + phase * (0.035 + Double(index % 5) * 0.004)
                let radiusX = width * (0.18 + CGFloat(index % 6) * 0.025)
                let radiusY = height * (0.12 + CGFloat(index % 4) * 0.022)
                let isGold = index.isMultiple(of: 5)
                Circle()
                    .fill(isGold ? BenyuanColor.accentGold.opacity(0.32 + pulse * 0.10) : BenyuanColor.textPrimary.opacity(0.13 + pulse * 0.04))
                    .frame(width: isGold ? 3.4 : 2.1, height: isGold ? 3.4 : 2.1)
                    .position(
                        x: width * 0.50 + cos(angle) * radiusX,
                        y: height * 0.50 + sin(angle) * radiusY
                    )
                    .blur(radius: isGold ? 0.15 : 0.65)
            }
        }
        .blendMode(.screen)
    }
}
