import SwiftUI

struct BenyuanShellRootView: View {
    @StateObject private var state = BenyuanShellState()
    @StateObject private var networkMonitor = BenyuanNetworkMonitor()
    @StateObject private var nativeModel = BenyuanNativeFlowModel()
    @Environment(\.scenePhase) private var scenePhase
    @State private var reloadToken = UUID()
#if DEBUG
    @State private var showsDebugWebInspector = false
#endif

    var body: some View {
        let routeContext = BenyuanShellRouteContext.resolve(currentURL: state.currentURL ?? BenyuanRouteRecovery.restoreURL())

        ZStack(alignment: .top) {
            BenyuanShellBackdrop(showsGhostTitle: false)

            nativeFlow

            topStatusStack

            if BenyuanShellConfig.hasReleaseBaseURLIssue {
                ritualStateCard(
                    title: "Release 地址尚未接入",
                    detail: "生产包需要真实 staging / production 地址后才能进入分发。",
                    progressValue: 0.34
                ) {
                    if BenyuanShellConfig.showsDebugUI {
                        debugLine(label: "release-base", value: BenyuanShellConfig.baseURL.absoluteString)
                    }
                }
                .padding(.horizontal, BenyuanSpacing.x8)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                .transition(.opacity.combined(with: .scale(scale: 0.985)))
            } else if let errorMessage = state.errorMessage {
                ritualStateCard(
                    title: "这一页暂时没有抵达",
                    detail: friendlyErrorMessage(errorMessage),
                    progressValue: 0.18
                ) {
                    if BenyuanShellConfig.showsDebugUI {
                        Group {
                            Text("DEBUG SHELL")
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .foregroundStyle(BenyuanColor.accentGold)
                                .multilineTextAlignment(.center)
                            debugLine(label: "base", value: BenyuanShellConfig.baseURL.absoluteString)
                            debugLine(label: "restore", value: BenyuanRouteRecovery.restoreURL().absoluteString)
                            if let currentURL = state.currentURL?.absoluteString {
                                debugLine(label: "current", value: currentURL)
                            }
                        }
                    }

                    Button(BenyuanShellConfig.showsDebugUI ? "再试一次（debug）" : "再试一次") {
                        state.errorMessage = nil
                        reloadToken = UUID()
                    }
                    .buttonStyle(BenyuanPrimaryPillButtonStyle())
                    .padding(.top, BenyuanSpacing.x2)
                }
                .padding(.horizontal, BenyuanSpacing.x8)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                .transition(.opacity.combined(with: .scale(scale: 0.985)))
            }

#if DEBUG
            if showsDebugWebInspector {
                debugWebInspector(context: routeContext)
            }
#endif
        }
        .task {
            guard !Self.isRunningUnitTests else { return }
            await nativeModel.start()
        }
        .animation(.easeInOut(duration: BenyuanMotion.base), value: state.isLoading)
        .animation(.easeInOut(duration: BenyuanMotion.base), value: state.errorMessage)
        .animation(.easeInOut(duration: BenyuanMotion.base), value: networkMonitor.isOnline)
        .animation(.easeInOut(duration: BenyuanMotion.base), value: state.nativeActivity)
        .animation(.easeInOut(duration: BenyuanMotion.base), value: nativeModel.stage)
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active else { return }
            Task { await nativeModel.resumeProcessingIfNeeded() }
        }
        .preferredColorScheme(.dark)
        .sheet(isPresented: $state.isShareSheetPresented, onDismiss: state.clearShare) {
            BenyuanShareSheet(items: state.shareItems)
        }
        .sheet(isPresented: $nativeModel.isShareSheetPresented) {
            BenyuanShareSheet(items: nativeModel.shareItems)
        }
    }

    private static var isRunningUnitTests: Bool {
        ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil
    }

    @ViewBuilder
    private var nativeFlow: some View {
        ZStack(alignment: .top) {
            BenyuanFlowTransitionLayer(progress: nativeModel.flowMotionProgress)
                .allowsHitTesting(false)

            switch nativeModel.stage {
            case .launching:
                BenyuanNativeProcessingView(model: nativeModel)
            case .auth:
                BenyuanNativeAuthView(model: nativeModel)
            case .account:
                BenyuanNativeAccountView(model: nativeModel)
            case .collect:
                BenyuanNativeCollectView(model: nativeModel)
            case .processing:
                BenyuanNativeProcessingView(model: nativeModel)
            case .theater:
                BenyuanNativeTheaterView(model: nativeModel)
            case .constellation:
                BenyuanNativeConstellationView(model: nativeModel)
            case .error(let message):
                ritualStateCard(
                    title: "这一页暂时没有抵达",
                    detail: message,
                    progressValue: 0.24
                ) {
                    VStack(spacing: BenyuanSpacing.x3) {
                        Button("再试一次") {
                            nativeModel.stage = .launching
                            Task { await nativeModel.start() }
                        }
                        .buttonStyle(BenyuanPrimaryPillButtonStyle())
                    }
                }
                .padding(.horizontal, BenyuanSpacing.x8)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
            }

#if DEBUG
            if BenyuanShellConfig.showsDebugUI {
                HStack {
                    Spacer()
                    Button(showsDebugWebInspector ? "关闭调试页" : "调试页") {
                        showsDebugWebInspector.toggle()
                    }
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .foregroundStyle(BenyuanColor.accentGold)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Capsule().fill(BenyuanColor.glassFill))
                    .padding(.top, BenyuanSpacing.x12)
                    .padding(.trailing, BenyuanSpacing.x4)
                }
            }
#endif

            if let toast = nativeModel.toast {
                BenyuanToastView(text: toast)
                    .padding(.top, BenyuanSpacing.x12)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }

#if DEBUG
    private func debugWebInspector(context: BenyuanShellRouteContext) -> some View {
        ZStack(alignment: .topTrailing) {
            BenyuanWebContainerView(isLoading: $state.isLoading, currentURL: $state.currentURL, errorMessage: $state.errorMessage, reloadToken: reloadToken, shellState: state)
                .ignoresSafeArea()

            if state.isLoading {
                BenyuanLaunchOverlay(context: context, baseURL: BenyuanShellConfig.baseURL, showsDebug: true)
            }

            Button("回到原生") {
                showsDebugWebInspector = false
            }
            .font(.system(size: 11, weight: .black, design: .monospaced))
            .foregroundStyle(BenyuanColor.accentGold)
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(Capsule().fill(BenyuanColor.bgVoid.opacity(0.84)).overlay(Capsule().stroke(BenyuanColor.glassStroke)))
            .padding(.top, BenyuanSpacing.x12)
            .padding(.trailing, BenyuanSpacing.x4)
        }
    }
#endif

    private var topStatusStack: some View {
        VStack(spacing: BenyuanSpacing.x2) {
            if !networkMonitor.isOnline {
                banner(text: "网络暂时断开，恢复后会继续。")
            }

            if state.nativeActivity != .none {
                nativeActivityBanner(state.nativeActivity)
            }
        }
        .padding(.top, BenyuanSpacing.x12)
        .padding(.horizontal, BenyuanSpacing.x4)
        .frame(maxWidth: .infinity, alignment: .top)
    }

    private func banner(text: String) -> some View {
        HStack(spacing: BenyuanSpacing.x2) {
            Circle()
                .fill(BenyuanColor.accentGold)
                .frame(width: 6, height: 6)
                .shadow(color: BenyuanColor.accentGold.opacity(0.62), radius: 8)

            Text(text)
                .font(.system(size: BenyuanTypography.sm, weight: .semibold, design: .default))
                .foregroundStyle(BenyuanColor.textPrimary)
        }
            .padding(.horizontal, BenyuanSpacing.x6)
            .padding(.vertical, BenyuanSpacing.x3)
            .background(
                Capsule()
                    .fill(BenyuanColor.bgVoid.opacity(0.76))
                    .overlay(
                        Capsule()
                            .stroke(BenyuanColor.glassStroke, lineWidth: 1)
                    )
            )
            .clipShape(Capsule())
            .shadow(color: BenyuanColor.accentGold.opacity(0.12), radius: 20, x: 0, y: 10)
            .transition(.move(edge: .top).combined(with: .opacity))
    }

    private func nativeActivityBanner(_ activity: BenyuanShellNativeActivity) -> some View {
        HStack(spacing: BenyuanSpacing.x3) {
            ZStack {
                Circle()
                    .fill(BenyuanColor.bgVoid.opacity(0.72))
                    .overlay(
                        Circle()
                            .stroke(BenyuanColor.glassStroke, lineWidth: 1)
                    )
                Circle()
                    .trim(from: 0.08, to: activity.progressValue)
                    .stroke(BenyuanColor.accentGold.opacity(0.86), style: StrokeStyle(lineWidth: 2.2, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                Circle()
                    .fill(BenyuanColor.textPrimary.opacity(0.82))
                    .frame(width: 4, height: 4)
            }
            .frame(width: 30, height: 30)

            VStack(alignment: .leading, spacing: 2) {
                Text(activity.title)
                    .font(.system(size: BenyuanTypography.sm, weight: .black, design: .default))
                    .foregroundStyle(BenyuanColor.textPrimary)
                Text(activity.detail)
                    .font(.system(size: 11, weight: .semibold, design: .default))
                    .foregroundStyle(BenyuanColor.textTertiary)
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, BenyuanSpacing.x4)
        .padding(.vertical, BenyuanSpacing.x3)
        .background(
            Capsule()
                .fill(BenyuanColor.bgVoid.opacity(0.78))
                .overlay(
                    Capsule()
                        .stroke(BenyuanColor.glassStroke.opacity(0.9), lineWidth: 1)
                )
        )
        .clipShape(Capsule())
        .shadow(color: BenyuanColor.accentGold.opacity(0.12), radius: 22, x: 0, y: 12)
        .transition(.move(edge: .top).combined(with: .opacity))
    }

    private func ritualStateCard<Content: View>(
        title: String,
        detail: String,
        progressValue: Double,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(spacing: BenyuanSpacing.x6) {
            BenyuanBlackMoonMark(size: 142)
                .padding(.bottom, BenyuanSpacing.x1)

            VStack(spacing: BenyuanSpacing.x3) {
                Text(title)
                    .font(.system(size: BenyuanTypography.xl, weight: .black, design: .default))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(BenyuanColor.textPrimary)
                Text(detail)
                    .font(.system(size: BenyuanTypography.sm, weight: .semibold, design: .default))
                    .lineSpacing(4)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(BenyuanColor.textSecondary)
                    .padding(.horizontal, BenyuanSpacing.x2)
            }

            progressTrack(progressValue)
                .frame(height: 3)
                .padding(.horizontal, BenyuanSpacing.x4)

            content()
        }
        .padding(BenyuanSpacing.x8)
        .frame(maxWidth: 360)
        .background(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(BenyuanColor.bgVoid.opacity(0.82))
                .overlay(
                    RoundedRectangle(cornerRadius: 30, style: .continuous)
                        .stroke(BenyuanColor.glassStroke.opacity(0.94), lineWidth: 1)
                )
        )
        .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
        .shadow(color: BenyuanColor.accentGold.opacity(0.10), radius: 34, x: 0, y: 18)
    }

    private func progressTrack(_ value: Double) -> some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(BenyuanColor.textPrimary.opacity(0.08))
                Capsule()
                    .fill(
                        LinearGradient(
                            colors: [BenyuanColor.accentGold.opacity(0.68), BenyuanColor.textPrimary.opacity(0.92)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(width: max(18, proxy.size.width * min(max(value, 0), 1)))
                    .shadow(color: BenyuanColor.accentGold.opacity(0.22), radius: 8, x: 0, y: 0)
            }
        }
    }

    private func friendlyErrorMessage(_ raw: String) -> String {
        if BenyuanShellConfig.showsDebugUI {
            return raw
        }

        return "先停在这里。检查网络后，可以从同一处继续。"
    }

    private func debugLine(label: String, value: String) -> some View {
        Text("\(label): \(value)")
            .font(.system(size: 12, weight: .regular, design: .monospaced))
            .foregroundStyle(BenyuanColor.accentGold.opacity(0.95))
            .multilineTextAlignment(.center)
            .textSelection(.enabled)
    }
}

struct BenyuanPrimaryPillButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(spacing: BenyuanSpacing.x3) {
            Circle()
                .fill(BenyuanColor.accentGold)
                .frame(width: 7, height: 7)
                .shadow(color: BenyuanColor.accentGold.opacity(0.72), radius: 8)

            configuration.label
                .font(.system(size: BenyuanTypography.base, weight: .black, design: .default))
                .foregroundStyle(BenyuanColor.primaryCTAText)
        }
        .padding(.horizontal, BenyuanSpacing.x8)
        .padding(.vertical, BenyuanSpacing.x4)
        .background(
            Capsule()
                .fill(
                    LinearGradient(
                        colors: [
                            BenyuanColor.primaryCTA.opacity(0.98),
                            BenyuanColor.aubergineBlack.opacity(0.96)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    Capsule()
                        .stroke(BenyuanColor.accentGold.opacity(0.28), lineWidth: 1)
                )
        )
        .shadow(color: BenyuanColor.accentGold.opacity(configuration.isPressed ? 0.12 : 0.20), radius: configuration.isPressed ? 12 : 24, x: 0, y: configuration.isPressed ? 6 : 14)
        .scaleEffect(configuration.isPressed ? 0.985 : 1)
        .animation(.easeOut(duration: BenyuanMotion.fast), value: configuration.isPressed)
    }
}
