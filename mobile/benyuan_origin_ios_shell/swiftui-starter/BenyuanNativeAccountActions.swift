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
        case .some(.launching), .some(.auth), .some(.account), .none:
            stage = .collect
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
            persist()
        } catch {
            toast = error.localizedDescription
            clearLocalAuthAfterLogout()
        }
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
            toast = "问题已收到。"
            isFeedbackComposerPresented = true
        } catch {
            feedbackStatus = "提交失败：\(error.localizedDescription)"
        }
    }

    func refreshAuthProviders() async {
        do {
            authProviders = try await client.fetchAuthProviders()
        } catch {
            toast = "登录能力表暂时无法读取，仍可先以访客进入。"
        }
    }

    func continueAsGuest() async {
        stage = .processing
        processingTitle = "正在建立私人月相档案"
        processingDetail = "先以访客身份进入，之后可以绑定微信或手机号。"
        processingProgress = 0.18
        do {
            let auth = try await client.createAnonymousSession()
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            persist()
            await start()
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
            let auth = try await client.createAppleSession(
                identityToken: identityToken,
                authorizationCode: authorizationCode,
                displayName: displayName
            )
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            persist()
            await start()
        } catch {
            stage = .error(error.localizedDescription)
        }
    }

    func continueWithWechat(code: String, displayName: String? = nil) async {
        let normalizedCode = code.trimmingCharacters(in: .whitespacesAndNewlines)
        guard isWechatAuthReady else {
            toast = "微信登录还在接入开放平台，请先用 Apple 或访客进入。"
            return
        }
        guard !normalizedCode.isEmpty else {
            toast = "微信授权暂时没有返回。"
            return
        }

        stage = .processing
        processingTitle = "正在接入微信身份"
        processingDetail = "开放平台凭证会被写入同一个私人月相档案。"
        processingProgress = 0.2
        do {
            let auth = try await client.createWechatSession(code: normalizedCode, displayName: displayName)
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            persist()
            await start()
        } catch {
            stage = .auth
            toast = error.localizedDescription
        }
    }

    func requestPhoneCode(phone: String) async {
        let normalized = phone.trimmingCharacters(in: .whitespacesAndNewlines)
        do {
            let response = try await client.requestPhoneCode(phone: normalized)
            toast = response.fixtureCode.map { "测试验证码：\($0)" } ?? "验证码已发送。"
        } catch {
            toast = error.localizedDescription
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
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            persist()
            await start()
        } catch {
            stage = .auth
            toast = error.localizedDescription
        }
    }

    func logout() async {
        do {
            _ = try await client.logout()
            toast = "已退出当前账户。"
        } catch {
            toast = error.localizedDescription
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
        stage = .auth
    }
}
