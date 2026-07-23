import Foundation

@MainActor
extension BenyuanNativeFlowModel {
    var isPhoneAuthReady: Bool {
        authProviders?.provider(.phone)?.status == .ready
    }

    var isWechatAuthReady: Bool {
        authProviders?.provider(.wechat)?.status == .ready
    }

    var feedbackMinimumCharacterCount: Int {
        4
    }

    var feedbackTrimmedMessage: String {
        feedbackDraft.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var feedbackCharacterCount: Int {
        feedbackTrimmedMessage.count
    }

    var canSubmitFeedback: Bool {
        feedbackCharacterCount >= feedbackMinimumCharacterCount && !isFeedbackSubmitting
    }

    func showAccount() {
        if stage != .account {
            stageBeforeAccount = stage
        }
        stage = .account
        Task {
            await refreshAccount()
            await refreshAccountHistory()
        }
    }

    func returnToFlow() {
        if session.authSession == nil {
            stageBeforeAccount = nil
            stage = .auth
            return
        }

        let previousStage = stageBeforeAccount
        stageBeforeAccount = nil

        switch previousStage {
        case .some(.launching), .some(.auth), .some(.account), .some(.home), .none:
            stage = .home
        case .some(.processing):
            stage = session.constellationId != nil ? .constellation : session.theaterScriptId != nil ? .theater : .collect
        case .some(.error):
            stage = .collect
        case .some(let route):
            stage = route
        }
    }

    func refreshAccount() async {
        guard session.authSession != nil else {
            stage = .auth
            return
        }

        do {
            let auth = try await client.fetchCurrentAccount()
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            if auth.session.provider == .apple {
                store.saveAppleDisplayName(auth.user.displayName)
            }
            persist()
        } catch {
            if isExpiredAuthError(error) {
                clearLocalAuthAfterLogout()
                showToast("登录状态已过期，请重新登录。")
                return
            }
            showToast("账户状态暂时无法同步，请稍后再试。")
        }
    }

    func refreshStoredAuthSessionOnLaunch() async {
        guard session.authSession != nil else { return }
        _ = await refreshAuthSessionOrClear(showExpiredToast: false)
    }

    func ensureCurrentAuthSession() async -> Bool {
        guard session.authSession != nil else {
            stage = .auth
            return false
        }
        return await refreshAuthSessionOrClear(showExpiredToast: true)
    }

    private func refreshAuthSessionOrClear(showExpiredToast: Bool) async -> Bool {
        do {
            let auth = try await client.fetchCurrentAccount()
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            if auth.session.provider == .apple {
                store.saveAppleDisplayName(auth.user.displayName)
            }
            persist()
            return true
        } catch {
            if isExpiredAuthError(error) {
                clearLocalAuthAfterLogout()
                if showExpiredToast {
                    showToast("登录状态已过期，请重新登录。")
                }
                return false
            }

            if showExpiredToast {
                showToast("账户状态暂时无法确认，请稍后再试。")
            }
            return false
        }
    }

    func isExpiredAuthError(_ error: Error) -> Bool {
        guard case BenyuanAPIError.server(let status, let message) = error else {
            return false
        }
        return status == 401 && message == "auth_required"
    }

    func showBindingInfo(_ provider: BenyuanAuthProvider) {
        activeBindingProvider = provider
    }

    func dismissBindingInfo() {
        activeBindingProvider = nil
    }

    func showFeedbackComposer() {
        feedbackStatus = nil
        if feedbackDraft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            feedbackDraft = ""
        }
        isFeedbackComposerPresented = true
    }

    func dismissFeedbackComposer() {
        isFeedbackComposerPresented = false
        feedbackStatus = nil
    }

    func presentProfileEditor(beginExplorationAfterSave: Bool = false) {
        prepareProfileDraft()
        beginExplorationAfterProfileCompletion = beginExplorationAfterSave
        isProfileEditorPresented = true
    }

    func dismissProfileEditor() {
        if requiresProfileCompletion(session.user) && beginExplorationAfterProfileCompletion {
            showToast("先保存名称和头像，再开始探索。")
            return
        }
        beginExplorationAfterProfileCompletion = false
        isProfileEditorPresented = false
    }

    func dismissAccountTransientSurfaces() {
        cancelDeleteHistoryItem()
        dismissBindingInfo()
        dismissFeedbackComposer()
    }

    func submitFeedback() async {
        let message = feedbackTrimmedMessage
        guard message.count >= feedbackMinimumCharacterCount else {
            feedbackStatus = "待填写：至少写 4 个字，方便定位问题。"
            return
        }

        isFeedbackSubmitting = true
        feedbackStatus = "提交中"
        defer { isFeedbackSubmitting = false }

        do {
            let response = try await client.submitFeedback(
                kind: feedbackKind,
                message: message,
                stage: stage,
                session: session
            )
            feedbackDraft = ""
            feedbackStatus = "已收到编号：\(response.feedbackId)"
            showToast("问题已收到。")
            isFeedbackComposerPresented = true
        } catch {
            feedbackStatus = "提交失败：\(error.localizedDescription)"
        }
    }

    func refreshAuthProviders() async {
        do {
            authProviders = try await client.fetchAuthProviders()
        } catch {
            showToast("登录能力表暂时无法读取，请先尝试 Apple 登录。")
        }
    }

    func updateDisplayName(_ displayName: String) async {
        let normalized = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalized.isEmpty else {
            showToast("名称不能为空。")
            return
        }

        isDisplayNameUpdating = true
        defer { isDisplayNameUpdating = false }

        do {
            let auth = try await client.updateDisplayName(normalized)
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            if auth.session.provider == .apple {
                store.saveAppleDisplayName(auth.user.displayName)
            }
            persist()
            showToast("名称已更新。")
        } catch {
            if isExpiredAuthError(error) {
                clearLocalAuthAfterLogout()
                showToast("登录状态已过期，请重新登录。")
                return
            }
            showToast(error.localizedDescription)
        }
    }

    func requiresProfileCompletion(_ user: BenyuanUser?) -> Bool {
        guard let user else { return true }
        if user.primaryProvider == .anonymous { return false }
        let name = normalizedProfileName(user.displayName)
        let hasAvatar = !(user.avatarSymbol?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true)
        if user.profileStatus == "complete", name != nil, hasAvatar {
            return false
        }
        return name == nil || !hasAvatar
    }

    func prepareProfileDraft() {
        let user = session.user
        let existingAvatar = user?.avatarSymbol?.trimmingCharacters(in: .whitespacesAndNewlines)
        profileDraft = BenyuanProfileDraft(
            displayName: normalizedProfileName(user?.displayName) ?? "",
            avatarSymbol: existingAvatar?.isEmpty == false ? existingAvatar ?? "moon.stars.fill" : "moon.stars.fill",
            birthYearText: user?.birthYear.map(String.init) ?? "",
            gender: user?.gender ?? "undisclosed",
            profileBio: user?.profileBio ?? ""
        )
    }

    func completeUserProfile() async {
        let displayName = profileDraft.displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !displayName.isEmpty, normalizedProfileName(displayName) != nil else {
            showToast("先填一个真实可用的名称。")
            return
        }
        let avatarSymbol = allowedProfileAvatarSymbols.contains(profileDraft.avatarSymbol) ? profileDraft.avatarSymbol : "moon.stars.fill"
        let birthYear: Int?
        let birthYearText = profileDraft.birthYearText.trimmingCharacters(in: .whitespacesAndNewlines)
        if birthYearText.isEmpty {
            birthYear = nil
        } else if let value = Int(birthYearText), value >= 1900, value <= Calendar.current.component(.year, from: Date()) {
            birthYear = value
        } else {
            showToast("出生年份需要在 1900 到今年之间。")
            return
        }
        let gender = allowedProfileGenders.contains(profileDraft.gender) ? profileDraft.gender : "undisclosed"
        let profileBio = String(profileDraft.profileBio.trimmingCharacters(in: .whitespacesAndNewlines).prefix(80))

        isProfileUpdating = true
        defer { isProfileUpdating = false }

        do {
            let auth = try await client.updateUserProfile(
                displayName: displayName,
                avatarSymbol: avatarSymbol,
                birthYear: birthYear,
                gender: gender,
                profileBio: profileBio
            )
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            if auth.session.provider == .apple {
                store.saveAppleDisplayName(auth.user.displayName)
            }
            persist()
            isProfileEditorPresented = false
            showToast("资料已保存。")
            let shouldBegin = beginExplorationAfterProfileCompletion
            beginExplorationAfterProfileCompletion = false
            if shouldBegin {
                await beginNativeExploration()
            }
        } catch {
            if isExpiredAuthError(error) {
                clearLocalAuthAfterLogout()
                showToast("登录状态已过期，请重新登录。")
                return
            }
            showToast(error.localizedDescription)
        }
    }

    func continueAsGuest() async {
        stage = .processing
        processingTitle = "正在建立私人月相档案"
        processingDetail = "正在建立临时档案；正式探索请使用 Apple、微信或手机号登录。"
        processingProgress = 0.18
        do {
            let auth = try await client.createAnonymousSession()
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            persist()
            await beginNativeExploration()
        } catch {
            stage = .error(error.localizedDescription)
        }
    }

    func continueWithApple(identityToken: String, authorizationCode: String?, displayName: String?) async {
        stage = .processing
        processingTitle = "正在接入 Apple 身份"
        processingDetail = "系统凭证会被写入同一个私人月相档案。"
        processingProgress = 0.2
        do {
            let resolvedDisplayName = normalizedAppleDisplayName(displayName)
            let auth = try await client.createAppleSession(
                identityToken: identityToken,
                authorizationCode: authorizationCode,
                displayName: resolvedDisplayName
            )
            store.saveAppleDisplayName(auth.user.displayName ?? resolvedDisplayName)
            await continueAfterAuthenticated(auth)
        } catch {
            stage = .home
            if case BenyuanAPIError.network = error {
                showToast("Apple 授权已完成，但暂时连接不上本源服务器。请稍后再试。")
            } else {
                showToast(error.localizedDescription)
            }
        }
    }

    private func normalizedAppleDisplayName(_ displayName: String?) -> String? {
        let currentName = displayName?.trimmingCharacters(in: .whitespacesAndNewlines)
        if let currentName, !currentName.isEmpty {
            return currentName
        }
        if let cached = store.loadAppleDisplayName() {
            return cached
        }
        let existing = session.user?.displayName?.trimmingCharacters(in: .whitespacesAndNewlines)
        if let existing, !existing.isEmpty, existing != "Apple 用户" {
            return existing
        }
        return nil
    }

    func continueWithWechat(code: String, displayName: String? = nil) async {
        let normalizedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
        guard isWechatAuthReady else {
            showToast("微信登录还在接入开放平台，请先用 Apple 登录。")
            return
        }
        guard !normalizedCode.isEmpty else {
            showToast("微信授权暂时没有返回。")
            return
        }

        stage = .processing
        processingTitle = "正在接入微信身份"
        processingDetail = "开放平台凭证会被写入同一个私人月相档案。"
        processingProgress = 0.2
        do {
            let auth = try await client.createWechatSession(code: normalizedCode, displayName: displayName)
            await continueAfterAuthenticated(auth)
        } catch {
            stage = .auth
            showToast(error.localizedDescription)
        }
    }

    func bindWechatToCurrentAccount(code: String) async {
        let normalizedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
        guard session.authSession != nil else {
            stage = .auth
            return
        }
        guard isWechatAuthReady else {
            showToast("微信登录还在接入开放平台，请先用 Apple 登录。")
            return
        }
        guard !normalizedCode.isEmpty else {
            showToast("微信授权暂时没有返回。")
            return
        }

        do {
            let auth = try await client.createWechatSession(code: normalizedCode, displayName: nil)
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            persist()
            activeBindingProvider = .wechat
            showToast("微信已绑定。")
        } catch {
            if isExpiredAuthError(error) {
                clearLocalAuthAfterLogout()
                showToast("登录状态已过期，请重新登录。")
                return
            }
            showToast(error.localizedDescription)
        }
    }

    func requestPhoneCode(phone: String) async {
        let normalized = phone.trimmingCharacters(in: .whitespacesAndNewlines)
        do {
            let response = try await client.requestPhoneCode(phone: normalized)
            showToast(response.fixtureCode.map { "测试验证码：\($0)" } ?? "验证码已发送。")
        } catch {
            showToast(error.localizedDescription)
        }
    }

    func continueWithPhone(phone: String, code: String) async {
        stage = .processing
        processingTitle = "正在绑定手机号"
        processingDetail = "把这个号码写入你的私人月相档案。"
        processingProgress = 0.2
        do {
            let auth = try await client.verifyPhoneCode(
                phone: phone.trimmingCharacters(in: .whitespacesAndNewlines),
                code: code.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            await continueAfterAuthenticated(auth)
        } catch {
            stage = .auth
            showToast(error.localizedDescription)
        }
    }

    func bindPhoneToCurrentAccount(phone: String, code: String) async {
        guard session.authSession != nil else {
            stage = .auth
            return
        }
        do {
            let auth = try await client.verifyPhoneCode(
                phone: phone.trimmingCharacters(in: .whitespacesAndNewlines),
                code: code.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            persist()
            activeBindingProvider = .phone
            showToast("手机号已绑定。")
        } catch {
            if isExpiredAuthError(error) {
                clearLocalAuthAfterLogout()
                showToast("登录状态已过期，请重新登录。")
                return
            }
            showToast(error.localizedDescription)
        }
    }

    func logout() async {
        do {
            _ = try await client.logout()
            showToast("已退出当前账户。")
        } catch {
            showToast(error.localizedDescription)
        }
        clearLocalAuthAfterLogout()
    }

    func clearLocalAuthAfterLogout() {
        session.authSession = nil
        session.user = nil
        session.activeGenerationJobId = nil
        activeGenerationJobId = nil
        accountHistory = []
        client.setAuthSession(nil)
        persist()
        stage = .home
    }

    private var allowedProfileAvatarSymbols: Set<String> {
        ["moon.stars.fill", "sparkles", "circle.hexagongrid.fill", "scope", "sun.max.fill", "circle.dashed.inset.filled"]
    }

    private var allowedProfileGenders: Set<String> {
        ["female", "male", "nonbinary", "undisclosed"]
    }

    private func normalizedProfileName(_ value: String?) -> String? {
        let cleaned = value?.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let cleaned, !cleaned.isEmpty else { return nil }
        let placeholders = ["Apple 用户", "微信用户", "手机用户", "访客", "我的本源档案"]
        return placeholders.contains(cleaned) ? nil : cleaned
    }

    private func continueAfterAuthenticated(_ auth: BenyuanAuthResponse) async {
        resetExplorationDraftKeepingIdentity(authSession: auth.session, user: auth.user)
        client.setAuthSession(auth.session)
        if auth.session.provider == .apple {
            store.saveAppleDisplayName(auth.user.displayName)
        }
        if requiresProfileCompletion(auth.user) {
            stageBeforeAccount = nil
            stage = .account
            presentProfileEditor(beginExplorationAfterSave: true)
            await refreshAccountHistory()
            showToast("补全名称和头像后开始探索。")
            return
        }
        await beginNativeExploration()
    }
}
