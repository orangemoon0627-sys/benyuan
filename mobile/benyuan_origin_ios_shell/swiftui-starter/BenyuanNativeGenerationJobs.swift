import Foundation

@MainActor
extension BenyuanNativeFlowModel {
    func restoreActiveGenerationJobIfNeeded() async -> Bool {
        guard let jobId = session.activeGenerationJobId else { return false }
        activeGenerationJobId = jobId
        logNativeE2E("restore_active_job_start job_id=\(jobId)")
        stage = .processing
        processingTitle = "正在取回云端生成"
        processingDetail = "云端任务会在后台继续运行，回来后自动接上。"
        processingProgress = max(processingProgress, 0.18)
        do {
            let job = try await client.fetchNativeGenerationJob(jobId: jobId)
            applyNativeGenerationJob(job, source: .restore)
            if job.status == "done" {
                try await completeNativeGenerationJob(job)
                logNativeE2E("restore_active_job_finished job_id=\(jobId) status=done")
                return true
            }
            if job.status == "failed" {
                session.activeGenerationJobId = nil
                activeGenerationJobId = nil
                persist()
                logNativeE2E("restore_active_job_failed job_id=\(jobId)")
                throw BenyuanAPIError.server(status: 500, message: job.error ?? "native_generation_failed")
            }
            try await pollNativeGenerationJob(jobId: jobId)
            logNativeE2E("restore_active_job_finished job_id=\(jobId) status=polled")
        } catch {
            logNativeE2EError(stage: "restore_active_job", error: error)
            stage = .error(error.localizedDescription)
        }
        return true
    }

    func pollNativeGenerationJob(jobId: String) async throws {
        guard beginNativeGenerationPollingIfNeeded() else { return }
        defer { endNativeGenerationPolling() }
        activeGenerationJobId = jobId
        session.activeGenerationJobId = jobId
        persist()
        while true {
            try Task.checkCancellation()
            let job = try await client.fetchNativeGenerationJob(jobId: jobId)
            applyNativeGenerationJob(job, source: .live)

            if job.status == "done" {
                try await completeNativeGenerationJob(job)
                return
            }
            if job.status == "failed" {
                session.activeGenerationJobId = nil
                activeGenerationJobId = nil
                persist()
                throw BenyuanAPIError.server(status: 500, message: job.error ?? "native_generation_failed")
            }

            try await Task.sleep(nanoseconds: nativeGenerationPollDelayNanoseconds)
        }
    }

    func applyNativeGenerationJob(_ job: BenyuanNativeGenerationJobResponse, source: BenyuanNativeGenerationJobPresentationSource) {
        rememberNativeGenerationJobSnapshot(job)
        processingProgress = max(processingProgress, min(max(job.progress, 0.02), 1))
        let resumeCopy = job.canResumeInBackground ? "云端任务会在后台继续运行，回来后自动接上。" : "请停留在当前页面，云端任务正在收束。"
        let sourcePrefix: String
        switch source {
        case .live:
            sourcePrefix = ""
        case .restore:
            sourcePrefix = "已取回云端进度。"
        case .foreground:
            sourcePrefix = "已同步最新进度。"
        }
        let message = job.message.trimmingCharacters(in: .whitespacesAndNewlines)
        processingDetail = [sourcePrefix, message, resumeCopy].filter { !$0.isEmpty }.joined(separator: " ")
        switch job.currentStage {
        case "queued":
            processingTitle = "云端任务正在排队"
        case "multimodal":
            processingTitle = "正在读取影像背面的情绪"
        case "theater":
            processingTitle = "剧场开始生成"
        case "constellation":
            processingTitle = "精神星图正在显影"
        case "done":
            processingTitle = "云端生成完成"
        case "failed":
            processingTitle = "云端生成中断"
        default:
            processingTitle = "本源正在云端生成"
        }
    }

    func completeNativeGenerationJob(_ job: BenyuanNativeGenerationJobResponse) async throws {
        session.activeGenerationJobId = nil
        activeGenerationJobId = nil
        processingProgress = 1
        persist()

        switch job.kind {
        case "theater":
            guard let theaterScriptId = job.theaterScriptId else {
                throw BenyuanAPIError.invalidResponse
            }
            let record = try await client.fetchTheaterScript(theaterScriptId: theaterScriptId)
            theater = record.generateResponse()
            session.theaterScriptId = theaterScriptId
            persist()
            logNativeE2E("theater_saved theater_script_id=\(theaterScriptId)")
            resetTheaterState()
            stage = .theater
        case "constellation":
            guard let constellationId = job.constellationId else {
                throw BenyuanAPIError.invalidResponse
            }
            let record = try await client.fetchConstellationRecord(constellationId: constellationId)
            constellation = record.generateResponse(constellationId: constellationId)
            session.constellationId = constellationId
            persist()
            logNativeE2E("constellation_generated constellation_id=\(constellationId)")
            stage = .constellation
        default:
            throw BenyuanAPIError.invalidResponse
        }
    }
}
