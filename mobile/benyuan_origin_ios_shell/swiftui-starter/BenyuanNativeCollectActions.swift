import SwiftUI

@MainActor
extension BenyuanNativeFlowModel {
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
        let nextIndex = max(0, activeQuestionIndex - 1)
        guard nextIndex != activeQuestionIndex else { return }
        recordQuestionMotion(direction: .backward)
        activeQuestionIndex = nextIndex
    }

    func nextQuestion() {
        let nextIndex = min(max(questions.count - 1, 0), activeQuestionIndex + 1)
        guard nextIndex != activeQuestionIndex else { return }
        recordQuestionMotion(direction: .forward)
        activeQuestionIndex = nextIndex
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

    func submitPart1AndGenerateTheaterPipeline() async throws {
        guard allQuestionsAnswered else {
            moveToQuestion(firstIncompleteQuestionIndex())
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
        processingDetail = "云端已接收线索，可以切出 App，稍后回来查看结果。"
        processingProgress = 0.48
        let job = try await client.startNativeGenerationJob(kind: "theater", part1Id: part1.part1Id)
        session.activeGenerationJobId = job.jobId
        activeGenerationJobId = job.jobId
        persist()
        logNativeE2E("native_job_started kind=theater job_id=\(job.jobId)")
        try await pollNativeGenerationJob(jobId: job.jobId)
    }
}
