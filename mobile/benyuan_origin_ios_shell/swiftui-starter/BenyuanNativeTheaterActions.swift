import Foundation

@MainActor
extension BenyuanNativeFlowModel {
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
        selectedMirrorOptionId = option.id
        let hesitation = Date().timeIntervalSince(interactionStartedAt)
        mirrorLogs.append(Part2MirrorRecord(
            questionId: question.questionId,
            selected: option.id,
            hesitationTime: rounded(hesitation),
            timestamp: Date().benyuanISOString
        ))

        Task {
            try? await Task.sleep(nanoseconds: 460_000_000)
            await MainActor.run {
                selectedMirrorOptionId = nil
                if let theater, theaterMirrorIndex < theater.theaterScript.act3.mirrorQuestions.count - 1 {
                    theaterMirrorIndex += 1
                    resetInteractionTimer()
                } else {
                    markPhaseDuration("act3")
                    theaterPhase = .epilogue
                    resetInteractionTimer()
                }
            }
        }
    }

    func finishTheaterAndGenerateConstellation() async {
        do {
            try await finishTheaterAndGenerateConstellationPipeline()
        } catch {
            stage = .error(error.localizedDescription)
        }
    }

    func finishTheaterAndGenerateConstellationPipeline() async throws {
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
        processingDetail = "云端正在把选择、停顿和回望压成星图，可以切出 App。"
        processingProgress = 0.88
        let job = try await client.startNativeGenerationJob(kind: "constellation", part1Id: part1Id, part2Id: part2.part2Id)
        session.activeGenerationJobId = job.jobId
        activeGenerationJobId = job.jobId
        persist()
        logNativeE2E("native_job_started kind=constellation job_id=\(job.jobId)")
        try await pollNativeGenerationJob(jobId: job.jobId)
    }
}
