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
                    ScrollView(showsIndicators: false) {
                        VStack(alignment: .leading, spacing: BenyuanSpacing.x6) {
                            accountIdentityPanel
                            bindingOrbitSection
                            historyTimelineSection
                        }
                        .padding(.horizontal, BenyuanSpacing.x4)
                        .padding(.top, BenyuanSpacing.x6)
                        .padding(.bottom, accountDockHeight + geometry.safeAreaInsets.bottom + BenyuanSpacing.x8)
                    }
                    .safeAreaInset(edge: .bottom, spacing: 0) {
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
                        .trim(from: 0.08, to: min(max(identityProgress, 0.18), 0.92))
                        .stroke(BenyuanColor.accentGold.opacity(0.26), style: StrokeStyle(lineWidth: 1.2, lineCap: .round, dash: [2, 10]))
                        .frame(width: 138, height: 138)
                        .rotationEffect(.degrees(-24))
                }
                Spacer()
                VStack(alignment: .trailing, spacing: BenyuanSpacing.x2) {
                    Text(sessionProviderLabel)
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

            Text(model.session.user?.displayName ?? "本源访客")
                .font(.system(size: 32, weight: .semibold))
                .foregroundStyle(BenyuanColor.textPrimary)
                .minimumScaleFactor(0.72)

            Text("你的答案、图片线索、剧场选择和精神星图会归入这个私人月相档案。")
                .font(.system(size: 15, weight: .regular))
                .lineSpacing(6)
                .foregroundStyle(BenyuanColor.textSecondary)

            HStack(spacing: BenyuanSpacing.x2) {
                identityStat("身份", value: sessionProviderLabel)
                identityStat("绑定", value: "\(boundProviderCount)/4")
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
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            HStack(alignment: .top, spacing: BenyuanSpacing.x3) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("账户绑定")
                        .font(.system(size: 21, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text("Apple、微信和手机号会合并到同一份私人档案，后续换设备也能找回。")
                        .font(.system(size: 12, weight: .regular))
                        .lineSpacing(4)
                        .foregroundStyle(BenyuanColor.textSecondary)
                }
                Spacer()
                Text("\(boundProviderCount)")
                    .font(.system(size: 24, weight: .semibold, design: .monospaced))
                    .foregroundStyle(BenyuanColor.textPrimary)
                    .frame(width: 58, height: 58)
                    .background(Circle().fill(BenyuanColor.glassFill).overlay(Circle().stroke(BenyuanColor.accentGold.opacity(0.26))))
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: BenyuanSpacing.x3) {
                providerCard(provider: .apple, title: "Apple", systemImage: "apple.logo", bound: hasProvider(.apple), detail: hasProvider(.apple) ? "已连接系统身份" : "可在登录页接入")
                providerCard(provider: .wechat, title: "微信", systemImage: "message.fill", bound: model.session.user?.wechatBound == true || hasProvider(.wechat), detail: model.session.user?.wechatBound == true ? "已绑定微信" : "待开放平台资料")
                providerCard(provider: .phone, title: "手机号", systemImage: "iphone.gen3", bound: model.session.user?.phoneBound == true || hasProvider(.phone), detail: model.session.user?.phoneBound == true ? "已绑定手机号" : "待短信网关资料")
                providerCard(provider: .anonymous, title: "访客", systemImage: "moonphase.waxing.crescent", bound: hasProvider(.anonymous), detail: hasProvider(.anonymous) ? "当前可继续探索" : "未使用访客身份")
            }
        }
    }

    private func providerCard(provider: BenyuanAuthProvider, title: String, systemImage: String, bound: Bool, detail: String) -> some View {
        Button {
            model.showBindingInfo(provider)
        } label: {
            VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
                HStack {
                    Image(systemName: systemImage)
                        .font(.system(size: 14, weight: .black))
                        .foregroundStyle(bound ? BenyuanColor.accentGold : BenyuanColor.textTertiary)
                        .frame(width: 32, height: 32)
                        .background(Circle().fill(BenyuanColor.bgVoid.opacity(0.48)).overlay(Circle().stroke(BenyuanColor.glassStroke.opacity(0.76))))
                    Spacer()
                    Text(bound ? "bound" : "open")
                        .font(.system(size: 9, weight: .black, design: .monospaced))
                        .foregroundStyle(bound ? BenyuanColor.accentGold : BenyuanColor.textTertiary)
                }

                Text(title)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(BenyuanColor.textPrimary)

                Text(detail)
                    .font(.system(size: 12, weight: .semibold))
                    .lineSpacing(4)
                    .foregroundStyle(BenyuanColor.textSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(BenyuanSpacing.x4)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(bound ? BenyuanColor.glassFillStrong : BenyuanColor.glassFill)
                    .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(bound ? BenyuanColor.accentGold.opacity(0.22) : BenyuanColor.glassStroke))
            )
        }
        .buttonStyle(.plain)
    }

    private var historyTimelineSection: some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("我的探索")
                        .font(.system(size: 21, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text("草稿、剧场和星图都会按时间留在这里。")
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
                VStack(spacing: BenyuanSpacing.x3) {
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
        HStack(alignment: .top, spacing: BenyuanSpacing.x3) {
            VStack(spacing: 0) {
                Circle()
                    .fill(item.stage == .constellation ? BenyuanColor.accentGold : BenyuanColor.textPrimary.opacity(0.20))
                    .frame(width: 12, height: 12)
                    .shadow(color: item.stage == .constellation ? BenyuanColor.accentGold.opacity(0.36) : .clear, radius: 12)
                Rectangle()
                    .fill(BenyuanColor.glassStroke.opacity(0.72))
                    .frame(width: 1)
            }
            .frame(width: 18)

            VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
                historyMetaStrip(item)

                Text(item.title)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(BenyuanColor.textPrimary)
                    .lineLimit(2)

                Text(item.subtitle)
                    .font(.system(size: 12, weight: .semibold))
                    .lineSpacing(4)
                    .foregroundStyle(BenyuanColor.textSecondary)

                if let archetypeName = item.archetypeName {
                    Text(archetypeName)
                        .font(.system(size: 12, weight: .black))
                        .foregroundStyle(BenyuanColor.accentGold)
                }

                HStack(spacing: BenyuanSpacing.x2) {
                    Button {
                        model.openHistoryItem(item)
                    } label: {
                        HStack(spacing: 8) {
                            if model.restoringHistoryPart1Id == item.part1Id {
                                ProgressView()
                                    .tint(BenyuanColor.primaryCTAText)
                                    .scaleEffect(0.72)
                            }
                            Text(model.restoringHistoryPart1Id == item.part1Id ? "正在接回" : actionLabel(for: item))
                        }
                            .font(.system(size: 13, weight: .black))
                            .foregroundStyle(BenyuanColor.primaryCTAText)
                            .frame(maxWidth: .infinity, minHeight: 42)
                            .background(Capsule().fill(BenyuanColor.textPrimary))
                    }
                    .buttonStyle(.plain)
                    .disabled(model.restoringHistoryPart1Id != nil)

                    Button(role: .destructive) {
                        model.requestDeleteHistoryItem(item)
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 13, weight: .black))
                            .foregroundStyle(BenyuanColor.textSecondary)
                            .frame(width: 46, height: 42)
                            .background(Capsule().fill(BenyuanColor.glassFill).overlay(Capsule().stroke(BenyuanColor.glassStroke)))
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("删除")
                }
            }
            .padding(BenyuanSpacing.x4)
            .background(
                RoundedRectangle(cornerRadius: accountCardCornerRadius, style: .continuous)
                    .fill(BenyuanColor.glassFillStrong.opacity(0.84))
                    .overlay(RoundedRectangle(cornerRadius: accountCardCornerRadius, style: .continuous).stroke(BenyuanColor.glassStroke.opacity(0.86)))
            )
        }
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

    private func hasProvider(_ provider: BenyuanAuthProvider) -> Bool {
        model.session.user?.providers[provider.rawValue] != nil || model.session.authSession?.provider == provider
    }

    private var boundProviderCount: Int {
        [.anonymous, .apple, .wechat, .phone].filter { hasProvider($0) }.count
    }

    private var totalHistoryAssets: Int {
        model.accountHistory.reduce(0) { $0 + $1.assetCount }
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
            Text("「\(item.title)」会从这个账户的历史里移除。这个动作不会影响你继续新的探索。")
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
            Text(bindingTitle(provider))
                .font(.system(size: 24, weight: .black))
                .foregroundStyle(BenyuanColor.textPrimary)
            Text(bindingDetail(provider))
                .font(.system(size: 14, weight: .semibold))
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

    private var feedbackComposer: some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("反馈这次体验")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textPrimary)
                    Text("它会带上当前阶段与探索编号，方便后续定位。")
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
                        Text(kind.label)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(model.feedbackKind == kind ? BenyuanColor.bgVoid : BenyuanColor.textSecondary)
                            .frame(maxWidth: .infinity, minHeight: 36)
                            .background(
                                Capsule()
                                    .fill(model.feedbackKind == kind ? BenyuanColor.accentGold : BenyuanColor.bgSurface.opacity(0.86))
                                    .overlay(Capsule().stroke(model.feedbackKind == kind ? BenyuanColor.accentGold.opacity(0.64) : BenyuanColor.glassStroke))
                            )
                    }
                    .buttonStyle(.plain)
                }
            }

            TextEditor(text: $model.feedbackDraft)
                .font(.system(size: 15, weight: .regular))
                .foregroundStyle(BenyuanColor.textPrimary)
                .scrollContentBackground(.hidden)
                .frame(minHeight: 126)
                .padding(BenyuanSpacing.x3)
                .background(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(BenyuanColor.bgVoid.opacity(0.92))
                        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(BenyuanColor.glassStroke))
                )

            if let feedbackStatus = model.feedbackStatus {
                Text(feedbackStatus)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(BenyuanColor.accentGold)
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
                    Text(model.isFeedbackSubmitting ? "正在记录" : "提交反馈")
                }
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(BenyuanColor.bgVoid)
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(Capsule().fill(BenyuanColor.textPrimary))
            }
            .buttonStyle(.plain)
            .disabled(model.isFeedbackSubmitting)
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
            return hasProvider(.anonymous) ? "当前访客身份可以继续探索；绑定 Apple、微信或手机号后，后续换设备也能找回这份档案。" : "访客身份还没有建立，可以回到登录页先进入。"
        case .apple:
            return hasProvider(.apple) ? "Apple 已连接到当前档案。" : "Apple 登录可在入口页接入，成功后会合并到当前本源档案。"
        case .wechat:
            return model.session.user?.wechatBound == true || hasProvider(.wechat) ? "微信已绑定到当前档案。" : "微信登录入口已经预留，开放平台资料配置完成后会在这里变成可绑定。"
        case .phone:
            return model.session.user?.phoneBound == true || hasProvider(.phone) ? "手机号已绑定到当前档案。" : "短信网关和签名模板配置完成后，这里会开放手机号绑定。"
        }
    }
}
