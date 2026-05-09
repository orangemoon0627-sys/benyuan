import Foundation
import Photos
import SwiftUI

enum BenyuanNativeStage: Equatable {
    case launching
    case auth
    case account
    case collect
    case processing
    case theater
    case constellation
    case error(String)
}

enum BenyuanNativeTheaterPhase: Equatable {
    case act1
    case act2
    case act3
    case epilogue
}

enum BenyuanUploadApplyMode: Equatable {
    case append
    case replace
}

enum BenyuanHistoryRestoreError: LocalizedError, Equatable {
    case missingTheaterScript
    case missingConstellation

    var errorDescription: String? {
        switch self {
        case .missingTheaterScript:
            return "这次探索缺少剧场记录，暂时无法回看。"
        case .missingConstellation:
            return "这次探索缺少星图记录，暂时无法回看。"
        }
    }
}

enum BenyuanNativeFlowError: LocalizedError, Equatable {
    case incompletePart1
    case missingTheaterContext

    var errorDescription: String? {
        switch self {
        case .incompletePart1:
            return "还有问题没有完成。"
        case .missingTheaterContext:
            return "缺少剧场上下文。"
        }
    }
}

@MainActor
final class BenyuanNativeFlowModel: ObservableObject {
    @Published var stage: BenyuanNativeStage = .launching
    @Published var questions: [BenyuanQuestion] = []
    @Published var activeQuestionIndex = 0
    @Published var session: BenyuanNativeSession
    @Published var thumbnails: [String: UIImage] = [:]
    @Published var uploadingQuestionId: String?
    @Published var processingTitle = "正在唤醒本源"
    @Published var processingDetail = "先让问题、影像和剧场彼此对齐。"
    @Published var processingProgress = 0.12
    @Published var theater: TheaterGenerateResponse?
    @Published var theaterPhase: BenyuanNativeTheaterPhase = .act1
    @Published var theaterChoiceIndex = 0
    @Published var theaterMirrorIndex = 0
    @Published var selectedTheaterOptionId: String?
    @Published var constellation: ConstellationGenerateResponse?
    @Published var prefersConstellationEndPreview = false
    @Published var shareItems: [Any] = []
    @Published var isShareSheetPresented = false
    @Published var toast: String?
    @Published var authProviders: BenyuanAuthProvidersResponse?
    @Published var accountHistory: [BenyuanAccountHistoryItem] = []
    @Published var isAccountHistoryLoading = false
    @Published var restoringHistoryPart1Id: String?
    @Published var pendingDeleteHistoryItem: BenyuanAccountHistoryItem?
    @Published var isDeleteHistoryConfirmationPresented = false
    @Published var activeBindingProvider: BenyuanAuthProvider?

    private let client: BenyuanAPIClient
    private let store: BenyuanFlowStore
    private var phaseStartedAt = Date()
    private var interactionStartedAt = Date()
    private var choiceLogs: [Part2ChoiceRecord] = []
    private var mirrorLogs: [Part2MirrorRecord] = []
    private var flowStartedAt = Date()

    init(client: BenyuanAPIClient = BenyuanAPIClient(), store: BenyuanFlowStore = BenyuanFlowStore()) {
        self.client = client
        self.store = store
        self.session = store.load()
        self.client.setAuthSession(self.session.authSession)
    }

    var currentQuestion: BenyuanQuestion? {
        guard questions.indices.contains(activeQuestionIndex) else { return nil }
        return questions[activeQuestionIndex]
    }

    var answeredCount: Int {
        questions.filter { isAnswered($0) }.count
    }

    var progress: Double {
        guard !questions.isEmpty else { return 0 }
        return Double(answeredCount) / Double(questions.count)
    }

    var allQuestionsAnswered: Bool {
        !questions.isEmpty && questions.allSatisfy { isAnswered($0) }
    }

    var currentTheaterChoice: TheaterChoice? {
        theater?.theaterScript.act2.choices[safe: theaterChoiceIndex]
    }

    var currentMirrorQuestion: TheaterMirrorQuestion? {
        theater?.theaterScript.act3.mirrorQuestions[safe: theaterMirrorIndex]
    }

    var isPhoneAuthReady: Bool {
        authProviders?.provider(.phone)?.status == .ready
    }

    var isWechatAuthReady: Bool {
        authProviders?.provider(.wechat)?.status == .ready
    }

    func start() async {
        if let previewStage = BenyuanShellConfig.nativePreviewStage {
            applyNativePreview(previewStage)
            return
        }

        if BenyuanShellConfig.nativeE2EAutorun {
            await runNativeE2EAutorun()
            return
        }

        if session.authSession == nil {
            await refreshAuthProviders()
            stage = .auth
            return
        }
        client.setAuthSession(session.authSession)
        do {
            processingTitle = "正在打开原生本源"
            processingDetail = "读取当前问题结构。"
            let schema = try await client.fetchSchema()
            questions = schema.questions
            activeQuestionIndex = firstIncompleteQuestionIndex()
            stage = .collect
        } catch {
            stage = .error(error.localizedDescription)
        }
    }

    func runNativeE2EAutorun() async {
        store.resetE2EEvents()
        logNativeE2E("autorun_start")
        restart()
        stage = .processing
        processingTitle = "正在执行原生链路验收"
        processingDetail = "连接 staging，自动完成收集、剧场与星图。"
        processingProgress = 0.08

        do {
            let auth = try await client.createAnonymousSession()
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            persist()
            logNativeE2E("auth_created user_id=\(auth.user.userId)")

            processingTitle = "正在读取真实题库"
            processingDetail = "原生 App 正在拉取 staging 的 Part1 schema。"
            processingProgress = 0.16
            let schema = try await client.fetchSchema()
            questions = schema.questions
            logNativeE2E("schema_fetched questions=\(schema.questions.count)")

            processingTitle = "正在上传验收图片"
            processingDetail = "使用 App 内置 fixture，模拟真实图片选择。"
            processingProgress = 0.24
            let fixtureAssets = try await uploadNativeE2EFixtures(for: schema.questions)
            logNativeE2E("fixtures_uploaded assets=\(fixtureAssets.count)")

            processingTitle = "正在填充原生答案"
            processingDetail = "覆盖单选、多选、分配和图片题。"
            processingProgress = 0.32
            applyNativeE2EAutorunSeed(questions: schema.questions, fixtureAssets: fixtureAssets)
            logNativeE2E("answers_seeded answered=\(answeredCount)")

            try await submitPart1AndGenerateTheaterPipeline()
            try Task.checkCancellation()
            await autoCompleteTheaterForE2E()
            try Task.checkCancellation()
            try await finishTheaterAndGenerateConstellationPipeline()
            logNativeE2E("autorun_finished")
        } catch {
            logNativeE2EError(stage: "autorun", error: error)
            stage = .error(error.localizedDescription)
        }
    }

    func applyNativeE2EAutorunSeed(questions: [BenyuanQuestion], fixtureAssets: [BenyuanUploadedAssetRef]) {
        self.questions = questions
        thumbnails = [:]
        session.answers = [:]
        session.uploadedAssets = [:]

        for question in questions {
            switch question.kind {
            case .single:
                if let option = question.options?.first {
                    session.answers[question.id] = .string(option.id)
                }
            case .multi:
                let minimum = max(question.minSelections ?? 1, 1)
                let maximum = max(question.maxSelections ?? minimum, minimum)
                let selected = Array((question.options ?? []).prefix(min(maximum, minimum)))
                session.answers[question.id] = .array(selected.map { .string($0.id) })
            case .distribution:
                session.answers[question.id] = .object([
                    "past": .number(34),
                    "present": .number(33),
                    "future": .number(33)
                ])
            case .upload:
                let assets = fixtureAssets.filter { $0.questionId == question.id }
                let selected = Array(assets.prefix(question.uploadRange?.max ?? max(assets.count, 1)))
                if !selected.isEmpty {
                    session.uploadedAssets[question.id] = selected
                    session.answers[question.id] = .array((try? selected.map { try $0.benyuanJSONValue() }) ?? [])
                }
            }
        }

        activeQuestionIndex = firstIncompleteQuestionIndex()
        persist()
    }

    func applyNativePreview(_ previewStage: BenyuanNativePreviewStage) {
        prefersConstellationEndPreview = false
        switch previewStage {
        case .auth:
            authProviders = Self.previewAuthProviders
            session.authSession = nil
            session.user = nil
            stage = .auth
        case .account:
            authProviders = Self.previewAuthProviders
            session.authSession = Self.previewAuthSession
            session.user = Self.previewUser
            session.part1Id = "part1_native_preview"
            session.theaterScriptId = "theater_native_preview"
            session.part2Id = "part2_native_preview"
            session.constellationId = "const_native_preview"
            client.setAuthSession(session.authSession)
            accountHistory = Self.previewAccountHistory
            stage = .account
        case .collect:
            authProviders = Self.previewAuthProviders
            session.authSession = Self.previewAuthSession
            session.user = Self.previewUser
            client.setAuthSession(session.authSession)
            questions = Self.previewQuestions
            session.answers["A1_core_image"] = .string("A1_2")
            session.answers["B4_time_philosophy"] = .object([
                "past": .number(42),
                "present": .number(34),
                "future": .number(12)
            ])
            session.uploadedAssets = [:]
            session.answers["C2_precious_photo_analysis"] = .array([])
            activeQuestionIndex = 1
            stage = .collect
        case .upload:
            authProviders = Self.previewAuthProviders
            session.authSession = Self.previewAuthSession
            session.user = Self.previewUser
            client.setAuthSession(session.authSession)
            questions = Self.previewQuestions
            session.answers["A1_core_image"] = .string("A1_2")
            session.answers["B4_time_philosophy"] = .object([
                "past": .number(42),
                "present": .number(34),
                "future": .number(12)
            ])
            let uploaded = Self.previewUploadedAssets
            session.uploadedAssets = ["C2_precious_photo_analysis": uploaded]
            session.answers["C2_precious_photo_analysis"] = .array((try? uploaded.map { try $0.benyuanJSONValue() }) ?? [])
            thumbnails = Self.previewThumbnails
            activeQuestionIndex = 2
            stage = .collect
        case .processing:
            processingTitle = "精神星体正在显影"
            processingDetail = "深月场正在把问题、影像和选择压成一枚缓慢旋转的星核。"
            processingProgress = 0.72
            stage = .processing
        case .theater:
            authProviders = Self.previewAuthProviders
            session.authSession = Self.previewAuthSession
            session.user = Self.previewUser
            session.part1Id = "part1_native_preview"
            session.theaterScriptId = "theater_native_preview"
            client.setAuthSession(session.authSession)
            theater = Self.previewTheater
            constellation = nil
            resetTheaterState()
            stage = .theater
        case .constellation, .constellationEnd:
            authProviders = Self.previewAuthProviders
            session.authSession = Self.previewAuthSession
            session.user = Self.previewUser
            client.setAuthSession(session.authSession)
            constellation = Self.previewConstellation
            processingProgress = 0.88
            prefersConstellationEndPreview = previewStage == .constellationEnd
            stage = .constellation
        }
    }

    func showAccount() {
        stage = .account
        Task {
            await refreshAccount()
            await refreshAccountHistory()
        }
    }

    func returnToFlow() {
        stage = session.authSession == nil ? .auth : .collect
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

    func refreshAccountHistory() async {
        guard session.authSession != nil else {
            accountHistory = []
            return
        }

        isAccountHistoryLoading = true
        defer { isAccountHistoryLoading = false }
        do {
            let response = try await client.fetchAccountHistory()
            accountHistory = response.items
        } catch {
            toast = error.localizedDescription
        }
    }

    func openHistoryItem(_ item: BenyuanAccountHistoryItem) {
        restoringHistoryPart1Id = item.part1Id
        session.part1Id = item.part1Id
        session.theaterScriptId = item.theaterScriptId
        session.part2Id = item.part2Id
        session.constellationId = item.constellationId
        persist()

        processingTitle = "正在打开这次探索"
        processingDetail = "把历史里的剧场和星图重新接回原生界面。"
        processingProgress = 0.42
        stage = .processing

        Task {
            await loadHistoryItem(item)
        }
    }

    func loadHistoryItem(_ item: BenyuanAccountHistoryItem) async {
        do {
            switch item.stage {
            case .part1:
                if questions.isEmpty {
                    let schema = try await client.fetchSchema()
                    questions = schema.questions
                }
                activeQuestionIndex = firstIncompleteQuestionIndex()
                stage = .collect
            case .theater, .part2:
                guard let theaterScriptId = item.theaterScriptId else {
                    throw BenyuanHistoryRestoreError.missingTheaterScript
                }
                let record = try await client.fetchTheaterScript(theaterScriptId: theaterScriptId)
                theater = record.generateResponse()
                constellation = nil
                resetTheaterState()
                stage = .theater
            case .constellation:
                if let theaterScriptId = item.theaterScriptId, theater?.theaterScriptId != theaterScriptId {
                    let record = try await client.fetchTheaterScript(theaterScriptId: theaterScriptId)
                    theater = record.generateResponse()
                }
                guard let constellationId = item.constellationId else {
                    throw BenyuanHistoryRestoreError.missingConstellation
                }
                processingProgress = 0.78
                let record = try await client.fetchConstellationRecord(constellationId: constellationId)
                constellation = record.generateResponse(constellationId: constellationId)
                stage = .constellation
            }
            restoringHistoryPart1Id = nil
        } catch {
            restoringHistoryPart1Id = nil
            stage = .account
            toast = error.localizedDescription
        }
    }

    func requestDeleteHistoryItem(_ item: BenyuanAccountHistoryItem) {
        pendingDeleteHistoryItem = item
        isDeleteHistoryConfirmationPresented = true
    }

    func cancelDeleteHistoryItem() {
        pendingDeleteHistoryItem = nil
        isDeleteHistoryConfirmationPresented = false
    }

    func confirmDeleteHistoryItem() async {
        guard let item = pendingDeleteHistoryItem else { return }
        cancelDeleteHistoryItem()
        await deleteHistoryItem(item)
    }

    func deleteHistoryItem(_ item: BenyuanAccountHistoryItem) async {
        do {
            _ = try await client.deleteAccountHistoryItem(part1Id: item.part1Id)
            accountHistory.removeAll { $0.part1Id == item.part1Id }
            if session.part1Id == item.part1Id {
                session.part1Id = nil
                session.theaterScriptId = nil
                session.part2Id = nil
                session.constellationId = nil
                persist()
            }
            toast = "这次探索已删除。"
        } catch {
            toast = error.localizedDescription
        }
    }

    func showBindingInfo(_ provider: BenyuanAuthProvider) {
        activeBindingProvider = provider
    }

    func dismissBindingInfo() {
        activeBindingProvider = nil
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
        accountHistory = []
        client.setAuthSession(nil)
        persist()
        stage = .auth
    }

    func setSingleAnswer(_ optionId: String) {
        guard let question = currentQuestion else { return }
        session.answers[question.id] = .string(optionId)
        persist()
        advanceAfterAnswer()
    }

    func toggleMultiAnswer(_ optionId: String) {
        guard let question = currentQuestion else { return }
        let current = session.answers[question.id]?.arrayValue?.compactMap(\.stringValue) ?? []
        let next = current.contains(optionId) ? current.filter { $0 != optionId } : current + [optionId]
        session.answers[question.id] = .array(next.map { .string($0) })
        persist()
    }

    func setDistribution(key: String, value: Double) {
        guard let question = currentQuestion else { return }
        let currentObject = session.answers[question.id]?.objectValue ?? ["past": .number(34), "present": .number(33), "future": .number(33)]
        let keys = ["past", "present", "future"]
        let otherKeys = keys.filter { $0 != key }
        let remaining = max(0, 100 - Int(value.rounded()))
        let firstCurrent = currentObject[otherKeys[0]]?.intValue ?? 33
        let secondCurrent = currentObject[otherKeys[1]]?.intValue ?? 33
        let total = max(1, firstCurrent + secondCurrent)
        let first = Int((Double(firstCurrent) / Double(total) * Double(remaining)).rounded())
        let second = remaining - first
        session.answers[question.id] = .object([
            key: .number(Double(Int(value.rounded()))),
            otherKeys[0]: .number(Double(first)),
            otherKeys[1]: .number(Double(second))
        ])
        persist()
    }

    func uploadImages(_ images: [UIImage], for question: BenyuanQuestion, origin: String, mode: BenyuanUploadApplyMode = .append) async {
        guard !images.isEmpty else { return }
        uploadingQuestionId = question.id
        toast = "正在上传图片线索。"

        do {
            let maxCount = question.uploadRange?.max ?? max(1, images.count)
            let existingCount = mode == .replace ? 0 : uploadedAssets(for: question.id).count
            let slots = max(0, maxCount - existingCount)
            let selectedImages = Array(images.prefix(slots))
            guard !selectedImages.isEmpty else {
                toast = "这组图片已经达到上限。"
                uploadingQuestionId = nil
                return
            }
            let payloads = try selectedImages.enumerated().map { index, image in
                try BenyuanImagePayload.makeJPEGPayload(from: image, name: "native-\(question.id)-\(index + 1).jpg")
            }
            let response = try await client.upload(questionId: question.id, images: payloads, origin: origin)
            for (asset, image) in zip(response.assets, selectedImages) {
                thumbnails[asset.assetId] = image
            }
            let nextAssets = applyUploadedAssets(response.assets, to: question.id, mode: mode, maxCount: maxCount)
            persist()
            toast = "图片线索已归位。"
            if nextAssets.count >= maxCount {
                advanceAfterAnswer(delay: 0.25)
            }
        } catch {
            toast = error.localizedDescription
        }

        uploadingQuestionId = nil
    }

    @discardableResult
    func applyUploadedAssets(
        _ incomingAssets: [BenyuanUploadedAssetRef],
        to questionId: String,
        mode: BenyuanUploadApplyMode,
        maxCount: Int
    ) -> [BenyuanUploadedAssetRef] {
        guard !incomingAssets.isEmpty else {
            return uploadedAssets(for: questionId)
        }

        let previous = uploadedAssets(for: questionId)
        let source = mode == .replace ? incomingAssets : previous + incomingAssets
        var seen = Set<String>()
        let next = source.filter { asset in
            guard !seen.contains(asset.assetId) else { return false }
            seen.insert(asset.assetId)
            return true
        }.prefix(max(0, maxCount))

        let nextAssets = Array(next)
        if mode == .replace {
            let retained = Set(nextAssets.map(\.assetId))
            for asset in previous where !retained.contains(asset.assetId) {
                thumbnails[asset.assetId] = nil
            }
        }
        session.uploadedAssets[questionId] = nextAssets
        session.answers[questionId] = .array((try? nextAssets.map { try $0.benyuanJSONValue() }) ?? [])
        persist()
        return nextAssets
    }

    func removeUploadAsset(questionId: String, assetId: String) {
        let next = uploadedAssets(for: questionId).filter { $0.assetId != assetId }
        session.uploadedAssets[questionId] = next
        thumbnails[assetId] = nil
        session.answers[questionId] = .array((try? next.map { try $0.benyuanJSONValue() }) ?? [])
        persist()
        toast = "已移除这条线索。"
    }

    func clearUploadAssets(questionId: String) {
        for asset in uploadedAssets(for: questionId) {
            thumbnails[asset.assetId] = nil
        }
        session.uploadedAssets[questionId] = []
        session.answers[questionId] = .array([])
        persist()
        toast = "已清空这组图片线索。"
    }

    func previousQuestion() {
        activeQuestionIndex = max(0, activeQuestionIndex - 1)
    }

    func nextQuestion() {
        activeQuestionIndex = min(max(questions.count - 1, 0), activeQuestionIndex + 1)
    }

    func submitPart1AndGenerateTheater() async {
        do {
            try await submitPart1AndGenerateTheaterPipeline()
        } catch BenyuanNativeFlowError.incompletePart1 {
            return
        } catch {
            stage = .error(error.localizedDescription)
        }
    }

    private func submitPart1AndGenerateTheaterPipeline() async throws {
        guard allQuestionsAnswered else {
            activeQuestionIndex = firstIncompleteQuestionIndex()
            toast = "还有问题没有完成。"
            throw BenyuanNativeFlowError.incompletePart1
        }

        stage = .processing
        processingTitle = "第一层月面正在合拢"
        processingDetail = "整理 A / B / C 三组线索。"
        processingProgress = 0.22
        let part1 = try await client.submitPart1(answers: session.answers)
        session.part1Id = part1.part1Id
        persist()
        logNativeE2E("part1_submitted part1_id=\(part1.part1Id)")

        processingTitle = "正在读取影像背面的情绪"
        processingDetail = "音乐、社交动态与珍贵照片进入多模态分析。"
        processingProgress = 0.48
        _ = try await client.runMultimodal(part1Id: part1.part1Id)
        logNativeE2E("multimodal_finished part1_id=\(part1.part1Id)")

        processingTitle = "剧场开始生成"
        processingDetail = "把你的答案改写成一段连续的角色代入。"
        processingProgress = 0.74
        let nextTheater = try await client.generateTheater(part1Id: part1.part1Id)
        theater = nextTheater
        session.theaterScriptId = nextTheater.theaterScriptId
        persist()
        logNativeE2E("theater_saved theater_script_id=\(nextTheater.theaterScriptId)")
        resetTheaterState()
        stage = .theater
    }

    func enterAct2() {
        markPhaseDuration("act1")
        theaterPhase = .act2
        resetInteractionTimer()
    }

    func chooseAct2(_ option: TheaterChoiceOption) {
        guard let choice = currentTheaterChoice else { return }
        selectedTheaterOptionId = option.id
        let hesitation = Date().timeIntervalSince(interactionStartedAt)
        choiceLogs.append(Part2ChoiceRecord(
            choiceId: choice.choiceId,
            selected: option.id,
            hesitationTime: rounded(hesitation),
            hoverSequence: [],
            timestamp: Date().benyuanISOString
        ))

        Task {
            try? await Task.sleep(nanoseconds: 520_000_000)
            await MainActor.run {
                selectedTheaterOptionId = nil
                if let theater, theaterChoiceIndex < theater.theaterScript.act2.choices.count - 1 {
                    theaterChoiceIndex += 1
                    resetInteractionTimer()
                } else {
                    markPhaseDuration("act2")
                    theaterPhase = .act3
                    resetInteractionTimer()
                }
            }
        }
    }

    func chooseAct3(_ option: TheaterMirrorQuestionOption) {
        guard let question = currentMirrorQuestion else { return }
        let hesitation = Date().timeIntervalSince(interactionStartedAt)
        mirrorLogs.append(Part2MirrorRecord(
            questionId: question.questionId,
            selected: option.id,
            hesitationTime: rounded(hesitation),
            timestamp: Date().benyuanISOString
        ))

        if let theater, theaterMirrorIndex < theater.theaterScript.act3.mirrorQuestions.count - 1 {
            theaterMirrorIndex += 1
            resetInteractionTimer()
        } else {
            markPhaseDuration("act3")
            theaterPhase = .epilogue
            resetInteractionTimer()
        }
    }

    func finishTheaterAndGenerateConstellation() async {
        do {
            try await finishTheaterAndGenerateConstellationPipeline()
        } catch {
            stage = .error(error.localizedDescription)
        }
    }

    private func finishTheaterAndGenerateConstellationPipeline() async throws {
        guard let part1Id = session.part1Id, let theaterScriptId = session.theaterScriptId else {
            throw BenyuanNativeFlowError.missingTheaterContext
        }

        stage = .processing
        markPhaseDuration("epilogue")
        processingTitle = "最后一镜正在封存"
        processingDetail = "把选择、停顿和回望写入第二层记录。"
        processingProgress = 0.68
        let metadata: [String: BenyuanJSONValue] = [
            "device": .string("ios-native"),
            "total_time": .number(rounded(Date().timeIntervalSince(flowStartedAt))),
            "phase_durations": .object(session.phaseDurations.mapValues { .number($0) })
        ]
        let part2 = try await client.submitPart2(
            part1Id: part1Id,
            theaterScriptId: theaterScriptId,
            choices: choiceLogs,
            mirrors: mirrorLogs,
            metadata: metadata
        )
        session.part2Id = part2.part2Id
        persist()
        logNativeE2E("part2_submitted part2_id=\(part2.part2Id) choices=\(choiceLogs.count) mirrors=\(mirrorLogs.count)")

        processingTitle = "精神星图正在显影"
        processingDetail = "让哲学、精神分析和文艺共鸣汇成一张图。"
        processingProgress = 0.88
        let nextConstellation = try await client.generateConstellation(part1Id: part1Id, part2Id: part2.part2Id)
        constellation = nextConstellation
        session.constellationId = nextConstellation.constellationId
        persist()
        logNativeE2E("constellation_generated constellation_id=\(nextConstellation.constellationId)")
        stage = .constellation
    }

    private func uploadNativeE2EFixtures(for questions: [BenyuanQuestion]) async throws -> [BenyuanUploadedAssetRef] {
        guard let image = Self.nativeE2EFixtureImage() else {
            throw BenyuanAPIError.invalidImage
        }

        var uploaded: [BenyuanUploadedAssetRef] = []
        let uploadQuestions = questions.filter { $0.kind == .upload }
        for question in uploadQuestions {
            let payload = try BenyuanImagePayload.makeJPEGPayload(from: image, name: "ios-e2e-\(question.id).jpg")
            let response = try await client.upload(questionId: question.id, images: [payload], origin: "ios-native-e2e")
            uploaded.append(contentsOf: response.assets)
            if let first = response.assets.first {
                thumbnails[first.assetId] = image
            }
        }
        return uploaded
    }

    private func autoCompleteTheaterForE2E() async {
        logNativeE2E("theater_autocomplete_start")
        enterAct2()

        while theaterPhase == .act2 {
            guard let option = currentTheaterChoice?.options.first else { break }
            chooseAct2(option)
            try? await Task.sleep(nanoseconds: 640_000_000)
        }

        while theaterPhase == .act3 {
            guard let option = currentMirrorQuestion?.options.first else { break }
            chooseAct3(option)
            try? await Task.sleep(nanoseconds: 180_000_000)
        }
        logNativeE2E("theater_autocomplete_finished choices=\(choiceLogs.count) mirrors=\(mirrorLogs.count) phase=\(theaterPhase)")
    }

    func shareConstellation() {
        guard let constellation else { return }
        let data = constellation.psycheConstellation
        let text = [
            "本源｜\(data.archetype.name)",
            data.archetype.coreEssence,
            "核心张力：\(data.coreTensions.first?.name ?? "未命名张力")",
            "行动入口：\(data.growthSuggestions.first?.actionableSteps.first ?? data.growthSuggestions.first?.title ?? "慢慢靠近自己")"
        ].joined(separator: "\n\n")
        shareItems = [text]
        isShareSheetPresented = true
    }

    func saveConstellationImage() {
        guard let constellation else { return }
        let image = BenyuanConstellationImageRenderer.render(constellation: constellation.psycheConstellation)
        PHPhotoLibrary.shared().performChanges {
            PHAssetChangeRequest.creationRequestForAsset(from: image)
        } completionHandler: { [weak self] success, error in
            Task { @MainActor in
                self?.toast = success ? "星图摘要已保存到相册。" : (error?.localizedDescription ?? "保存失败。")
            }
        }
    }

    func restart() {
        let authSession = session.authSession
        let user = session.user
        session = .empty
        session.authSession = authSession
        session.user = user
        client.setAuthSession(authSession)
        thumbnails = [:]
        theater = nil
        constellation = nil
        prefersConstellationEndPreview = false
        activeQuestionIndex = 0
        resetTheaterState()
        flowStartedAt = Date()
        persist()
        stage = authSession == nil ? .auth : .collect
    }

    func uploadedAssets(for questionId: String) -> [BenyuanUploadedAssetRef] {
        session.uploadedAssets[questionId] ?? []
    }

    func isAnswered(_ question: BenyuanQuestion) -> Bool {
        switch question.kind {
        case .single:
            return session.answers[question.id]?.stringValue?.isEmpty == false
        case .multi:
            let selected = session.answers[question.id]?.arrayValue ?? []
            return selected.count >= (question.minSelections ?? 1)
        case .distribution:
            let object = session.answers[question.id]?.objectValue ?? [:]
            let total = ["past", "present", "future"].reduce(0) { $0 + (object[$1]?.intValue ?? 0) }
            return total == 100
        case .upload:
            let count = uploadedAssets(for: question.id).count
            let range = question.uploadRange
            return count >= (range?.min ?? 1) && count <= (range?.max ?? max(count, 1))
        }
    }

    private func firstIncompleteQuestionIndex() -> Int {
        questions.firstIndex { !isAnswered($0) } ?? 0
    }

    private func advanceAfterAnswer(delay: TimeInterval = 0.18) {
        Task {
            let nanoseconds = UInt64(delay * 1_000_000_000)
            try? await Task.sleep(nanoseconds: nanoseconds)
            await MainActor.run {
                if activeQuestionIndex < questions.count - 1 {
                    activeQuestionIndex += 1
                }
            }
        }
    }

    private func resetTheaterState() {
        theaterPhase = .act1
        theaterChoiceIndex = 0
        theaterMirrorIndex = 0
        selectedTheaterOptionId = nil
        choiceLogs = []
        mirrorLogs = []
        phaseStartedAt = Date()
        interactionStartedAt = Date()
    }

    private func markPhaseDuration(_ phase: String) {
        session.phaseDurations[phase] = rounded(Date().timeIntervalSince(phaseStartedAt))
        phaseStartedAt = Date()
        persist()
    }

    private func resetInteractionTimer() {
        interactionStartedAt = Date()
    }

    private func rounded(_ value: TimeInterval) -> Double {
        Double((value * 10).rounded() / 10)
    }

    private func persist() {
        store.save(session)
    }

    private func logNativeE2E(_ message: String) {
#if DEBUG
        if BenyuanShellConfig.nativeE2EAutorun {
            store.appendE2EEvent(message)
            print("BENYUAN_E2E \(message)")
        }
#endif
    }

    private func logNativeE2EError(stage: String, error: Error) {
#if DEBUG
        if BenyuanShellConfig.nativeE2EAutorun {
            let message = "stage=\(stage) message=\(error.localizedDescription)"
            store.appendE2EEvent("ERROR \(message)")
            print("BENYUAN_E2E_ERROR \(message)")
        }
#endif
    }

    private static func nativeE2EFixtureImage() -> UIImage? {
        if let names = Optional(BenyuanShellConfig.nativePickFixtureNames), !names.isEmpty {
            for name in names {
                if let image = fixtureImage(named: name) {
                    return image
                }
            }
        }
        return fixtureImage(named: "native-smoke-fixture.png")
    }

    private static func fixtureImage(named name: String) -> UIImage? {
        let resourceName = (name as NSString).deletingPathExtension
        let resourceExtension = (name as NSString).pathExtension
        if let url = Bundle.main.url(forResource: resourceName, withExtension: resourceExtension.isEmpty ? nil : resourceExtension),
           let data = try? Data(contentsOf: url) {
            return UIImage(data: data)
        }
        return UIImage(named: name)
    }
}

private extension BenyuanNativeFlowModel {
    static var previewAuthProviders: BenyuanAuthProvidersResponse {
        BenyuanAuthProvidersResponse(
            providers: [
                BenyuanAuthProviderCapability(provider: .anonymous, enabled: true, status: .ready, actions: ["login"]),
                BenyuanAuthProviderCapability(provider: .apple, enabled: true, status: .ready, actions: ["login"]),
                BenyuanAuthProviderCapability(provider: .wechat, enabled: false, status: .reserved, actions: ["login", "bind_wechat"]),
                BenyuanAuthProviderCapability(provider: .phone, enabled: false, status: .reserved, actions: ["login", "bind_phone"])
            ],
            capabilities: ["guest_login", "apple_login", "wechat_login", "bind_phone"]
        )
    }

    static var previewAuthSession: BenyuanAuthSession {
        BenyuanAuthSession(
            sessionId: "auth_native_preview",
            userId: "usr_native_preview",
            token: "bya_native_preview",
            provider: .anonymous,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z"
        )
    }

    static var previewUser: BenyuanUser {
        BenyuanUser(
            userId: "usr_native_preview",
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z",
            displayName: "本源预览用户",
            primaryProvider: .anonymous,
            providers: [
                "anonymous": "anonymous:native-preview",
                "apple": "apple:native-preview"
            ],
            phoneBound: false,
            wechatBound: false
        )
    }

    static var previewAccountHistory: [BenyuanAccountHistoryItem] {
        [
            BenyuanAccountHistoryItem(
                part1Id: "part1_native_preview",
                theaterScriptId: "theater_native_preview",
                part2Id: "part2_native_preview",
                constellationId: "const_native_preview",
                stage: .constellation,
                title: "深月观测者的星图",
                subtitle: "剧场已完成 / 星图可回看",
                archetypeName: "深月观测者",
                createdAt: "2026-05-08T20:12:00.000Z",
                updatedAt: "2026-05-08T20:18:00.000Z",
                assetCount: 3
            ),
            BenyuanAccountHistoryItem(
                part1Id: "part1_theater_preview",
                theaterScriptId: "theater_midnight_preview",
                part2Id: nil,
                constellationId: nil,
                stage: .theater,
                title: "午夜走廊里的第二幕",
                subtitle: "剧场进行中 / 等待选择",
                archetypeName: nil,
                createdAt: "2026-05-08T18:32:00.000Z",
                updatedAt: "2026-05-08T18:39:00.000Z",
                assetCount: 2
            ),
            BenyuanAccountHistoryItem(
                part1Id: "part1_draft_preview",
                theaterScriptId: nil,
                part2Id: nil,
                constellationId: nil,
                stage: .part1,
                title: "未完成的月相草稿",
                subtitle: "Part 1 收集中 / 还差图片线索",
                archetypeName: nil,
                createdAt: "2026-05-08T16:02:00.000Z",
                updatedAt: "2026-05-08T16:07:00.000Z",
                assetCount: 1
            )
        ]
    }

    static var previewUploadedAsset: BenyuanUploadedAssetRef {
        BenyuanUploadedAssetRef(
            assetId: "asset_native_preview_moon",
            questionId: "C2_precious_photo_analysis",
            name: "moon-memory.jpg",
            size: 224_000,
            mimeType: "image/jpeg",
            uploadedAt: "2026-05-08T00:00:00.000Z",
            uploadOrigin: "native-preview"
        )
    }

    static var previewUploadedAssets: [BenyuanUploadedAssetRef] {
        [
            previewUploadedAsset,
            BenyuanUploadedAssetRef(
                assetId: "asset_native_preview_room",
                questionId: "C2_precious_photo_analysis",
                name: "quiet-room.jpg",
                size: 186_000,
                mimeType: "image/jpeg",
                uploadedAt: "2026-05-08T00:01:00.000Z",
                uploadOrigin: "native-preview"
            )
        ]
    }

    static var previewThumbnails: [String: UIImage] {
        var next: [String: UIImage] = [:]
        for (index, asset) in previewUploadedAssets.enumerated() {
            next[asset.assetId] = previewThumbnail(index: index)
        }
        return next
    }

    private static func previewThumbnail(index: Int) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 320, height: 360))
        return renderer.image { context in
            let rect = CGRect(x: 0, y: 0, width: 320, height: 360)
            UIColor(red: 0.02, green: 0.02, blue: 0.05, alpha: 1).setFill()
            context.fill(rect)

            let center = CGPoint(x: index.isMultiple(of: 2) ? 188 : 132, y: index.isMultiple(of: 2) ? 150 : 188)
            let glow = CGGradient(
                colorsSpace: CGColorSpaceCreateDeviceRGB(),
                colors: [
                    UIColor(red: 0.72, green: 0.66, blue: 0.48, alpha: 0.34).cgColor,
                    UIColor(red: 0.18, green: 0.14, blue: 0.25, alpha: 0.20).cgColor,
                    UIColor.clear.cgColor
                ] as CFArray,
                locations: [0, 0.44, 1]
            )
            if let glow {
                context.cgContext.drawRadialGradient(glow, startCenter: center, startRadius: 8, endCenter: center, endRadius: 190, options: [])
            }

            UIColor(red: 0.78, green: 0.75, blue: 0.88, alpha: 0.42).setStroke()
            let orbit = UIBezierPath(ovalIn: CGRect(x: 42, y: 92, width: 236, height: 78))
            context.cgContext.saveGState()
            context.cgContext.translateBy(x: 160, y: 180)
            context.cgContext.rotate(by: index.isMultiple(of: 2) ? -0.34 : 0.42)
            context.cgContext.translateBy(x: -160, y: -180)
            orbit.lineWidth = 3
            orbit.stroke()
            context.cgContext.restoreGState()

            UIColor(red: 0.96, green: 0.97, blue: 1.0, alpha: 0.82).setFill()
            UIBezierPath(ovalIn: CGRect(x: center.x - 34, y: center.y - 34, width: 68, height: 68)).fill()

            UIColor(red: 0.72, green: 0.66, blue: 0.48, alpha: 0.95).setFill()
            UIBezierPath(ovalIn: CGRect(x: 72 + CGFloat(index * 128), y: 238, width: 18, height: 18)).fill()
        }
    }

    static var previewQuestions: [BenyuanQuestion] {
        [
            BenyuanQuestion(
                id: "A1_core_image",
                module: .a,
                title: "第一眼靠近的图像",
                prompt: "如果今晚只能带走一种画面，你会选择哪一种深处的光？",
                kind: .single,
                minSelections: nil,
                maxSelections: nil,
                options: [
                    BenyuanQuestionOption(id: "A1_1", text: "悬在黑潮上的月面，安静但有引力。", psychologicalSignal: "lunar_depth", tags: ["moon", "depth"]),
                    BenyuanQuestionOption(id: "A1_2", text: "一条低光走廊，尽头像有未说出口的答案。", psychologicalSignal: "liminal_corridor", tags: ["threshold", "desire"]),
                    BenyuanQuestionOption(id: "A1_3", text: "雾里慢慢亮起的城市，像记忆正在回到身体。", psychologicalSignal: "memory_city", tags: ["memory", "urban"])
                ],
                outputKey: "core_image",
                helperText: "这个选择会决定你的第一层视觉母题。",
                distributionKeys: nil,
                analysisDimensions: nil,
                acceptedFiles: nil,
                uploadRange: nil
            ),
            BenyuanQuestion(
                id: "B4_time_philosophy",
                module: .b,
                title: "时间分配",
                prompt: "把你的精神注意力分给过去、现在和未来。",
                kind: .distribution,
                minSelections: nil,
                maxSelections: nil,
                options: nil,
                outputKey: "time_philosophy",
                helperText: "比例不是事实，而是你当下的内部重力。",
                distributionKeys: [
                    BenyuanDistributionKey(key: "past", label: "过去"),
                    BenyuanDistributionKey(key: "present", label: "现在"),
                    BenyuanDistributionKey(key: "future", label: "未来")
                ],
                analysisDimensions: ["memory_weight", "presence", "projection"],
                acceptedFiles: nil,
                uploadRange: nil
            ),
            BenyuanQuestion(
                id: "C2_precious_photo_analysis",
                module: .c,
                title: "珍贵影像",
                prompt: "上传一张你舍不得删除的照片，让它成为剧场的入口。",
                kind: .upload,
                minSelections: nil,
                maxSelections: nil,
                options: nil,
                outputKey: "precious_photo_analysis",
                helperText: "照片不会被当作普通素材，它会参与后续剧情和星图解释。",
                distributionKeys: nil,
                analysisDimensions: ["attachment", "loss", "identity"],
                acceptedFiles: "image/*",
                uploadRange: BenyuanUploadRange(min: 1, max: 3)
            )
        ]
    }

    static var previewTheater: TheaterGenerateResponse {
        TheaterGenerateResponse(
            theaterScriptId: "theater_native_preview",
            part1Id: "part1_native_preview",
            runtime: AgentRuntimeResult(
                providerName: "preview",
                model: "local-fixture",
                mode: "fixture",
                source: "ios-native-preview",
                fallbackActive: false,
                error: nil
            ),
            theaterScript: TheaterScript(
                userId: "usr_native_preview",
                generatedAt: "2026-05-08T00:00:00.000Z",
                personalizationSummary: TheaterScript.PersonalizationSummary(
                    coreArchetype: "深月观测者",
                    aestheticStyle: "低照度月面 / 黑潮 / 银白玻璃",
                    emotionalTone: "克制、敏感、缓慢靠近",
                    keyThemes: ["边界", "凝视", "未寄出的信"]
                ),
                act1: TheaterScript.Act1(
                    sceneDescription: "你站在一座没有门牌的月下剧场前，墙面像黑色海水，里面传来一段只属于你的旧音乐。",
                    visualPrompt: "deep lunar theater entrance, realistic black moon, restrained silver light",
                    ambientSound: "低频潮声与远处钢琴",
                    duration: 35
                ),
                act2: TheaterScript.Act2(choices: [
                    TheaterChoice(
                        choiceId: 1,
                        scene: "第一幕里，一位戴银色面具的人递给你一封没有署名的信。他说：你可以现在拆开，也可以带着它穿过走廊。",
                        options: [
                            TheaterChoiceOption(id: "open_now", text: "立刻拆开，承认自己想知道真相。", traitSignal: "direct_truth", response: "纸面像月光一样发冷。"),
                            TheaterChoiceOption(id: "carry_forward", text: "先收起来，等到更深处再读。", traitSignal: "deferred_intimacy", response: "信封在掌心变得很重。")
                        ]
                    ),
                    TheaterChoice(
                        choiceId: 2,
                        scene: "走廊尽头有两扇门：一扇传来熟悉的声音，一扇完全安静，却透出微弱银光。",
                        options: [
                            TheaterChoiceOption(id: "familiar_voice", text: "推开有声音的门，面对旧关系的回声。", traitSignal: "relationship_return", response: "声音停顿了一下，像等你命名它。"),
                            TheaterChoiceOption(id: "silent_light", text: "走向安静的银光，选择暂时不解释。", traitSignal: "inner_boundary", response: "银光落在你的肩上，像一层新的边界。")
                        ]
                    )
                ]),
                act3: TheaterScript.Act3(
                    sceneDescription: "镜厅中央出现一口黑色水井，水面映出的不是脸，而是你还没有说出口的愿望。",
                    mirrorQuestions: [
                        TheaterMirrorQuestion(
                            questionId: 1,
                            dialogue: "水井问：你最常用什么方式保护自己？",
                            question: "当别人靠近你的核心时，你更像哪一种反应？",
                            options: [
                                TheaterMirrorQuestionOption(id: "name_boundary", text: "说清界限，但仍留在现场。", traitSignal: "secure_boundary"),
                                TheaterMirrorQuestionOption(id: "vanish", text: "先消失，让对方猜不到入口。", traitSignal: "withdrawal")
                            ]
                        ),
                        TheaterMirrorQuestion(
                            questionId: 2,
                            dialogue: "面具人把信还给你：现在你可以决定它要不要被寄出。",
                            question: "你想把哪一部分自己交给世界？",
                            options: [
                                TheaterMirrorQuestionOption(id: "unfinished_desire", text: "还没完成、但真实的愿望。", traitSignal: "emergent_desire"),
                                TheaterMirrorQuestionOption(id: "precise_silence", text: "不解释的沉默和选择。", traitSignal: "aesthetic_silence")
                            ]
                        )
                    ],
                    mirrorFinalWords: "你不是没有答案，你只是不愿把答案交给不够深的场合。"
                ),
                epilogue: TheaterScript.Epilogue(
                    sceneDescription: "剧场天顶缓慢打开，一枚黑月从银白轨道后方升起。",
                    closingText: "最后一镜没有替你总结，它只是把你的停顿、选择和回望压成一枚精神星核。",
                    transitionPrompt: "从剧场过渡到星图生成",
                    transitionAnimation: "deep-moon-continuous-shot"
                )
            )
        )
    }

    static var previewConstellation: ConstellationGenerateResponse {
        ConstellationGenerateResponse(
            constellationId: "const_native_preview",
            runtime: AgentRuntimeResult(
                providerName: "preview",
                model: "local-fixture",
                mode: "fixture",
                source: "ios-native-preview",
                fallbackActive: false,
                error: nil
            ),
            psycheConstellation: PsycheConstellation(
                userId: "usr_native_preview",
                generatedAt: "2026-05-08T00:00:00.000Z",
                archetype: PsycheArchetype(
                    name: "深月观测者",
                    englishName: "Deep Lunar Witness",
                    coreEssence: "你习惯在喧闹之外保留一块暗面，用它校准真正的欲望与边界。",
                    visualPrompt: "a realistic black moon crossing a deep gravitational field, restrained silver light, subtle aubergine space"
                ),
                sevenDimensions: [
                    "openness": PsycheDimension(score: 86, interpretation: "你更容易被未命名的经验吸引，愿意把不确定当作入口，而不是噪声。"),
                    "meaning_seeking": PsycheDimension(score: 91, interpretation: "你会把关系、选择和作品放进更大的意义结构里反复观看。"),
                    "aesthetic_sensitivity": PsycheDimension(score: 88, interpretation: "氛围、材质与语气会直接影响你对一件事是否真实的判断。"),
                    "emotional_depth": PsycheDimension(score: 79, interpretation: "情绪很少只停在表层，你会追问它背后的需要与防御。"),
                    "independence": PsycheDimension(score: 74, interpretation: "你需要自己的节奏，不喜欢被过早定义，也不愿把复杂性降成口号。")
                ],
                narrativeOverview: "你像一颗慢速经过黑潮的月体：外侧安静，内部却持续发生潮汐。你不是单纯回避世界，而是在等待一种能与你的深度相称的抵达。",
                coreTensions: [
                    PsycheConstellation.CoreTension(
                        tensionId: 1,
                        name: "靠近与隐退",
                        description: "你渴望被真正理解，又会在被粗略理解时迅速后撤。",
                        growthDirection: "练习把边界说清，而不是只用消失保护自己。"
                    ),
                    PsycheConstellation.CoreTension(
                        tensionId: 2,
                        name: "意义与行动",
                        description: "你会先寻找精神上的准确性，因此有时推迟了现实中的第一步。",
                        growthDirection: "允许一个不完美动作先发生，再让意义慢慢跟上。"
                    )
                ],
                growthSuggestions: [
                    PsycheConstellation.GrowthSuggestion(
                        title: "给暗面一个出口",
                        description: "把不愿被立刻解释的部分保留下来，但给它一个可被看见的形状。",
                        actionableSteps: ["今晚写下三个不需要立刻解决的问题。", "选择一张最接近当下心境的图，给它命名。"]
                    )
                ],
                recommendations: PsycheConstellation.Recommendations(
                    books: [
                        PsycheConstellation.Recommendations.Book(title: "局外人", author: "阿尔贝·加缪", reason: "关于疏离感与真实感之间的冷光。"),
                        PsycheConstellation.Recommendations.Book(title: "月亮与六便士", author: "毛姆", reason: "关于自我召唤如何压过日常秩序。")
                    ],
                    films: [
                        PsycheConstellation.Recommendations.Film(title: "潜行者", director: "安德烈·塔可夫斯基", reason: "像进入内在禁区的一次缓慢长镜头。"),
                        PsycheConstellation.Recommendations.Film(title: "花样年华", director: "王家卫", reason: "克制、错身与没有说出口的情感秩序。")
                    ],
                    music: [
                        PsycheConstellation.Recommendations.Music(artist: "坂本龙一", album: "async", reason: "像一层缓慢展开的精神潮汐。"),
                        PsycheConstellation.Recommendations.Music(artist: "Tim Hecker", album: "Virgins", reason: "噪声、庄严与不可完全解释的深场。")
                    ]
                )
            )
        )
    }
}

private extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

private extension Date {
    var benyuanISOString: String {
        ISO8601DateFormatter().string(from: self)
    }
}
