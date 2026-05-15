import Foundation
import Photos
import SwiftUI

enum BenyuanNativeStage: Equatable {
    case launching
    case home
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
}

enum BenyuanQuestionMotionDirection: Equatable {
    case forward
    case backward
    case reset
}

enum BenyuanUploadApplyMode: Equatable {
    case append
    case replace
}

enum BenyuanNativeGenerationJobPresentationSource: Equatable {
    case live
    case restore
    case foreground
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
    @Published var stage: BenyuanNativeStage = .home
    @Published var questions: [BenyuanQuestion] = []
    @Published var activeQuestionIndex = 0
    @Published var session: BenyuanNativeSession
    @Published var thumbnails: [String: UIImage] = [:]
    @Published var uploadingQuestionId: String?
    @Published var processingTitle = "正在唤醒本源"
    @Published var processingDetail = "先让问题、影像和剧场彼此对齐。"
    @Published var processingProgress = 0.12
    @Published var activeGenerationJobId: String?
    @Published var theater: TheaterGenerateResponse?
    @Published var theaterPhase: BenyuanNativeTheaterPhase = .act1
    @Published var theaterChoiceIndex = 0
    @Published var selectedTheaterOptionId: String?
    @Published var isTheaterChoiceFeedbackVisible = false
    @Published var isTheaterConstellationEntrySubmitting = false
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
    @Published var isFeedbackComposerPresented = false
    @Published var feedbackKind: BenyuanFeedbackKind = .issue
    @Published var feedbackDraft = ""
    @Published var feedbackStatus: String?
    @Published var isFeedbackSubmitting = false
    @Published var questionMotionDirection: BenyuanQuestionMotionDirection = .reset
    @Published var questionMotionToken = UUID()
    @Published var collectValidationPulse = 0
    @Published var hasCompletedInitialHomeBoot = false

    let client: BenyuanAPIClient
    private let store: BenyuanFlowStore
    var phaseStartedAt = Date()
    var interactionStartedAt = Date()
    var choiceLogs: [Part2ChoiceRecord] = []
    var mirrorLogs: [Part2MirrorRecord] = []
    var flowStartedAt = Date()
    var stageBeforeAccount: BenyuanNativeStage?
    var activeNativePreviewStage: BenyuanNativePreviewStage?
    private let nativeGenerationPollIntervalNanoseconds: UInt64 = 2_000_000_000
    private var lastNativeGenerationJobSnapshot: BenyuanNativeGenerationJobResponse?
    private var isPollingNativeGenerationJob = false
    private var toastDismissTask: Task<Void, Never>?
    private var toastDismissToken = UUID()

    init(client: BenyuanAPIClient = BenyuanAPIClient(), store: BenyuanFlowStore = BenyuanFlowStore()) {
        self.client = client
        self.store = store
        self.session = store.load()
        self.activeGenerationJobId = self.session.activeGenerationJobId
        self.client.setAuthSession(self.session.authSession)
#if DEBUG
        if let previewStage = BenyuanShellConfig.nativePreviewStage {
            applyNativePreview(previewStage)
        }
#endif
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

    var flowMotionProgress: Double {
        switch stage {
        case .launching:
            return 0.05
        case .home:
            return 0.08
        case .auth:
            return 0.10
        case .account:
            return 0.16
        case .collect:
            return 0.18 + progress * 0.34
        case .processing:
            return 0.58 + min(max(processingProgress, 0), 1) * 0.18
        case .theater:
            return 0.76 + theaterMotionProgress * 0.16
        case .constellation:
            return 0.96
        case .error:
            return 0.12
        }
    }

    var allQuestionsAnswered: Bool {
        !questions.isEmpty && questions.allSatisfy { isAnswered($0) }
    }

    var currentQuestionIsAnswered: Bool {
        guard let currentQuestion else { return false }
        return isAnswered(currentQuestion)
    }

    var currentTheaterChoice: TheaterChoice? {
        theater?.theaterScript.act2.choices[safe: theaterChoiceIndex]
    }

    var requiredTheaterChoiceCount: Int {
        min(4, theater?.theaterScript.act2.choices.count ?? 0)
    }

    var hasAnsweredCurrentTheaterChoice: Bool {
        choiceLogs.count > theaterChoiceIndex
    }

    var canEnterConstellationGenerationFromTheater: Bool {
        stage == .theater
            && theaterPhase == .act2
            && requiredTheaterChoiceCount > 0
            && choiceLogs.count >= requiredTheaterChoiceCount
            && !isTheaterConstellationEntrySubmitting
    }

    var theaterMotionProgress: Double {
        switch theaterPhase {
        case .act1:
            return 0.08
        case .act2:
            return 0.88
        }
    }

    var choiceLogCount: Int {
        choiceLogs.count
    }

    var mirrorLogCount: Int {
        mirrorLogs.count
    }

    var canExploreFromHome: Bool {
        guard let authSession = session.authSession else { return false }
        return authSession.provider != .anonymous
    }

    var shouldAnimateStageTransition: Bool {
        hasCompletedInitialHomeBoot || BenyuanShellConfig.nativePreviewStage != nil || BenyuanShellConfig.nativeE2EAutorun
    }

    func start() async {
        if let previewStage = BenyuanShellConfig.nativePreviewStage {
            applyNativePreview(previewStage)
            hasCompletedInitialHomeBoot = true
            return
        }

        if BenyuanShellConfig.nativeE2EAutorun {
            await runNativeE2EAutorun()
            hasCompletedInitialHomeBoot = true
            return
        }

        await refreshAuthProviders()
        stage = .home
        hasCompletedInitialHomeBoot = true
    }

    func enterHome() {
        stage = .home
    }

    func showToast(_ message: String?, duration: TimeInterval = 1.8) {
        toastDismissTask?.cancel()
        toastDismissToken = UUID()
        let token = toastDismissToken
        toast = message

        guard let message, !message.isEmpty, duration > 0 else {
            toastDismissTask = nil
            return
        }

        let nanoseconds = UInt64((duration * 1_000_000_000).rounded())
        toastDismissTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: nanoseconds)
            guard !Task.isCancelled else { return }
            await MainActor.run {
                guard let self, self.toastDismissToken == token else { return }
                self.toast = nil
                self.toastDismissTask = nil
            }
        }
    }

    func beginNativeExploration() async {
        if session.authSession == nil {
            await continueAsGuest()
            return
        }

        client.setAuthSession(session.authSession)
        do {
            if await restoreActiveGenerationJobIfNeeded() {
                return
            }
            processingTitle = "正在打开本源"
            processingDetail = "读取当前问题结构。"
            let schema = try await client.fetchSchema()
            questions = schema.questions
            activeQuestionIndex = firstIncompleteQuestionIndex()
            stage = .collect
        } catch {
            stage = .error(error.localizedDescription)
        }
    }

    func beginNativeExplorationFromHome() async {
        guard canExploreFromHome else {
            showToast("先选择 Apple、微信或手机号码登录，再开始探索。")
            return
        }
        await beginNativeExploration()
    }

    func resumeProcessingIfNeeded() async {
        guard stage == .processing, let jobId = session.activeGenerationJobId else { return }
        activeGenerationJobId = jobId
        do {
            let job = try await client.fetchNativeGenerationJob(jobId: jobId)
            applyNativeGenerationJob(job, source: .foreground)
            if job.status == "done" {
                try await completeNativeGenerationJob(job)
                return
            }
            if job.status == "failed" {
                session.activeGenerationJobId = nil
                activeGenerationJobId = nil
                persist()
                stage = .error(job.error ?? "native_generation_failed")
                return
            }
            if !isPollingNativeGenerationJob {
                try await pollNativeGenerationJob(jobId: jobId)
            }
        } catch {
            showToast(error.localizedDescription)
        }
    }

    func runNativeE2EAutorun() async {
        store.resetE2EEvents()
        logNativeE2E("autorun_start")
        restart()
        stage = .processing
        processingTitle = "正在连接云端深场"
        processingDetail = "云端会自动走完线索、剧场与星图，确认这一条体验链能完整显影。"
        processingProgress = 0.08

        do {
            let auth = try await client.createAnonymousSession()
            session.authSession = auth.session
            session.user = auth.user
            client.setAuthSession(auth.session)
            persist()
            logNativeE2E("auth_created user_id=\(auth.user.userId)")

            processingTitle = "正在读取第一段问题"
            processingDetail = "App 正在取回当前云端题面。"
            processingProgress = 0.16
            let schema = try await client.fetchSchema()
            questions = schema.questions
            logNativeE2E("schema_fetched questions=\(schema.questions.count)")

            processingTitle = "正在送入图片线索"
            processingDetail = "用本地样张模拟一次真实选择，检查图片能不能进入分析。"
            processingProgress = 0.24
            let fixtureAssets = try await uploadNativeE2EFixtures(for: schema.questions)
            logNativeE2E("fixtures_uploaded assets=\(fixtureAssets.count)")

            processingTitle = "正在点亮回答轨道"
            processingDetail = "云端会收到选择、比例和图片线索，继续生成后面的剧场。"
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
        activeNativePreviewStage = previewStage
        prefersConstellationEndPreview = false
        isTheaterConstellationEntrySubmitting = false
        switch previewStage {
        case .auth:
            authProviders = Self.previewAuthProviders
            session.authSession = nil
            session.user = nil
            stage = .auth
        case .home:
            authProviders = Self.previewAuthProviders
            session.authSession = Self.previewAuthSession
            session.user = Self.previewUser
            client.setAuthSession(session.authSession)
            accountHistory = Self.previewAccountHistory
            stage = .home
        case .account, .accountFeedback:
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
            if previewStage == .accountFeedback {
                feedbackKind = .issue
                feedbackDraft = "星图生成后，底部按钮偶尔会遮住最后一段文字。"
                isFeedbackComposerPresented = true
            }
        case .collect:
            authProviders = Self.previewAuthProviders
            session.authSession = Self.previewAuthSession
            session.user = Self.previewUser
            session.activeGenerationJobId = "job_native_preview"
            activeGenerationJobId = session.activeGenerationJobId
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
        case .theater, .theaterAct2:
            authProviders = Self.previewAuthProviders
            session.authSession = Self.previewAuthSession
            session.user = Self.previewUser
            session.part1Id = "part1_native_preview"
            session.theaterScriptId = "theater_native_preview"
            client.setAuthSession(session.authSession)
            theater = Self.previewTheater
            constellation = nil
            resetTheaterState()
            switch previewStage {
            case .theaterAct2:
                theaterPhase = .act2
                theaterChoiceIndex = 0
            default:
                break
            }
            stage = .theater
        case .constellation, .constellationEnd:
            authProviders = Self.previewAuthProviders
            session.authSession = Self.previewAuthSession
            session.user = Self.previewUser
            client.setAuthSession(session.authSession)
            constellation = Self.previewConstellation(archetypeVariant: BenyuanShellConfig.nativePreviewArchetypeVariant).canonicalizedForNativeDisplay
            processingProgress = 0.88
            prefersConstellationEndPreview = previewStage == .constellationEnd
            stage = .constellation
        }
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

        while choiceLogs.count < requiredTheaterChoiceCount {
            guard let option = currentTheaterChoice?.options.first else { break }
            chooseAct2(option)
            try? await Task.sleep(nanoseconds: 640_000_000)
        }
        logNativeE2E("theater_autocomplete_finished choices=\(choiceLogs.count) mirrors=\(mirrorLogs.count) phase=\(theaterPhase)")
    }

    func restart() {
        let authSession = session.authSession
        let user = session.user
        session = .empty
        session.authSession = authSession
        session.user = user
        activeGenerationJobId = nil
        client.setAuthSession(authSession)
        thumbnails = [:]
        theater = nil
        constellation = nil
        prefersConstellationEndPreview = false
        activeQuestionIndex = 0
        resetTheaterState()
        flowStartedAt = Date()
        persist()
        activeNativePreviewStage = nil
        stage = .home
    }

    func uploadedAssets(for questionId: String) -> [BenyuanUploadedAssetRef] {
        session.uploadedAssets[questionId] ?? []
    }

    func restorePart1Draft(_ record: BenyuanPart1HistoryRecordResponse) {
        session.part1Id = record.part1Id
        session.activeGenerationJobId = nil
        activeGenerationJobId = nil
        session.answers.merge(record.answers) { _, restored in restored }
        session.uploadedAssets = record.uploadedAssets
        let restoredAssetIds = Set(record.uploadedAssets.values.flatMap { $0.map(\.assetId) })
        thumbnails = thumbnails.filter { restoredAssetIds.contains($0.key) }
        persist()
    }

    func restorePart2Replay(_ record: BenyuanPart2HistoryRecordResponse) {
        session.part1Id = record.part1Id
        session.part2Id = record.part2Id
        session.theaterScriptId = record.theaterScriptId
        session.activeGenerationJobId = nil
        activeGenerationJobId = nil
        if let phaseDurations = record.metadata["phase_durations"]?.objectValue {
            session.phaseDurations = phaseDurations.reduce(into: [:]) { result, entry in
                if case .number(let value) = entry.value {
                    result[entry.key] = value
                }
            }
        }
        choiceLogs = record.act2Choices
        mirrorLogs = record.act3Responses
        selectedTheaterOptionId = nil
        isTheaterChoiceFeedbackVisible = false
        isTheaterConstellationEntrySubmitting = false

        theaterPhase = .act2
        theaterChoiceIndex = 0

        phaseStartedAt = Date()
        interactionStartedAt = Date()
        persist()
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

    func firstIncompleteQuestionIndex() -> Int {
        questions.firstIndex { !isAnswered($0) } ?? 0
    }

    func moveToQuestion(_ index: Int) {
        let bounded = min(max(index, 0), max(questions.count - 1, 0))
        guard bounded != activeQuestionIndex else { return }
        recordQuestionMotion(direction: bounded > activeQuestionIndex ? .forward : .backward)
        activeQuestionIndex = bounded
    }

    func recordQuestionMotion(direction: BenyuanQuestionMotionDirection) {
        questionMotionDirection = direction
        questionMotionToken = UUID()
    }

    func advanceAfterAnswer(delay: TimeInterval = 0.18) {
        Task {
            let nanoseconds = UInt64(delay * 1_000_000_000)
            try? await Task.sleep(nanoseconds: nanoseconds)
            await MainActor.run {
                if activeQuestionIndex < questions.count - 1 {
                    recordQuestionMotion(direction: .forward)
                    activeQuestionIndex += 1
                }
            }
        }
    }

    func resetTheaterState() {
        theaterPhase = .act1
        theaterChoiceIndex = 0
        selectedTheaterOptionId = nil
        isTheaterChoiceFeedbackVisible = false
        isTheaterConstellationEntrySubmitting = false
        choiceLogs = []
        mirrorLogs = []
        phaseStartedAt = Date()
        interactionStartedAt = Date()
    }

    func markPhaseDuration(_ phase: String) {
        session.phaseDurations[phase] = rounded(Date().timeIntervalSince(phaseStartedAt))
        phaseStartedAt = Date()
        persist()
    }

    func resetInteractionTimer() {
        interactionStartedAt = Date()
    }

    func rounded(_ value: TimeInterval) -> Double {
        Double((value * 10).rounded() / 10)
    }

    func persist() {
        store.save(session)
    }

    var nativeGenerationPollDelayNanoseconds: UInt64 {
        nativeGenerationPollIntervalNanoseconds
    }

    func beginNativeGenerationPollingIfNeeded() -> Bool {
        guard !isPollingNativeGenerationJob else { return false }
        isPollingNativeGenerationJob = true
        return true
    }

    func endNativeGenerationPolling() {
        isPollingNativeGenerationJob = false
    }

    func rememberNativeGenerationJobSnapshot(_ job: BenyuanNativeGenerationJobResponse) {
        lastNativeGenerationJobSnapshot = job
    }

    func isSameNativeGenerationJobAsLastSnapshot(_ job: BenyuanNativeGenerationJobResponse) -> Bool {
        job.jobId == lastNativeGenerationJobSnapshot?.jobId
    }

    func logNativeE2E(_ message: String) {
#if DEBUG
        if BenyuanShellConfig.nativeE2EAutorun || BenyuanShellConfig.nativeE2EDiagnostics {
            store.appendE2EEvent(message)
            print("BENYUAN_E2E \(message)")
        }
#endif
    }

    func logNativeE2EError(stage: String, error: Error) {
#if DEBUG
        if BenyuanShellConfig.nativeE2EAutorun || BenyuanShellConfig.nativeE2EDiagnostics {
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

private extension Collection {
    subscript(safe index: Index) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}

extension Date {
    var benyuanISOString: String {
        ISO8601DateFormatter().string(from: self)
    }
}
