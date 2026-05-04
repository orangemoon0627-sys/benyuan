import SwiftUI

struct BenyuanShellRootView: View {
    @StateObject private var state = BenyuanShellState()
    @StateObject private var networkMonitor = BenyuanNetworkMonitor()
    @State private var reloadToken = UUID()

    var body: some View {
        ZStack(alignment: .top) {
            BenyuanColor.bgVoid.ignoresSafeArea()

            BenyuanWebContainerView(isLoading: $state.isLoading, currentURL: $state.currentURL, errorMessage: $state.errorMessage, reloadToken: reloadToken, shellState: state)
                .ignoresSafeArea()

            if !networkMonitor.isOnline {
                banner(text: "当前网络不可用，恢复连接后可继续本源流程。")
                    .padding(.top, BenyuanSpacing.x12)
            }

            if let errorMessage = state.errorMessage {
                VStack(spacing: BenyuanSpacing.x4) {
                    Text("当前页面未能正常加载")
                        .font(.system(size: BenyuanTypography.lg, weight: .medium))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text(errorMessage)
                        .font(.system(size: BenyuanTypography.sm, weight: .regular))
                        .foregroundStyle(BenyuanColor.textSecondary)
                        .multilineTextAlignment(.center)
                    Button("重新加载") {
                        state.errorMessage = nil
                        reloadToken = UUID()
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(BenyuanColor.accentGold)
                }
                .padding(BenyuanSpacing.x8)
                .background(BenyuanColor.bgAbyss.opacity(0.94))
                .padding(.horizontal, BenyuanSpacing.x8)
            }

            if state.isLoading {
                VStack(spacing: BenyuanSpacing.x6) {
                    Text("本源")
                        .font(.system(size: BenyuanTypography.x3l, weight: .light))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text("正在接住你的路径…")
                        .font(.system(size: BenyuanTypography.sm, weight: .regular))
                        .foregroundStyle(BenyuanColor.textSecondary)
                }
                .padding(BenyuanSpacing.x8)
                .background(BenyuanColor.bgAbyss.opacity(0.92))
            }
        }
        .preferredColorScheme(.dark)
        .sheet(isPresented: $state.isShareSheetPresented, onDismiss: state.clearShare) {
            BenyuanShareSheet(items: state.shareItems)
        }
    }

    private func banner(text: String) -> some View {
        Text(text)
            .font(.system(size: BenyuanTypography.sm, weight: .regular))
            .foregroundStyle(BenyuanColor.textPrimary)
            .padding(.horizontal, BenyuanSpacing.x6)
            .padding(.vertical, BenyuanSpacing.x3)
            .background(BenyuanColor.bgAbyss.opacity(0.92))
    }
}
