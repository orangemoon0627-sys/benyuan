import SwiftUI

struct BenyuanNativeAccountView: View {
    @ObservedObject var model: BenyuanNativeFlowModel
    private let accountCardCornerRadius: CGFloat = 28
    private let accountDockHeight: CGFloat = 92

    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                BenyuanNativeTopBar(progress: 1, label: "我的本源")

                GeometryReader { geometry in
                    VStack(spacing: 0) {
                        ScrollView(showsIndicators: false) {
                            VStack(alignment: .leading, spacing: BenyuanSpacing.x6) {
                                accountIdentityPanel
                                bindingOrbitSection
                                historyTimelineSection
                            }
                            .padding(.horizontal, BenyuanSpacing.x4)
                            .padding(.top, BenyuanSpacing.x6)
                            .padding(.bottom, BenyuanSpacing.x6)
                        }

                        accountBottomActionDock
                            .frame(height: accountDockHeight + geometry.safeAreaInsets.bottom)
                    }
                }
            }

            if model.isDeleteHistoryConfirmationPresented, let item = model.pendingDeleteHistoryItem {
                accountOverlay {
                    deleteConfirmation(item)
                }
            }

            if let provider = model.activeBindingProvider {
                accountOverlay {
                    bindingInfo(provider)
                }
            }

            if model.isFeedbackComposerPresented {
                accountOverlay {
                    feedbackComposer
                }
            }
        }
        .animation(.easeInOut(duration: BenyuanMotion.base), value: model.isDeleteHistoryConfirmationPresented)
        .animation(.easeInOut(duration: BenyuanMotion.base), value: model.activeBindingProvider)
        .animation(.easeInOut(duration: BenyuanMotion.base), value: model.isFeedbackComposerPresented)
    }

    private var accountIdentityPanel: some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            HStack(alignment: .top) {
                ZStack {
                    BenyuanDeepCelestialBody(size: 116, progress: identityProgress, mode: .constellation)
                    Circle()
                        .stroke(BenyuanColor.accentGold.opacity(0.18), style: StrokeStyle(lineWidth: 1.2, lineCap: .round, dash: [2, 10]))
                        .frame(width: 138, height: 138)
                        .rotationEffect(.degrees(identityProgress * 42 - 24))
                }
                Spacer()
                VStack(alignment: .trailing, spacing: BenyuanSpacing.x2) {
                    Text(sessionProviderDisplayLabel)
                        .font(.system(size: 12, weight: .black, design: .monospaced))
                        .foregroundStyle(BenyuanColor.accentGold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Capsule().fill(BenyuanColor.glassFill).overlay(Capsule().stroke(BenyuanColor.glassStroke)))
                    Text("\(model.accountHistory.count) 次探索")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(BenyuanColor.textTertiary)
                }
            }

            Text(model.session.user?.displayName ?? "我的本源档案")
                .font(.system(size: 30, weight: .semibold))
                .foregroundStyle(BenyuanColor.textPrimary)
                .minimumScaleFactor(0.72)

            Text("身份摘要会跟随你的探索、剧场选择和星图记录一起保存。")
                .font(.system(size: 14, weight: .regular))
                .lineSpacing(5)
                .foregroundStyle(BenyuanColor.textSecondary)

            HStack(spacing: BenyuanSpacing.x2) {
                identityStat("探索", value: "\(model.accountHistory.count)")
                identityStat("身份", value: sessionProviderDisplayLabel)
                identityStat("线索", value: "\(totalHistoryAssets)")
            }
        }
        .padding(BenyuanSpacing.x6)
        .background(
            ZStack {
                BenyuanFlowOrbitTrail(progress: identityProgress, intensity: 0.34, tilt: -10)
                    .opacity(0.72)
                RoundedRectangle(cornerRadius: accountCardCornerRadius, style: .continuous)
                    .fill(BenyuanColor.glassFillStrong.opacity(0.84))
                    .overlay(RoundedRectangle(cornerRadius: accountCardCornerRadius, style: .continuous).stroke(BenyuanColor.glassStroke.opacity(0.86)))
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: accountCardCornerRadius, style: .continuous))
    }

    private func identityStat(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.textTertiary)
            Text(value)
                .font(.system(size: 15, weight: .black))
                .foregroundStyle(BenyuanColor.textPrimary)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, BenyuanSpacing.x3)
        .padding(.vertical, 10)
        .background(Capsule().fill(BenyuanColor.bgVoid.opacity(0.44)).overlay(Capsule().stroke(BenyuanColor.glassStroke.opacity(0.72))))
    }

    private var bindingOrbitSection: some View {
        Button {
            model.showBindingInfo(.anonymous)
        } label: {
            HStack(spacing: BenyuanSpacing.x3) {
                ZStack {
                    Circle()
                        .fill(BenyuanColor.bgVoid.opacity(0.56))
                        .frame(width: 38, height: 38)
                    Image(systemName: "link")
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(BenyuanColor.accentGold)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("档案设置")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text("管理恢复方式和当前身份，不打断主探索。")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(BenyuanColor.textSecondary)
                        .lineLimit(2)
                }

                Spacer(minLength: 0)

                Text(recoverySummaryLabel)
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .foregroundStyle(BenyuanColor.accentGold)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 7)
                    .background(Capsule().fill(BenyuanColor.bgVoid.opacity(0.46)).overlay(Capsule().stroke(BenyuanColor.glassStroke.opacity(0.72))))

                Image(systemName: "chevron.right")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(BenyuanColor.textTertiary)
            }
            .padding(BenyuanSpacing.x4)
            .background(
                Capsule()
                    .fill(BenyuanColor.glassFill.opacity(0.80))
                    .overlay(Capsule().stroke(BenyuanColor.glassStroke.opacity(0.86)))
            )
        }
        .buttonStyle(BenyuanPressableMotionStyle(scale: 0.972, glow: 0.08, haptic: .light))
    }

    private var historyTimelineSection: some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("探索历史")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text("按时间收纳草稿、剧场和星图。")
                        .font(.system(size: 12, weight: .regular))
                        .foregroundStyle(BenyuanColor.textSecondary)
                }
                Spacer()
                Button {
                    Task { await model.refreshAccountHistory() }
                } label: {
                    Text(model.isAccountHistoryLoading ? "同步中" : "同步")
                        .font(.system(size: 11, weight: .black, design: .monospaced))
                        .foregroundStyle(BenyuanColor.accentGold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Capsule().fill(BenyuanColor.glassFill).overlay(Capsule().stroke(BenyuanColor.glassStroke)))
                }
                .buttonStyle(.plain)
            }

            if model.accountHistory.isEmpty {
                emptyHistory
            } else {
                VStack(spacing: BenyuanSpacing.x2) {
                    ForEach(model.accountHistory) { item in
                        historyCard(item)
                    }
                }
            }
        }
    }

    private var emptyHistory: some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
            Text("还没有封存的探索")
                .font(.system(size: 18, weight: .black))
                .foregroundStyle(BenyuanColor.textPrimary)
            Text("完成 Part 1 后，这里会出现你的草稿；生成星图后，它会变成一份可回看的结果档案。")
                .font(.system(size: 13, weight: .semibold))
                .lineSpacing(5)
                .foregroundStyle(BenyuanColor.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(BenyuanSpacing.x4)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(BenyuanColor.glassFill.opacity(0.72))
                .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous).stroke(BenyuanColor.glassStroke))
        )
    }

    private func historyCard(_ item: BenyuanAccountHistoryItem) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x2) {
            historyMetaStrip(item)

            HStack(alignment: .top, spacing: BenyuanSpacing.x3) {
                VStack(alignment: .leading, spacing: 5) {
                    Text(item.titleForNativeDisplay)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textPrimary)
                        .lineLimit(1)

                    Text(compactHistorySubtitle(item))
                        .font(.system(size: 12, weight: .regular))
                        .lineSpacing(3)
                        .foregroundStyle(BenyuanColor.textSecondary)
                        .lineLimit(2)
                }

                Spacer(minLength: 0)

                HStack(spacing: BenyuanSpacing.x2) {
                    Button {
                        model.openHistoryItem(item)
                    } label: {
                        HStack(spacing: 6) {
                            if model.restoringHistoryPart1Id == item.part1Id {
                                ProgressView()
                                    .tint(BenyuanColor.bgVoid)
                                    .scaleEffect(0.66)
                            }
                            Text(model.restoringHistoryPart1Id == item.part1Id ? "正在接回" : actionLabel(for: item))
                        }
                        .font(.system(size: 12, weight: .black))
                        .foregroundStyle(BenyuanColor.bgVoid)
                        .frame(width: 92, height: 38)
                        .background(Capsule().fill(BenyuanColor.textPrimary))
                    }
                    .buttonStyle(.plain)
                    .disabled(model.restoringHistoryPart1Id != nil)

                    Button(role: .destructive) {
                        model.requestDeleteHistoryItem(item)
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 12, weight: .black))
                            .foregroundStyle(BenyuanColor.textSecondary)
                            .frame(width: 38, height: 38)
                            .background(Capsule().fill(BenyuanColor.glassFill).overlay(Capsule().stroke(BenyuanColor.glassStroke)))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("删除")
                }
            }
        }
        .padding(.horizontal, BenyuanSpacing.x4)
        .padding(.vertical, BenyuanSpacing.x3)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(BenyuanColor.glassFillStrong.opacity(0.78))
                .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(BenyuanColor.glassStroke.opacity(0.76)))
        )
    }

    private func historyMetaStrip(_ item: BenyuanAccountHistoryItem) -> some View {
        HStack(spacing: BenyuanSpacing.x2) {
            Text(item.stage.label)
                .font(.system(size: 10, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.accentGold)
            Text("线索 \(item.assetCount)")
                .font(.system(size: 10, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.textTertiary)
            Spacer(minLength: 0)
            Text(shortDate(item.updatedAt))
                .font(.system(size: 10, weight: .black, design: .monospaced))
                .foregroundStyle(BenyuanColor.textTertiary)
        }
    }

    private var accountBottomActionDock: some View {
        HStack(spacing: BenyuanSpacing.x2) {
            Button {
                model.returnToFlow()
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "moonphase.waxing.crescent")
                        .font(.system(size: 13, weight: .semibold))
                    Text("返回")
                }
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(BenyuanColor.textPrimary)
                .frame(maxWidth: .infinity, minHeight: 48)
                .background(Capsule().fill(BenyuanColor.primaryCTA).overlay(Capsule().stroke(BenyuanColor.accentGold.opacity(0.28))))
            }
            .buttonStyle(.plain)

            accountDockIconButton(systemImage: "arrow.clockwise", label: "刷新") {
                Task { await model.refreshAccount() }
            }

            accountDockIconButton(systemImage: "waveform.path.badge.plus", label: "反馈") {
                model.showFeedbackComposer()
            }

            accountDockIconButton(systemImage: "rectangle.portrait.and.arrow.right", label: "退出", role: .destructive) {
                Task { await model.logout() }
            }
            .accessibilityLabel("退出登录")
        }
        .padding(.horizontal, BenyuanSpacing.x4)
        .padding(.top, BenyuanSpacing.x3)
        .background(
            LinearGradient(
                colors: [
                    BenyuanColor.bgVoid.opacity(0),
                    BenyuanColor.bgVoid.opacity(0.76),
                    BenyuanColor.bgVoid
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
        )
    }

    private func accountDockIconButton(systemImage: String, label: String, role: ButtonRole? = nil, action: @escaping () -> Void) -> some View {
        Button(role: role, action: action) {
            VStack(spacing: 4) {
                Image(systemName: systemImage)
                    .font(.system(size: 13, weight: .semibold))
                Text(label)
                    .font(.system(size: 10, weight: .semibold))
            }
            .foregroundStyle(role == .destructive ? BenyuanColor.textTertiary : BenyuanColor.textPrimary)
            .frame(width: 52, height: 48)
            .background(Capsule().fill(BenyuanColor.glassFill).overlay(Capsule().stroke(BenyuanColor.glassStroke.opacity(0.84))))
        }
        .buttonStyle(.plain)
    }

    private var sessionProviderLabel: String {
        switch model.session.authSession?.provider {
        case .anonymous: return "VISITOR"
        case .apple: return "APPLE"
        case .wechat: return "WECHAT"
        case .phone: return "PHONE"
        case nil: return "NO SESSION"
        }
    }

    private var sessionProviderDisplayLabel: String {
        switch model.session.authSession?.provider {
        case .anonymous: return "访客"
        case .apple: return "Apple"
        case .wechat: return "微信"
        case .phone: return "手机"
        case nil: return "未登录"
        }
    }

    private func hasProvider(_ provider: BenyuanAuthProvider) -> Bool {
        model.session.user?.providers[provider.rawValue] != nil || model.session.authSession?.provider == provider
    }

    private func isProviderBound(_ provider: BenyuanAuthProvider) -> Bool {
        switch provider {
        case .anonymous, .apple:
            return hasProvider(provider)
        case .wechat:
            return model.session.user?.wechatBound == true || hasProvider(.wechat)
        case .phone:
            return model.session.user?.phoneBound == true || hasProvider(.phone)
        }
    }

    private var boundProviderCount: Int {
        [.anonymous, .apple, .wechat, .phone].filter { isProviderBound($0) }.count
    }

    private var recoverySummaryLabel: String {
        "恢复 \(boundProviderCount)/4"
    }

    private var totalHistoryAssets: Int {
        model.accountHistory.reduce(0) { $0 + $1.assetCount }
    }

    private var feedbackStateLabel: String {
        if model.isFeedbackSubmitting {
            return "提交中"
        }

        if let status = model.feedbackStatus {
            if status.contains("已收到编号") {
                return "已收到编号"
            }
            if status.contains("提交失败") {
                return "提交失败"
            }
            if status.contains("待填写") {
                return "待填写"
            }
        }

        return model.canSubmitFeedback ? "待提交" : "待填写"
    }

    private var feedbackStateColor: Color {
        switch feedbackStateLabel {
        case "已收到编号":
            return BenyuanColor.accentGold
        case "提交失败", "待填写":
            return BenyuanColor.textTertiary
        default:
            return BenyuanColor.textSecondary
        }
    }

    private var identityProgress: Double {
        min(max(Double(boundProviderCount) / 4.0 + Double(model.accountHistory.count) * 0.08, 0.28), 0.92)
    }

    private func shortDate(_ iso: String) -> String {
        String(iso.prefix(10))
    }

    private func actionLabel(for item: BenyuanAccountHistoryItem) -> String {
        switch item.stage {
        case .part1: return "继续未完成"
        case .theater, .part2: return "回看剧场"
        case .constellation: return "查看星图"
        }
    }

    private func compactHistorySubtitle(_ item: BenyuanAccountHistoryItem) -> String {
        if let archetypeName = item.canonicalArchetypeNameForDisplay {
            return "\(archetypeName) · \(item.subtitleForNativeDisplay)"
        }
        return item.subtitleForNativeDisplay
    }

    private func accountOverlay<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        ZStack {
            BenyuanColor.bgVoid.opacity(0.82)
                .ignoresSafeArea()
                .onTapGesture {
                    model.cancelDeleteHistoryItem()
                    model.dismissBindingInfo()
                    model.dismissFeedbackComposer()
                }

            content()
                .padding(BenyuanSpacing.x6)
                .transition(.opacity.combined(with: .scale(scale: 0.98)))
        }
    }

    private func deleteConfirmation(_ item: BenyuanAccountHistoryItem) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            Text("删除这次探索？")
                .font(.system(size: 24, weight: .black))
                .foregroundStyle(BenyuanColor.textPrimary)
            Text("「\(item.titleForNativeDisplay)」会从这个账户的历史里移除。这个动作不会影响你继续新的探索。")
                .font(.system(size: 14, weight: .semibold))
                .lineSpacing(5)
                .foregroundStyle(BenyuanColor.textSecondary)

            HStack(spacing: BenyuanSpacing.x2) {
                Button {
                    model.cancelDeleteHistoryItem()
                } label: {
                    Text("保留")
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(BenyuanColor.textPrimary)
                        .frame(maxWidth: .infinity, minHeight: 46)
                        .background(Capsule().fill(BenyuanColor.glassFill).overlay(Capsule().stroke(BenyuanColor.glassStroke)))
                }
                .buttonStyle(.plain)

                Button(role: .destructive) {
                    Task { await model.confirmDeleteHistoryItem() }
                } label: {
                    Text("删除")
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(BenyuanColor.primaryCTAText)
                        .frame(maxWidth: .infinity, minHeight: 46)
                        .background(Capsule().fill(BenyuanColor.textPrimary))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(BenyuanSpacing.x6)
        .background(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(BenyuanColor.glassFillStrong)
                .overlay(RoundedRectangle(cornerRadius: 30, style: .continuous).stroke(BenyuanColor.glassStroke))
        )
    }

    private func bindingInfo(_ provider: BenyuanAuthProvider) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("档案设置")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text("当前可恢复方式")
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(BenyuanColor.textSecondary)
                }
                Spacer()
                Button {
                    model.dismissBindingInfo()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textSecondary)
                        .frame(width: 34, height: 34)
                        .background(Circle().fill(BenyuanColor.glassFill).overlay(Circle().stroke(BenyuanColor.glassStroke)))
                }
                .buttonStyle(.plain)
            }

            VStack(spacing: BenyuanSpacing.x2) {
                bindingRow(provider: .apple, title: "Apple", systemImage: "apple.logo", bound: isProviderBound(.apple), detail: isProviderBound(.apple) ? "已连接" : "未连接")
                bindingRow(provider: .wechat, title: "微信", systemImage: "message.fill", bound: isProviderBound(.wechat), detail: isProviderBound(.wechat) ? "已连接" : "待配置")
                bindingRow(provider: .phone, title: "手机号", systemImage: "iphone.gen3", bound: isProviderBound(.phone), detail: isProviderBound(.phone) ? "已连接" : "待配置")
                bindingRow(provider: .anonymous, title: "访客", systemImage: "moonphase.waxing.crescent", bound: isProviderBound(.anonymous), detail: isProviderBound(.anonymous) ? "当前可用" : "未使用")
            }

            Text(bindingDetail(provider))
                .font(.system(size: 13, weight: .regular))
                .lineSpacing(5)
                .foregroundStyle(BenyuanColor.textSecondary)

            Button {
                model.dismissBindingInfo()
            } label: {
                Text("知道了")
                    .font(.system(size: 14, weight: .black))
                    .foregroundStyle(BenyuanColor.primaryCTAText)
                    .frame(maxWidth: .infinity, minHeight: 48)
                    .background(Capsule().fill(BenyuanColor.textPrimary))
            }
            .buttonStyle(.plain)
        }
        .padding(BenyuanSpacing.x6)
        .background(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(BenyuanColor.glassFillStrong)
                .overlay(RoundedRectangle(cornerRadius: 30, style: .continuous).stroke(BenyuanColor.glassStroke))
        )
    }

    private func bindingRow(provider: BenyuanAuthProvider, title: String, systemImage: String, bound: Bool, detail: String) -> some View {
        Button {
            model.showBindingInfo(provider)
        } label: {
            HStack(spacing: BenyuanSpacing.x3) {
                Image(systemName: systemImage)
                    .font(.system(size: 13, weight: .black))
                    .foregroundStyle(bound ? BenyuanColor.accentGold : BenyuanColor.textTertiary)
                    .frame(width: 30, height: 30)
                    .background(Circle().fill(BenyuanColor.bgVoid.opacity(0.48)).overlay(Circle().stroke(BenyuanColor.glassStroke.opacity(0.76))))

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text(detail)
                        .font(.system(size: 11, weight: .regular))
                        .foregroundStyle(BenyuanColor.textTertiary)
                }

                Spacer(minLength: 0)

                Text(bound ? "已启用" : "未启用")
                    .font(.system(size: 10, weight: .black))
                    .foregroundStyle(bound ? BenyuanColor.bgVoid : BenyuanColor.textTertiary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(bound ? BenyuanColor.accentGold : BenyuanColor.glassFill).overlay(Capsule().stroke(BenyuanColor.glassStroke.opacity(0.72))))
            }
            .padding(.horizontal, BenyuanSpacing.x3)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(isActiveBindingRow(provider) ? BenyuanColor.glassFillStrong : BenyuanColor.glassFill.opacity(0.68))
                    .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(isActiveBindingRow(provider) ? BenyuanColor.accentGold.opacity(0.22) : BenyuanColor.glassStroke.opacity(0.72)))
            )
        }
        .buttonStyle(.plain)
    }

    private func isActiveBindingRow(_ provider: BenyuanAuthProvider) -> Bool {
        model.activeBindingProvider?.rawValue == provider.rawValue
    }

    private var feedbackComposer: some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("问题收集")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text("描述一个具体问题，提交后只返回记录编号。")
                        .font(.system(size: 13, weight: .regular))
                        .foregroundStyle(BenyuanColor.textSecondary)
                }
                Spacer()
                Button {
                    model.dismissFeedbackComposer()
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textSecondary)
                        .frame(width: 34, height: 34)
                        .background(Circle().fill(BenyuanColor.glassFill).overlay(Circle().stroke(BenyuanColor.glassStroke)))
                }
                .buttonStyle(.plain)
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: BenyuanSpacing.x2) {
                ForEach(BenyuanFeedbackKind.allCases) { kind in
                    Button {
                        model.feedbackKind = kind
                    } label: {
                        HStack(spacing: 6) {
                            if model.feedbackKind == kind {
                                Image(systemName: "checkmark")
                                    .font(.system(size: 10, weight: .black))
                            }

                            Text(kind.label)
                                .lineLimit(1)
                                .minimumScaleFactor(0.82)
                        }
                            .font(.system(size: 12, weight: model.feedbackKind == kind ? .black : .semibold))
                            .foregroundStyle(model.feedbackKind == kind ? Color.black : BenyuanColor.textSecondary)
                            .frame(maxWidth: .infinity, minHeight: 36)
                            .background(
                                Capsule()
                                    .fill(model.feedbackKind == kind ? Color.white : BenyuanColor.bgSurface.opacity(0.86))
                                    .overlay(Capsule().stroke(model.feedbackKind == kind ? Color.white.opacity(0.78) : BenyuanColor.glassStroke))
                            )
                    }
                    .buttonStyle(.plain)
                }
            }

            ZStack(alignment: .topLeading) {
                TextEditor(text: $model.feedbackDraft)
                    .font(.system(size: 15, weight: .regular))
                    .foregroundStyle(BenyuanColor.textPrimary)
                    .scrollContentBackground(.hidden)
                    .frame(height: 154)
                    .padding(BenyuanSpacing.x3)

                if model.feedbackDraft.isEmpty {
                    Text("写下看到的问题、发生位置和复现线索。")
                        .font(.system(size: 14, weight: .regular))
                        .foregroundStyle(BenyuanColor.textTertiary)
                        .lineSpacing(5)
                        .padding(.horizontal, BenyuanSpacing.x4 + 1)
                        .padding(.vertical, BenyuanSpacing.x4)
                        .allowsHitTesting(false)
                }
            }
            .frame(height: 178)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(BenyuanColor.bgVoid.opacity(0.92))
                    .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(BenyuanColor.glassStroke))
            )

            HStack {
                Text(feedbackStateLabel)
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .foregroundStyle(feedbackStateColor)
                Spacer()
                Text("\(model.feedbackCharacterCount) 字")
                    .font(.system(size: 11, weight: .black, design: .monospaced))
                    .foregroundStyle(BenyuanColor.textTertiary)
            }

            if let feedbackStatus = model.feedbackStatus {
                Text(feedbackStatus)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(feedbackStatus.contains("提交失败") || feedbackStatus.contains("待填写") ? BenyuanColor.textSecondary : BenyuanColor.accentGold)
                    .lineSpacing(4)
            }

            Button {
                Task { await model.submitFeedback() }
            } label: {
                HStack(spacing: 8) {
                    if model.isFeedbackSubmitting {
                        ProgressView()
                            .tint(BenyuanColor.primaryCTAText)
                            .scaleEffect(0.74)
                    }
                    Text(model.isFeedbackSubmitting ? "提交中" : "提交问题")
                }
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(model.canSubmitFeedback ? BenyuanColor.bgVoid : BenyuanColor.textTertiary)
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(Capsule().fill(model.canSubmitFeedback ? BenyuanColor.textPrimary : BenyuanColor.glassFill))
                .overlay(Capsule().stroke(model.canSubmitFeedback ? Color.clear : BenyuanColor.glassStroke))
            }
            .buttonStyle(.plain)
            .disabled(!model.canSubmitFeedback)
        }
        .padding(BenyuanSpacing.x6)
        .background(
            RoundedRectangle(cornerRadius: 30, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            BenyuanColor.bgSurface.opacity(0.98),
                            BenyuanColor.bgSurface.opacity(0.96),
                            BenyuanColor.bgVoid.opacity(0.98)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(RoundedRectangle(cornerRadius: 30, style: .continuous).stroke(BenyuanColor.glassStroke.opacity(1.45)))
        )
        .shadow(color: BenyuanColor.bgVoid.opacity(0.72), radius: 34, y: 20)
    }

    private func bindingTitle(_ provider: BenyuanAuthProvider) -> String {
        switch provider {
        case .anonymous: return "访客档案"
        case .apple: return "Apple 身份"
        case .wechat: return "微信绑定"
        case .phone: return "手机号绑定"
        }
    }

    private func bindingDetail(_ provider: BenyuanAuthProvider) -> String {
        switch provider {
        case .anonymous:
            return isProviderBound(.anonymous) ? "访客状态已写入当前档案；需要跨设备恢复时，可在登录入口接入其他方式。" : "访客状态还没有建立，可以回到登录页先进入。"
        case .apple:
            return isProviderBound(.apple) ? "Apple 已连接到当前档案。" : "Apple 登录可在入口页接入，成功后会合并到当前本源档案。"
        case .wechat:
            return isProviderBound(.wechat) ? "微信已绑定到当前档案。" : "微信登录入口已经预留，开放平台资料配置完成后会在这里变成可绑定。"
        case .phone:
            return isProviderBound(.phone) ? "手机号已绑定到当前档案。" : "短信网关和签名模板配置完成后，这里会开放手机号绑定。"
        }
    }
}
