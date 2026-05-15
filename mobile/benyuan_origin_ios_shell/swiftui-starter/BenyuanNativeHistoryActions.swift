import Foundation

@MainActor
extension BenyuanNativeFlowModel {
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
            showToast(error.localizedDescription)
        }
    }

    func openHistoryItem(_ item: BenyuanAccountHistoryItem) {
        dismissAccountTransientSurfaces()
        restoringHistoryPart1Id = item.part1Id
        session.part1Id = item.part1Id
        session.theaterScriptId = item.theaterScriptId
        session.part2Id = item.part2Id
        session.constellationId = item.constellationId
        session.activeGenerationJobId = nil
        activeGenerationJobId = nil
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
            dismissAccountTransientSurfaces()
            session.part1Id = item.part1Id
            session.theaterScriptId = item.theaterScriptId
            session.part2Id = item.part2Id
            session.constellationId = item.constellationId
            session.activeGenerationJobId = nil
            activeGenerationJobId = nil
            persist()
            switch item.stage {
            case .part1:
                if questions.isEmpty {
                    let schema = try await client.fetchSchema()
                    questions = schema.questions
                }
                let record = try await client.fetchPart1HistoryRecord(part1Id: item.part1Id)
                restorePart1Draft(record)
                activeQuestionIndex = firstIncompleteQuestionIndex()
                stage = .collect
            case .theater, .part2:
                guard let theaterScriptId = item.theaterScriptId else {
                    throw BenyuanHistoryRestoreError.missingTheaterScript
                }
                let record = try await client.fetchTheaterScript(theaterScriptId: theaterScriptId)
                theater = record.generateResponse()
                constellation = nil
                if item.stage == .part2 {
                    let part2 = try await client.fetchPart2HistoryRecord(part1Id: item.part1Id, part2Id: item.part2Id)
                    restorePart2Replay(part2)
                } else {
                    resetTheaterState()
                }
                stage = .theater
            case .constellation:
                if let theaterScriptId = item.theaterScriptId, theater?.theaterScriptId != theaterScriptId {
                    do {
                        let record = try await client.fetchTheaterScript(theaterScriptId: theaterScriptId)
                        theater = record.generateResponse()
                    } catch {
                        theater = nil
                    }
                }
                if let part2Id = item.part2Id {
                    do {
                        let part2 = try await client.fetchPart2HistoryRecord(part1Id: item.part1Id, part2Id: part2Id)
                        restorePart2Replay(part2)
                    } catch {
                        session.part2Id = part2Id
                        persist()
                    }
                }
                guard let constellationId = item.constellationId else {
                    throw BenyuanHistoryRestoreError.missingConstellation
                }
                processingProgress = 0.78
                let record = try await client.fetchConstellationRecord(constellationId: constellationId)
                constellation = record.generateResponse(constellationId: constellationId).canonicalizedForNativeDisplay
                session.constellationId = constellationId
                persist()
                stage = .constellation
            }
            restoringHistoryPart1Id = nil
        } catch {
            restoringHistoryPart1Id = nil
            stage = .account
            showToast(error.localizedDescription)
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
            showToast("这次探索已删除。")
        } catch {
            showToast(error.localizedDescription)
        }
    }
}
