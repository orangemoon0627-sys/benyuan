import Foundation

@MainActor
extension BenyuanNativeFlowModel {
    func enterAct2() {
        markPhaseDuration("act1")
        theaterPhase = .act2
        resetInteractionTimer()
    }

    func revisitTheaterPhase(_ phase: BenyuanNativeTheaterPhase) {
        guard phase != theaterPhase else { return }
        selectedTheaterOptionId = nil
        isTheaterChoiceFeedbackVisible = false
        isTheaterConstellationEntrySubmitting = false
        theaterPhase = phase
        resetInteractionTimer()
    }

    func chooseAct2(_ option: TheaterChoiceOption) {
        guard let choice = currentTheaterChoice,
              choiceLogs.count == theaterChoiceIndex,
              choiceLogs.count < requiredTheaterChoiceCount,
              !isTheaterConstellationEntrySubmitting else { return }
        selectedTheaterOptionId = option.id
        isTheaterChoiceFeedbackVisible = true
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
                markPhaseDuration("act2")
                resetInteractionTimer()
                isTheaterChoiceFeedbackVisible = false
                if choiceLogs.count < requiredTheaterChoiceCount {
                    selectedTheaterOptionId = nil
                    theaterChoiceIndex = choiceLogs.count
                }
            }
        }
    }

    func enterConstellationGenerationFromTheater() async {
        guard canEnterConstellationGenerationFromTheater else { return }
        isTheaterConstellationEntrySubmitting = true

        if activeNativePreviewStage != nil {
            markPhaseDuration("act2")
            processingProgress = 0.88
            constellation = Self.previewConstellation(archetypeVariant: BenyuanShellConfig.nativePreviewArchetypeVariant).canonicalizedForNativeDisplay
            session.constellationId = constellation?.constellationId
            session.activeGenerationJobId = nil
            activeGenerationJobId = nil
            persist()
            stage = .constellation
            isTheaterConstellationEntrySubmitting = false
            return
        }

        await finishTheaterAndGenerateConstellation()
    }

    func finishTheaterAndGenerateConstellation() async {
        do {
            try await finishTheaterAndGenerateConstellationPipeline()
        } catch {
            stage = .error(error.localizedDescription)
            isTheaterConstellationEntrySubmitting = false
        }
    }

    func finishTheaterAndGenerateConstellationPipeline() async throws {
        guard let part1Id = session.part1Id, let theaterScriptId = session.theaterScriptId else {
            throw BenyuanNativeFlowError.missingTheaterContext
        }

        isTheaterConstellationEntrySubmitting = true
        stage = .processing
        processingTitle = "剧场选择正在封存"
        processingDetail = "把刚才的选择和停顿写入第二层记录，随后直接显影星图。"
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
        processingDetail = "云端正在把选择、停顿和回望压成星图，可以切出 App。"
        processingProgress = 0.12
        let job = try await client.startNativeGenerationJob(kind: "constellation", part1Id: part1Id, part2Id: part2.part2Id)
        session.activeGenerationJobId = job.jobId
        activeGenerationJobId = job.jobId
        persist()
        applyNativeGenerationJob(job, source: .live)
        logNativeE2E("native_job_started kind=constellation job_id=\(job.jobId)")
        try await pollNativeGenerationJob(jobId: job.jobId)
        isTheaterConstellationEntrySubmitting = false
    }
}
