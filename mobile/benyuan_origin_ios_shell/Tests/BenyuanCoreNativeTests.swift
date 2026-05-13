import AuthenticationServices
import Foundation
import XCTest
@testable import BenyuanOriginShell

final class BenyuanMockURLProtocol: URLProtocol {
    typealias Handler = (URLRequest) throws -> (HTTPURLResponse, Data)

    static var handler: Handler?

    override class func canInit(with request: URLRequest) -> Bool {
        true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        guard let handler = Self.handler else {
            client?.urlProtocol(self, didFailWithError: BenyuanAPIError.invalidResponse)
            return
        }

        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}

    static func json(_ status: Int, _ body: String) -> (HTTPURLResponse, Data) {
        let url = URL(string: "http://native-e2e.test")!
        let response = HTTPURLResponse(
            url: url,
            statusCode: status,
            httpVersion: nil,
            headerFields: ["Content-Type": "application/json"]
        )!
        return (response, body.data(using: .utf8)!)
    }

    static func html(_ status: Int, _ body: String) -> (HTTPURLResponse, Data) {
        let url = URL(string: "http://native-e2e.test")!
        let response = HTTPURLResponse(
            url: url,
            statusCode: status,
            httpVersion: nil,
            headerFields: ["Content-Type": "text/html; charset=utf-8"]
        )!
        return (response, body.data(using: .utf8)!)
    }
}

private extension URLRequest {
    var benyuanHTTPBodyData: Data {
        if let httpBody {
            return httpBody
        }
        guard let httpBodyStream else {
            return Data()
        }

        httpBodyStream.open()
        defer { httpBodyStream.close() }

        let bufferSize = 4096
        let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)
        defer { buffer.deallocate() }

        var data = Data()
        while httpBodyStream.hasBytesAvailable {
            let bytesRead = httpBodyStream.read(buffer, maxLength: bufferSize)
            guard bytesRead > 0 else { break }
            data.append(buffer, count: bytesRead)
        }
        return data
    }
}

final class BenyuanCoreNativeTests: XCTestCase {
    func testFlowStorePersistsMinimalNativeSession() throws {
        let suiteName = "benyuan-core-native-tests-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let store = BenyuanFlowStore(defaults: defaults)
        let session = BenyuanNativeSession(
            authSession: BenyuanAuthSession(
                sessionId: "auth_test",
                userId: "usr_test",
                token: "bya_anonymous_test",
                provider: .anonymous,
                createdAt: "2026-05-08T00:00:00.000Z",
                updatedAt: "2026-05-08T00:00:00.000Z"
            ),
            user: BenyuanUser(
                userId: "usr_test",
                createdAt: "2026-05-08T00:00:00.000Z",
                updatedAt: "2026-05-08T00:00:00.000Z",
                displayName: "访客",
                primaryProvider: .anonymous,
                providers: ["anonymous": "anonymous:test"],
                phoneBound: false,
                wechatBound: false
            ),
            part1Id: "part1_test",
            theaterScriptId: "theater_test",
            part2Id: "part2_test",
            constellationId: "const_test",
            activeGenerationJobId: "job_test",
            answers: ["A1_core_image": .string("A1-1")],
            uploadedAssets: [
                "A2_music_analysis": [
                    BenyuanUploadedAssetRef(
                        assetId: "asset_1",
                        questionId: "A2_music_analysis",
                        name: "music.jpg",
                        size: 2048,
                        mimeType: "image/jpeg",
                        uploadedAt: "2026-05-08T00:00:00.000Z",
                        uploadOrigin: "native-library"
                    )
                ]
            ],
            phaseDurations: ["act1": 1.5]
        )

        store.save(session)

        XCTAssertEqual(store.load(), session)
    }

    func testFlowStorePersistsNativeE2EEventsSeparatelyFromSession() throws {
        let suiteName = "benyuan-core-native-e2e-events-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let store = BenyuanFlowStore(defaults: defaults)

        store.appendE2EEvent("auth_created")
        store.appendE2EEvent("theater_saved theater_script_id=theater_test")

        XCTAssertEqual(store.loadE2EEvents().map(\.message), [
            "auth_created",
            "theater_saved theater_script_id=theater_test"
        ])
        XCTAssertEqual(store.load(), .empty)

        store.resetE2EEvents()

        XCTAssertEqual(store.loadE2EEvents(), [])
    }

    func testAPIClientBuildsEndpointRelativeToBaseURL() throws {
        let client = BenyuanAPIClient(baseURL: URL(string: "http://120.26.126.88")!)

        XCTAssertEqual(client.url(path: "/api/part1/schema").absoluteString, "http://120.26.126.88/api/part1/schema")
        XCTAssertEqual(client.url(path: "api/theater/generate").absoluteString, "http://120.26.126.88/api/theater/generate")
    }

    func testAPIClientStoresBearerAuthToken() throws {
        let client = BenyuanAPIClient(baseURL: URL(string: "http://120.26.126.88")!)

        client.setAuthSession(BenyuanAuthSession(
            sessionId: "auth_test",
            userId: "usr_test",
            token: "bya_anonymous_test",
            provider: .anonymous,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z"
        ))

        XCTAssertEqual(client.authorizationHeaderValue, "Bearer bya_anonymous_test")
    }

    func testNativeGenerationJobDecodesStageProgressMetadata() throws {
        let json = """
        {
          "job_id": "job_stage_test",
          "user_id": "usr_test",
          "part1_id": "part1_test",
          "part2_id": "part2_test",
          "kind": "constellation",
          "status": "running",
          "current_stage": "constellation",
          "progress": 0.46,
          "stage_progress": 0.42,
          "progress_basis": "server_stage_elapsed",
          "message": "云端正在生成精神星图。",
          "can_resume_in_background": true,
          "created_at": "2026-05-13T00:00:00.000Z",
          "updated_at": "2026-05-13T00:00:08.000Z",
          "stage_started_at": "2026-05-13T00:00:01.000Z",
          "stage_updated_at": "2026-05-13T00:00:08.000Z",
          "stage_detail": {
            "label": "精神星图",
            "step_index": 1,
            "step_count": 1,
            "progress_min": 0.18,
            "progress_max": 0.96,
            "elapsed_ms": 7000,
            "expected_ms": 36000
          }
        }
        """.data(using: .utf8)!

        let job = try JSONDecoder.benyuan.decode(BenyuanNativeGenerationJobResponse.self, from: json)

        XCTAssertEqual(job.stageProgress, 0.42)
        XCTAssertEqual(job.progressBasis, "server_stage_elapsed")
        XCTAssertEqual(job.stageDetail?.label, "精神星图")
        XCTAssertEqual(job.stageDetail?.stepIndex, 1)
        XCTAssertEqual(job.stageDetail?.progressMax, 0.96)
    }

    @MainActor
    func testNativeJobProgressIsMonotonicOnlyWithinSameCloudJob() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())
        let firstPayload = """
        {
          "job_id": "job_first",
          "user_id": "usr_test",
          "part1_id": "part1_test",
          "kind": "theater",
          "status": "running",
          "current_stage": "theater",
          "progress": 0.52,
          "stage_progress": 0.2,
          "progress_basis": "server_stage_elapsed",
          "message": "云端正在生成连续剧场。",
          "can_resume_in_background": true,
          "created_at": "2026-05-13T00:00:00.000Z",
          "updated_at": "2026-05-13T00:00:01.000Z"
        }
        """.data(using: .utf8)!
        let sameJobLowerPayload = """
        {
          "job_id": "job_first",
          "user_id": "usr_test",
          "part1_id": "part1_test",
          "kind": "theater",
          "status": "running",
          "current_stage": "theater",
          "progress": 0.48,
          "stage_progress": 0.18,
          "progress_basis": "server_stage_elapsed",
          "message": "云端正在生成连续剧场。",
          "can_resume_in_background": true,
          "created_at": "2026-05-13T00:00:00.000Z",
          "updated_at": "2026-05-13T00:00:02.000Z"
        }
        """.data(using: .utf8)!
        let nextJobPayload = """
        {
          "job_id": "job_second",
          "user_id": "usr_test",
          "part1_id": "part1_test",
          "part2_id": "part2_test",
          "kind": "constellation",
          "status": "running",
          "current_stage": "constellation",
          "progress": 0.18,
          "stage_progress": 0.02,
          "progress_basis": "server_stage_elapsed",
          "message": "云端正在生成精神星图。",
          "can_resume_in_background": true,
          "created_at": "2026-05-13T00:01:00.000Z",
          "updated_at": "2026-05-13T00:01:01.000Z"
        }
        """.data(using: .utf8)!

        let first = try JSONDecoder.benyuan.decode(BenyuanNativeGenerationJobResponse.self, from: firstPayload)
        let sameJobLower = try JSONDecoder.benyuan.decode(BenyuanNativeGenerationJobResponse.self, from: sameJobLowerPayload)
        let nextJob = try JSONDecoder.benyuan.decode(BenyuanNativeGenerationJobResponse.self, from: nextJobPayload)

        model.applyNativeGenerationJob(first, source: .live)
        XCTAssertEqual(model.processingProgress, 0.52, accuracy: 0.001)

        model.applyNativeGenerationJob(sameJobLower, source: .live)
        XCTAssertEqual(model.processingProgress, 0.52, accuracy: 0.001)

        model.applyNativeGenerationJob(nextJob, source: .live)
        XCTAssertEqual(model.processingProgress, 0.18, accuracy: 0.001)
    }

    func testAPIClientServerErrorIncludesHTTPStatusAndBodyPreview() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [BenyuanMockURLProtocol.self]
        let client = BenyuanAPIClient(
            baseURL: URL(string: "http://native-error.test")!,
            session: URLSession(configuration: config)
        )
        defer { BenyuanMockURLProtocol.handler = nil }

        BenyuanMockURLProtocol.handler = { request in
            XCTAssertEqual(request.url?.path, "/api/part1/schema")
            return BenyuanMockURLProtocol.json(502, "upstream theater worker returned an empty response")
        }

        do {
            _ = try await client.fetchSchema()
            XCTFail("Expected server error")
        } catch let error as BenyuanAPIError {
            XCTAssertEqual(error, .server(status: 502, message: "upstream theater worker returned an empty response"))
            XCTAssertEqual(error.errorDescription, "请求失败（HTTP 502）：upstream theater worker returned an empty response")
        }
    }

    func testAPIClientServerErrorCombinesErrorCodeAndDetail() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [BenyuanMockURLProtocol.self]
        let client = BenyuanAPIClient(
            baseURL: URL(string: "http://native-error-detail.test")!,
            session: URLSession(configuration: config)
        )
        defer { BenyuanMockURLProtocol.handler = nil }

        BenyuanMockURLProtocol.handler = { _ in
            BenyuanMockURLProtocol.json(500, #"{ "error": "agent_generation_failed", "detail": "Cannot read properties of undefined (reading 'choices')" }"#)
        }

        do {
            _ = try await client.fetchSchema()
            XCTFail("Expected server error")
        } catch let error as BenyuanAPIError {
            XCTAssertEqual(error.errorDescription, "请求失败（HTTP 500）：agent_generation_failed: Cannot read properties of undefined (reading 'choices')")
        }
    }

    func testAPIClientSuppressesHTMLNotFoundBodies() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [BenyuanMockURLProtocol.self]
        let client = BenyuanAPIClient(
            baseURL: URL(string: "http://native-html-error.test")!,
            session: URLSession(configuration: config)
        )
        defer { BenyuanMockURLProtocol.handler = nil }

        BenyuanMockURLProtocol.handler = { _ in
            BenyuanMockURLProtocol.html(404, "<!DOCTYPE html><html><head><title>not found</title></head><body>很长的网页错误</body></html>")
        }

        do {
            _ = try await client.fetchSchema()
            XCTFail("Expected server error")
        } catch let error as BenyuanAPIError {
            XCTAssertEqual(error, .server(status: 404, message: "html_not_found"))
            XCTAssertEqual(error.errorDescription, "这份历史档案还没有同步到当前服务器，请先刷新或重新生成。")
        }
    }

    func testAPIClientSubmitsFeedbackWithAuthAndFlowContext() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [BenyuanMockURLProtocol.self]
        let client = BenyuanAPIClient(
            baseURL: URL(string: "http://native-feedback.test")!,
            session: URLSession(configuration: config)
        )
        client.setAuthSession(BenyuanAuthSession(
            sessionId: "auth_test",
            userId: "usr_test",
            token: "bya_anonymous_test",
            provider: .anonymous,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z"
        ))
        defer { BenyuanMockURLProtocol.handler = nil }

        BenyuanMockURLProtocol.handler = { request in
            XCTAssertEqual(request.url?.path, "/api/account/feedback")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer bya_anonymous_test")
            let body = try JSONDecoder.benyuan.decode([String: BenyuanJSONValue].self, from: request.benyuanHTTPBodyData)
            XCTAssertEqual(body["kind"]?.stringValue, "issue")
            XCTAssertEqual(body["message"]?.stringValue, "星图页按钮有遮挡")
            XCTAssertEqual(body["stage"]?.stringValue, "constellation")
            XCTAssertEqual(body["part1_id"]?.stringValue, "part1_test")
            XCTAssertEqual(body["theater_script_id"]?.stringValue, "theater_test")
            XCTAssertEqual(body["part2_id"]?.stringValue, "part2_test")
            XCTAssertEqual(body["constellation_id"]?.stringValue, "const_test")
            return BenyuanMockURLProtocol.json(200, """
            {
              "ok": true,
              "feedback_id": "feedback_test",
              "created_at": "2026-05-10T00:00:00.000Z"
            }
            """)
        }

        let response = try await client.submitFeedback(
            kind: .issue,
            message: "星图页按钮有遮挡",
            stage: .constellation,
            session: BenyuanNativeSession(
                authSession: nil,
                user: nil,
                part1Id: "part1_test",
                theaterScriptId: "theater_test",
                part2Id: "part2_test",
                constellationId: "const_test",
                activeGenerationJobId: nil,
                answers: [:],
                uploadedAssets: [:],
                phaseDurations: [:]
            )
        )

        XCTAssertEqual(response.feedbackId, "feedback_test")
    }

    @MainActor
    func testFeedbackSubmitRequiresActionableMessage() async throws {
        let client = BenyuanAPIClient(baseURL: URL(string: "http://native-feedback-validation.test")!)
        let model = BenyuanNativeFlowModel(client: client)

        model.showFeedbackComposer()
        model.feedbackDraft = " 卡 "

        await model.submitFeedback()

        XCTAssertTrue(model.isFeedbackComposerPresented)
        XCTAssertEqual(model.feedbackDraft, " 卡 ")
        XCTAssertEqual(model.feedbackStatus, "待填写：至少写 4 个字，方便定位问题。")
        XCTAssertFalse(model.canSubmitFeedback)
    }

    @MainActor
    func testFeedbackSuccessKeepsComposerOpenWithArchivedState() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [BenyuanMockURLProtocol.self]
        let client = BenyuanAPIClient(
            baseURL: URL(string: "http://native-feedback-success.test")!,
            session: URLSession(configuration: config)
        )
        defer { BenyuanMockURLProtocol.handler = nil }
        let model = BenyuanNativeFlowModel(client: client)
        model.showFeedbackComposer()
        model.feedbackDraft = "按钮挡住文字"

        BenyuanMockURLProtocol.handler = { _ in
            BenyuanMockURLProtocol.json(200, """
            {
              "ok": true,
              "feedback_id": "feedback_archived",
              "created_at": "2026-05-11T00:00:00.000Z"
            }
            """)
        }

        await model.submitFeedback()

        XCTAssertTrue(model.isFeedbackComposerPresented)
        XCTAssertEqual(model.feedbackDraft, "")
        XCTAssertEqual(model.feedbackStatus, "已收到编号：feedback_archived")
        XCTAssertEqual(model.toast, "问题已收到。")
        XCTAssertFalse(model.canSubmitFeedback)
    }

    func testAPIClientUsesLongTimeoutForConstellationGeneration() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [BenyuanMockURLProtocol.self]
        let client = BenyuanAPIClient(
            baseURL: URL(string: "http://native-timeout.test")!,
            session: URLSession(configuration: config)
        )
        var capturedTimeout: TimeInterval?
        defer { BenyuanMockURLProtocol.handler = nil }

        BenyuanMockURLProtocol.handler = { request in
            if request.url?.path == "/api/constellation/generate" {
                capturedTimeout = request.timeoutInterval
                return BenyuanMockURLProtocol.json(200, """
                {
                  "constellation_id": "const_timeout",
                  "runtime": {
                    "provider_name": "xiaoye",
                    "model": "gpt-5.5",
                    "mode": "live",
                    "source": "api",
                    "fallback_active": false
                  },
                  "psyche_constellation": {
                    "user_id": "usr_timeout",
                    "generated_at": "2026-05-09T00:00:00.000Z",
                    "archetype": {
                      "name": "深月观测者",
                      "english_name": "Deep Lunar Witness",
                      "core_essence": "长请求需要被完整接住。",
                      "visual_prompt": "deep lunar field"
                    },
                    "seven_dimensions": {
                      "openness": { "score": 80, "interpretation": "ok" }
                    },
                    "narrative_overview": "ok",
                    "core_tensions": [],
                    "growth_suggestions": [],
                    "recommendations": {
                      "books": [],
                      "films": [],
                      "music": []
                    }
                  }
                }
                """)
            }
            return BenyuanMockURLProtocol.json(500, #"{ "error": "unexpected_request" }"#)
        }

        _ = try await client.generateConstellation(part1Id: "part1_timeout", part2Id: "part2_timeout")

        XCTAssertGreaterThanOrEqual(capturedTimeout ?? 0, 180)
    }

    func testPhoneCodeResponseDecodesFixtureCode() throws {
        let data = """
        {
          "phone": "+8613800138000",
          "expires_at": "2026-05-08T00:10:00.000Z",
          "fixture_code": "246810"
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder.benyuan.decode(BenyuanPhoneCodeResponse.self, from: data)

        XCTAssertEqual(response.phone, "+8613800138000")
        XCTAssertEqual(response.fixtureCode, "246810")
    }

    func testAuthProvidersDecodeReservedPhoneStatus() throws {
        let data = """
        {
          "providers": [
            { "provider": "apple", "enabled": true, "status": "ready", "actions": ["login"] },
            { "provider": "phone", "enabled": false, "status": "reserved", "actions": ["login", "bind_phone"] }
          ],
          "capabilities": ["guest_login", "apple_login", "bind_phone"]
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder.benyuan.decode(BenyuanAuthProvidersResponse.self, from: data)

        XCTAssertEqual(response.providers.first { $0.provider == .phone }?.status, .reserved)
        XCTAssertEqual(response.providers.first { $0.provider == .phone }?.enabled, false)
        XCTAssertTrue(response.capabilities.contains("bind_phone"))
    }

    func testAPIErrorMapsSmsProviderNotConfiguredToProductCopy() throws {
        let error = BenyuanAPIError.server(status: 503, message: "sms_provider_not_configured")

        XCTAssertEqual(error.errorDescription, "手机号登录还在接入短信网关，请先用 Apple 或访客进入。")
    }

    func testAppleAuthorizationCancelDoesNotExposeSystemError() throws {
        let error = NSError(domain: ASAuthorizationError.errorDomain, code: ASAuthorizationError.Code.canceled.rawValue)

        XCTAssertNil(BenyuanAppleAuthorizationCopy.toastMessage(for: error))
    }

    func testAppleAuthorizationFailureUsesProductCopy() throws {
        let error = NSError(domain: ASAuthorizationError.errorDomain, code: ASAuthorizationError.Code.failed.rawValue)

        XCTAssertEqual(BenyuanAppleAuthorizationCopy.toastMessage(for: error), "Apple 登录暂时没有连上，可以先以访客进入。")
    }

    func testAccountResponseDecodesBindingStatus() throws {
        let data = """
        {
          "user": {
            "user_id": "usr_test",
            "created_at": "2026-05-08T00:00:00.000Z",
            "updated_at": "2026-05-08T00:00:00.000Z",
            "display_name": "访客",
            "primary_provider": "anonymous",
            "providers": {
              "anonymous": "anonymous:test",
              "wechat": "wechat:test"
            },
            "phone_bound": false,
            "wechat_bound": true
          },
          "session": {
            "session_id": "auth_test",
            "user_id": "usr_test",
            "token": "bya_anonymous_test",
            "provider": "anonymous",
            "created_at": "2026-05-08T00:00:00.000Z",
            "updated_at": "2026-05-08T00:00:00.000Z"
          }
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder.benyuan.decode(BenyuanAuthResponse.self, from: data)

        XCTAssertEqual(response.user.userId, "usr_test")
        XCTAssertEqual(response.user.wechatBound, true)
        XCTAssertEqual(response.user.phoneBound, false)
    }

    func testAccountHistoryResponseDecodesExplorationState() throws {
        let data = """
        {
          "items": [
            {
              "part1_id": "part1_test",
              "theater_script_id": "theater_test",
              "part2_id": "part2_test",
              "constellation_id": "const_test",
              "stage": "constellation",
              "title": "夜航的月相档案",
              "subtitle": "影像线索 2 个 / 剧场已完成",
              "archetype_name": "月下观察者",
              "created_at": "2026-05-08T00:00:00.000Z",
              "updated_at": "2026-05-08T00:05:00.000Z",
              "asset_count": 2
            }
          ]
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder.benyuan.decode(BenyuanAccountHistoryResponse.self, from: data)

        XCTAssertEqual(response.items.count, 1)
        XCTAssertEqual(response.items[0].part1Id, "part1_test")
        XCTAssertEqual(response.items[0].stage, .constellation)
        XCTAssertEqual(response.items[0].archetypeName, "月下观察者")
        XCTAssertEqual(response.items[0].assetCount, 2)
    }

    func testConstellationRecordResponseBuildsGeneratePayloadForHistoryRestore() throws {
        let data = """
        {
          "constellation": {
            "user_id": "usr_test",
            "generated_at": "2026-05-08T00:10:00.000Z",
            "archetype": {
              "name": "月下观察者",
              "english_name": "Lunar Witness",
              "core_essence": "在退潮处辨认自己的真实愿望。",
              "visual_prompt": "deep moon field"
            },
            "seven_dimensions": {
              "openness": { "score": 82, "interpretation": "以隐喻进入世界。" }
            },
            "narrative_overview": "你把孤独改写成一种观察力。",
            "core_tensions": [
              {
                "tension_id": 1,
                "name": "亲密与撤退",
                "description": "想被看见，也想保留暗面。",
                "growth_direction": "练习在关系中表达边界。"
              }
            ],
            "growth_suggestions": [
              {
                "title": "写一封不寄出的信",
                "description": "把无法说出的部分放到纸面上。",
                "actionable_steps": ["今晚写下三个真实句子"]
              }
            ],
            "recommendations": {
              "books": [{ "title": "月亮与六便士", "author": "毛姆", "reason": "关于执念与自我神话。" }],
              "films": [{ "title": "花样年华", "director": "王家卫", "reason": "关于克制和错身。" }],
              "music": [{ "artist": "坂本龙一", "album": "async", "reason": "像一场缓慢的内在回声。" }]
            }
          },
          "runtime": {
            "provider_name": "fixture",
            "model": "fixture",
            "mode": "fallback",
            "source": "test",
            "fallback_active": true
          },
          "archetype_image_url": "/generated/test.png",
          "created_at": "2026-05-08T00:10:00.000Z"
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder.benyuan.decode(BenyuanConstellationRecordResponse.self, from: data)
        let generate = response.generateResponse(constellationId: "const_test")

        XCTAssertEqual(response.archetypeImageUrl, "/generated/test.png")
        XCTAssertEqual(generate.constellationId, "const_test")
        XCTAssertEqual(generate.psycheConstellation.archetype.name, "月下观察者")
    }

    func testPart1HistoryRecordDecodesSavedAnswersAndUploadedAssets() throws {
        let data = """
        {
          "part1_id": "part1_draft",
          "user_id": "usr_test",
          "created_at": "2026-05-08T00:00:00.000Z",
          "updated_at": "2026-05-08T00:05:00.000Z",
          "answers": {
            "A1_core_image": "A1_2",
            "B4_time_philosophy": { "past": 42, "present": 34, "future": 24 },
            "C2_precious_photo_analysis": [
              {
                "asset_id": "asset_photo",
                "question_id": "C2_precious_photo_analysis",
                "name": "moon.jpg",
                "size": 2048,
                "mime_type": "image/jpeg",
                "uploaded_at": "2026-05-08T00:03:00.000Z",
                "upload_origin": "native-library"
              }
            ]
          }
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder.benyuan.decode(BenyuanPart1HistoryRecordResponse.self, from: data)

        XCTAssertEqual(response.part1Id, "part1_draft")
        XCTAssertEqual(response.answers["A1_core_image"]?.stringValue, "A1_2")
        XCTAssertEqual(response.uploadedAssets["C2_precious_photo_analysis"]?.map(\.assetId), ["asset_photo"])
    }

    func testPart2HistoryRecordDecodesSavedTheaterChoices() throws {
        let data = """
        {
          "part2_id": "part2_replay",
          "part1_id": "part1_replay",
          "theater_script_id": "theater_replay",
          "created_at": "2026-05-08T00:20:00.000Z",
          "act2_choices": [
            { "choice_id": 1, "selected": "open_now", "hesitation_time": 1.2, "hover_sequence": ["open_now"], "timestamp": "2026-05-08T00:11:00.000Z" },
            { "choice_id": 2, "selected": "silent_light", "hesitation_time": 2.4, "hover_sequence": [], "timestamp": "2026-05-08T00:12:00.000Z" }
          ],
          "act3_responses": [
            { "question_id": 1, "selected": "name_boundary", "hesitation_time": 3.1, "timestamp": "2026-05-08T00:13:00.000Z" }
          ],
          "metadata": {
            "phase_durations": { "act1": 4.0, "act2": 8.0, "act3": 5.0 }
          }
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder.benyuan.decode(BenyuanPart2HistoryRecordResponse.self, from: data)

        XCTAssertEqual(response.part2Id, "part2_replay")
        XCTAssertEqual(response.act2Choices.map(\.selected), ["open_now", "silent_light"])
        XCTAssertEqual(response.act3Responses.map(\.selected), ["name_boundary"])
        XCTAssertEqual(response.metadata["phase_durations"]?.objectValue?["act2"]?.intValue, 8)
    }

    @MainActor
    func testWechatAuthClientRequiresRealOpenPlatformConfig() throws {
        let client = BenyuanWechatAuthClient.shared

        client.configure(appID: "", universalLink: "")

        XCTAssertEqual(client.authState, .unavailable("微信开放平台尚未配置。"))
        XCTAssertFalse(client.isConfigured)
    }

    @MainActor
    func testRestartKeepsAuthSessionAndReturnsToCollect() throws {
        let suiteName = "benyuan-restart-auth-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let store = BenyuanFlowStore(defaults: defaults)
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient(), store: store)
        let authSession = BenyuanAuthSession(
            sessionId: "auth_test",
            userId: "usr_test",
            token: "bya_anonymous_test",
            provider: .anonymous,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z"
        )
        let user = BenyuanUser(
            userId: "usr_test",
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z",
            displayName: "访客",
            primaryProvider: .anonymous,
            providers: ["anonymous": "anonymous:test"],
            phoneBound: false,
            wechatBound: false
        )
        model.session.authSession = authSession
        model.session.user = user
        model.session.answers["A1_core_image"] = .string("A1-1")

        model.restart()

        XCTAssertEqual(model.session.authSession, authSession)
        XCTAssertEqual(model.session.user, user)
        XCTAssertNil(model.session.answers["A1_core_image"])
        XCTAssertEqual(model.stage, .collect)
    }

    @MainActor
    func testShowAccountAndLogoutClearLocalSession() throws {
        let suiteName = "benyuan-account-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { defaults.removePersistentDomain(forName: suiteName) }
        let store = BenyuanFlowStore(defaults: defaults)
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient(), store: store)
        model.session.authSession = BenyuanAuthSession(
            sessionId: "auth_test",
            userId: "usr_test",
            token: "bya_anonymous_test",
            provider: .anonymous,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z"
        )
        model.session.user = BenyuanUser(
            userId: "usr_test",
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z",
            displayName: "访客",
            primaryProvider: .anonymous,
            providers: ["anonymous": "anonymous:test"],
            phoneBound: false,
            wechatBound: false
        )

        model.showAccount()

        XCTAssertEqual(model.stage, .account)

        model.clearLocalAuthAfterLogout()

        XCTAssertNil(model.session.authSession)
        XCTAssertNil(model.session.user)
        XCTAssertEqual(model.stage, .auth)
        XCTAssertNil(store.load().authSession)
    }

    @MainActor
    func testAccountReturnRestoresPreviousNativeRoute() throws {
        let store = BenyuanFlowStore(defaults: UserDefaults(suiteName: "benyuan-account-return-\(UUID().uuidString)")!)
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient(), store: store)

        model.session.authSession = BenyuanAuthSession(
            sessionId: "auth_test",
            userId: "usr_test",
            token: "bya_anonymous_test",
            provider: .anonymous,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z"
        )
        model.stage = .constellation

        model.showAccount()
        XCTAssertEqual(model.stage, .account)

        model.returnToFlow()
        XCTAssertEqual(model.stage, .constellation)
    }

    @MainActor
    func testOpenHistoryItemRestoresNativeRouteContext() throws {
        let store = BenyuanFlowStore(defaults: UserDefaults(suiteName: "benyuan-history-open-\(UUID().uuidString)")!)
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient(), store: store)
        let item = BenyuanAccountHistoryItem(
            part1Id: "part1_test",
            theaterScriptId: "theater_test",
            part2Id: "part2_test",
            constellationId: "const_test",
            stage: .constellation,
            title: "夜航的月相档案",
            subtitle: "影像线索 2 个 / 剧场已完成",
            archetypeName: "月下观察者",
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:05:00.000Z",
            assetCount: 2
        )

        model.openHistoryItem(item)

        XCTAssertEqual(model.session.part1Id, "part1_test")
        XCTAssertEqual(model.session.theaterScriptId, "theater_test")
        XCTAssertEqual(model.session.part2Id, "part2_test")
        XCTAssertEqual(model.session.constellationId, "const_test")
        XCTAssertEqual(model.stage, .processing)
        XCTAssertEqual(model.restoringHistoryPart1Id, "part1_test")
    }

    @MainActor
    func testLoadPart1HistoryItemRestoresSavedDraftAnswersAndAssets() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [BenyuanMockURLProtocol.self]
        let client = BenyuanAPIClient(
            baseURL: URL(string: "http://native-history.test")!,
            session: URLSession(configuration: config)
        )
        let suiteName = "benyuan-history-part1-restore-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
            BenyuanMockURLProtocol.handler = nil
        }
        let model = BenyuanNativeFlowModel(client: client, store: BenyuanFlowStore(defaults: defaults))
        let item = BenyuanAccountHistoryItem(
            part1Id: "part1_draft",
            theaterScriptId: nil,
            part2Id: nil,
            constellationId: nil,
            stage: .part1,
            title: "未完成的月相",
            subtitle: "影像线索 1 个 / 收集中",
            archetypeName: nil,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:05:00.000Z",
            assetCount: 1
        )

        model.isFeedbackComposerPresented = true
        model.feedbackDraft = "残留弹层"
        model.showBindingInfo(.apple)
        model.requestDeleteHistoryItem(item)

        BenyuanMockURLProtocol.handler = { request in
            let path = request.url?.path ?? ""
            if request.httpMethod == "GET", path == "/api/part1/schema" {
                return BenyuanMockURLProtocol.json(200, """
                {
                  "questions": [
                    {
                      "id": "A1_core_image",
                      "module": "A",
                      "title": "A1",
                      "prompt": "你会先被哪一种画面牵引？",
                      "kind": "single",
                      "outputKey": "A1_core_image",
                      "options": [{ "id": "A1_2", "text": "月下的门" }]
                    },
                    {
                      "id": "C2_precious_photo_analysis",
                      "module": "C",
                      "title": "C2",
                      "prompt": "放入一张仍在发光的照片。",
                      "kind": "upload",
                      "outputKey": "C2_precious_photo_analysis",
                      "uploadRange": { "min": 1, "max": 3 }
                    }
                  ],
                  "modules": {}
                }
                """)
            }
            if request.httpMethod == "GET", path == "/api/account/history/part1_draft/part1" {
                return BenyuanMockURLProtocol.json(200, """
                {
                  "part1_id": "part1_draft",
                  "user_id": "usr_test",
                  "created_at": "2026-05-08T00:00:00.000Z",
                  "updated_at": "2026-05-08T00:05:00.000Z",
                  "answers": {
                    "A1_core_image": "A1_2",
                    "C2_precious_photo_analysis": [
                      {
                        "asset_id": "asset_photo",
                        "question_id": "C2_precious_photo_analysis",
                        "name": "moon.jpg",
                        "size": 2048,
                        "mime_type": "image/jpeg",
                        "uploaded_at": "2026-05-08T00:03:00.000Z",
                        "upload_origin": "native-library"
                      }
                    ]
                  }
                }
                """)
            }
            return BenyuanMockURLProtocol.json(500, #"{ "error": "unexpected_request" }"#)
        }

        await model.loadHistoryItem(item)

        XCTAssertEqual(model.stage, .collect)
        XCTAssertEqual(model.session.part1Id, "part1_draft")
        XCTAssertEqual(model.session.answers["A1_core_image"]?.stringValue, "A1_2")
        XCTAssertEqual(model.uploadedAssets(for: "C2_precious_photo_analysis").map(\.assetId), ["asset_photo"])
        XCTAssertEqual(model.activeQuestionIndex, 0)
        XCTAssertNil(model.restoringHistoryPart1Id)
        XCTAssertFalse(model.isFeedbackComposerPresented)
        XCTAssertNil(model.activeBindingProvider)
        XCTAssertFalse(model.isDeleteHistoryConfirmationPresented)
    }

    @MainActor
    func testLoadCompletedTheaterHistoryRestoresPart2ReplayProgress() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [BenyuanMockURLProtocol.self]
        let client = BenyuanAPIClient(
            baseURL: URL(string: "http://native-history.test")!,
            session: URLSession(configuration: config)
        )
        let suiteName = "benyuan-history-part2-restore-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
            BenyuanMockURLProtocol.handler = nil
        }
        let model = BenyuanNativeFlowModel(client: client, store: BenyuanFlowStore(defaults: defaults))
        let item = BenyuanAccountHistoryItem(
            part1Id: "part1_replay",
            theaterScriptId: "theater_replay",
            part2Id: "part2_replay",
            constellationId: nil,
            stage: .part2,
            title: "剧场完成的月相",
            subtitle: "影像线索 1 个 / 剧场已完成",
            archetypeName: nil,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:20:00.000Z",
            assetCount: 1
        )

        BenyuanMockURLProtocol.handler = { request in
            let path = request.url?.path ?? ""
            if request.httpMethod == "GET", path == "/api/theater/theater_replay" {
                return BenyuanMockURLProtocol.json(200, Self.theaterRecordFixture(
                    theaterScriptId: "theater_replay",
                    part1Id: "part1_replay"
                ))
            }
            if request.httpMethod == "GET", path == "/api/account/history/part1_replay/part2" {
                return BenyuanMockURLProtocol.json(200, """
                {
                  "part2_id": "part2_replay",
                  "part1_id": "part1_replay",
                  "theater_script_id": "theater_replay",
                  "created_at": "2026-05-08T00:20:00.000Z",
                  "act2_choices": [
                    { "choice_id": 1, "selected": "open_now", "hesitation_time": 1.2, "hover_sequence": ["open_now"], "timestamp": "2026-05-08T00:11:00.000Z" },
                    { "choice_id": 2, "selected": "silent_light", "hesitation_time": 2.4, "hover_sequence": [], "timestamp": "2026-05-08T00:12:00.000Z" }
                  ],
                  "act3_responses": [
                    { "question_id": 1, "selected": "name_boundary", "hesitation_time": 3.1, "timestamp": "2026-05-08T00:13:00.000Z" }
                  ],
                  "metadata": {
                    "phase_durations": { "act1": 4.0, "act2": 8.0, "act3": 5.0 }
                  }
                }
                """)
            }
            return BenyuanMockURLProtocol.json(500, #"{ "error": "unexpected_request" }"#)
        }

        await model.loadHistoryItem(item)

        XCTAssertEqual(model.stage, .theater)
        XCTAssertEqual(model.session.part2Id, "part2_replay")
        XCTAssertEqual(model.theaterPhase, .epilogue)
        XCTAssertEqual(model.theaterChoiceIndex, 1)
        XCTAssertEqual(model.theaterMirrorIndex, 0)
        XCTAssertEqual(model.choiceLogCount, 2)
        XCTAssertEqual(model.mirrorLogCount, 1)
        XCTAssertEqual(model.session.phaseDurations["act2"], 8)
        XCTAssertNil(model.restoringHistoryPart1Id)
    }

    @MainActor
    func testLoadConstellationHistoryRestoresPart2ContextBeforeShowingResult() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [BenyuanMockURLProtocol.self]
        let client = BenyuanAPIClient(
            baseURL: URL(string: "http://native-history.test")!,
            session: URLSession(configuration: config)
        )
        let suiteName = "benyuan-history-constellation-restore-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
            BenyuanMockURLProtocol.handler = nil
        }
        let model = BenyuanNativeFlowModel(client: client, store: BenyuanFlowStore(defaults: defaults))
        let item = BenyuanAccountHistoryItem(
            part1Id: "part1_constellation",
            theaterScriptId: "theater_constellation",
            part2Id: "part2_constellation",
            constellationId: "constellation_history",
            stage: .constellation,
            title: "深月观测者的本源档案",
            subtitle: "影像线索 1 个 / 星图已生成",
            archetypeName: "深月观测者",
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:30:00.000Z",
            assetCount: 1
        )

        BenyuanMockURLProtocol.handler = { request in
            let path = request.url?.path ?? ""
            if request.httpMethod == "GET", path == "/api/theater/theater_constellation" {
                return BenyuanMockURLProtocol.json(200, Self.theaterRecordFixture(
                    theaterScriptId: "theater_constellation",
                    part1Id: "part1_constellation"
                ))
            }
            if request.httpMethod == "GET", path == "/api/account/history/part1_constellation/part2" {
                XCTAssertEqual(request.url?.query, "part2_id=part2_constellation")
                return BenyuanMockURLProtocol.json(200, Self.part2RecordFixture(
                    part2Id: "part2_constellation",
                    part1Id: "part1_constellation",
                    theaterScriptId: "theater_constellation"
                ))
            }
            if request.httpMethod == "GET", path == "/api/constellation/constellation_history" {
                return BenyuanMockURLProtocol.json(200, Self.constellationRecordFixture())
            }
            return BenyuanMockURLProtocol.json(500, #"{ "error": "unexpected_request" }"#)
        }

        await model.loadHistoryItem(item)

        XCTAssertEqual(model.stage, .constellation)
        XCTAssertEqual(model.session.part1Id, "part1_constellation")
        XCTAssertEqual(model.session.part2Id, "part2_constellation")
        XCTAssertEqual(model.session.theaterScriptId, "theater_constellation")
        XCTAssertEqual(model.session.constellationId, "constellation_history")
        XCTAssertEqual(model.theaterPhase, .epilogue)
        XCTAssertEqual(model.choiceLogCount, 2)
        XCTAssertEqual(model.mirrorLogCount, 1)
        XCTAssertEqual(model.session.phaseDurations["act3"], 5)
        XCTAssertEqual(model.constellation?.psycheConstellation.archetype.name, "深月观测者")
        XCTAssertNil(model.restoringHistoryPart1Id)
    }

    @MainActor
    func testLoadConstellationHistoryToleratesMissingPart2HistoryRoute() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [BenyuanMockURLProtocol.self]
        let client = BenyuanAPIClient(
            baseURL: URL(string: "http://native-history.test")!,
            session: URLSession(configuration: config)
        )
        let suiteName = "benyuan-history-constellation-part2-missing-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
            BenyuanMockURLProtocol.handler = nil
        }
        let model = BenyuanNativeFlowModel(client: client, store: BenyuanFlowStore(defaults: defaults))
        let item = BenyuanAccountHistoryItem(
            part1Id: "part1_constellation",
            theaterScriptId: "theater_constellation",
            part2Id: "part2_constellation",
            constellationId: "constellation_history",
            stage: .constellation,
            title: "暮海守光者的本源档案",
            subtitle: "影像线索 3 个 / 星图已生成",
            archetypeName: "暮海守光者",
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:25:00.000Z",
            assetCount: 3
        )

        BenyuanMockURLProtocol.handler = { request in
            let path = request.url?.path ?? ""
            if request.httpMethod == "GET", path == "/api/theater/theater_constellation" {
                return BenyuanMockURLProtocol.json(200, Self.theaterRecordFixture(
                    theaterScriptId: "theater_constellation",
                    part1Id: "part1_constellation"
                ))
            }
            if request.httpMethod == "GET", path == "/api/account/history/part1_constellation/part2" {
                return BenyuanMockURLProtocol.html(404, "<!DOCTYPE html><html><head></head><body>not found</body></html>")
            }
            if request.httpMethod == "GET", path == "/api/constellation/constellation_history" {
                return BenyuanMockURLProtocol.json(200, Self.constellationRecordFixture())
            }
            return BenyuanMockURLProtocol.json(500, #"{ "error": "unexpected_request" }"#)
        }

        await model.loadHistoryItem(item)

        XCTAssertEqual(model.stage, .constellation)
        XCTAssertEqual(model.session.part1Id, "part1_constellation")
        XCTAssertEqual(model.session.part2Id, "part2_constellation")
        XCTAssertEqual(model.session.constellationId, "constellation_history")
        XCTAssertEqual(model.constellation?.psycheConstellation.archetype.name, "深月观测者")
        XCTAssertNil(model.restoringHistoryPart1Id)
    }

    @MainActor
    func testAccountInteractionStateTracksDeleteConfirmationAndBindingSheet() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())
        let item = BenyuanAccountHistoryItem(
            part1Id: "part1_delete",
            theaterScriptId: nil,
            part2Id: nil,
            constellationId: nil,
            stage: .part1,
            title: "未完成的月相",
            subtitle: "影像线索 0 个 / 尚未进入剧场",
            archetypeName: nil,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:05:00.000Z",
            assetCount: 0
        )

        model.requestDeleteHistoryItem(item)
        XCTAssertEqual(model.pendingDeleteHistoryItem?.part1Id, "part1_delete")
        XCTAssertTrue(model.isDeleteHistoryConfirmationPresented)

        model.cancelDeleteHistoryItem()
        XCTAssertNil(model.pendingDeleteHistoryItem)
        XCTAssertFalse(model.isDeleteHistoryConfirmationPresented)

        model.showBindingInfo(.wechat)
        XCTAssertEqual(model.activeBindingProvider, .wechat)
    }

    func testNativeRuntimeOverrideDoesNotHardcodeProviderDefaults() throws {
        let runtime = try AgentRuntimeOverride().benyuanJSONValue()

        XCTAssertEqual(runtime, .object([:]))
    }

    func testNativePreviewStageParsesLaunchArgument() throws {
        XCTAssertEqual(
            BenyuanShellConfig.nativePreviewStage(arguments: ["Benyuan", "--benyuan-native-preview", "auth"]),
            .auth
        )
        XCTAssertEqual(
            BenyuanShellConfig.nativePreviewStage(arguments: ["Benyuan", "--benyuan-native-preview", "account"]),
            .account
        )
        XCTAssertEqual(
            BenyuanShellConfig.nativePreviewStage(arguments: ["Benyuan", "--benyuan-native-preview", "account-feedback"]),
            .accountFeedback
        )
        XCTAssertEqual(
            BenyuanShellConfig.nativePreviewStage(arguments: ["Benyuan", "--benyuan-native-preview", "collect"]),
            .collect
        )
        XCTAssertEqual(
            BenyuanShellConfig.nativePreviewStage(arguments: ["Benyuan", "--benyuan-native-preview", "upload"]),
            .upload
        )
        XCTAssertEqual(
            BenyuanShellConfig.nativePreviewStage(arguments: ["Benyuan", "--benyuan-native-preview", "processing"]),
            .processing
        )
        XCTAssertEqual(
            BenyuanShellConfig.nativePreviewStage(arguments: ["Benyuan", "--benyuan-native-preview", "theater"]),
            .theater
        )
        XCTAssertEqual(
            BenyuanShellConfig.nativePreviewStage(arguments: ["Benyuan", "--benyuan-native-preview", "constellation"]),
            .constellation
        )
        XCTAssertEqual(
            BenyuanShellConfig.nativePreviewStage(arguments: ["Benyuan", "--benyuan-native-preview", "constellation-end"]),
            .constellationEnd
        )
        XCTAssertNil(BenyuanShellConfig.nativePreviewStage(arguments: ["Benyuan", "--benyuan-native-preview", "unknown"]))
    }

    func testNativeE2EAutorunParsesLaunchArgument() throws {
        XCTAssertTrue(BenyuanShellConfig.nativeE2EAutorun(arguments: ["Benyuan", "--benyuan-native-e2e-autorun"]))
        XCTAssertTrue(BenyuanShellConfig.nativeE2EAutorun(arguments: ["Benyuan", "--benyuan-native-e2e-autorun", "1"]))
        XCTAssertFalse(BenyuanShellConfig.nativeE2EAutorun(arguments: ["Benyuan"]))
    }

    func testNativeE2EDiagnosticsParsesLaunchArgument() throws {
        XCTAssertTrue(BenyuanShellConfig.nativeE2EDiagnostics(arguments: ["Benyuan", "--benyuan-native-e2e-diagnostics"]))
        XCTAssertFalse(BenyuanShellConfig.nativeE2EDiagnostics(arguments: ["Benyuan"]))
    }

    @MainActor
    func testNativePreviewAuthSeedsLoginScreenState() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())

        model.applyNativePreview(.auth)

        XCTAssertEqual(model.stage, .auth)
        XCTAssertEqual(model.authProviders?.provider(.anonymous)?.status, .ready)
        XCTAssertEqual(model.authProviders?.provider(.apple)?.status, .ready)
        XCTAssertEqual(model.authProviders?.provider(.wechat)?.status, .reserved)
        XCTAssertTrue(model.authProviders?.capabilities.contains("guest_login") == true)
    }

    @MainActor
    func testNativePreviewAccountSeedsUserBindingsAndHistory() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())

        model.applyNativePreview(.account)

        XCTAssertEqual(model.stage, .account)
        XCTAssertEqual(model.session.user?.displayName, "本源预览用户")
        XCTAssertEqual(model.accountHistory.count, 3)
        XCTAssertTrue(model.accountHistory.contains { $0.stage == .constellation })
        XCTAssertTrue(model.accountHistory.contains { $0.stage == .theater })
        XCTAssertTrue(model.accountHistory.contains { $0.stage == .part1 })
        XCTAssertEqual(model.accountHistory.first?.assetCount, 3)
    }

    @MainActor
    func testNativePreviewAccountFeedbackOpensComposer() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())

        model.applyNativePreview(.accountFeedback)

        XCTAssertEqual(model.stage, .account)
        XCTAssertTrue(model.isFeedbackComposerPresented)
        XCTAssertEqual(model.feedbackKind, .issue)
        XCTAssertTrue(model.feedbackDraft.contains("底部按钮"))
    }

    @MainActor
    func testNativePreviewCollectSeedsQuestionProgress() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())

        model.applyNativePreview(.collect)

        XCTAssertEqual(model.stage, .collect)
        XCTAssertGreaterThanOrEqual(model.questions.count, 3)
        XCTAssertEqual(model.currentQuestion?.id, "B4_time_philosophy")
        XCTAssertGreaterThan(model.progress, 0)
        XCTAssertFalse(model.allQuestionsAnswered)
    }

    @MainActor
    func testNativePreviewUploadSeedsManageableAssets() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())

        model.applyNativePreview(.upload)

        XCTAssertEqual(model.stage, .collect)
        XCTAssertEqual(model.currentQuestion?.kind, .upload)
        XCTAssertEqual(model.currentQuestion?.id, "C2_precious_photo_analysis")
        XCTAssertEqual(model.uploadedAssets(for: "C2_precious_photo_analysis").count, 2)
        XCTAssertEqual(model.thumbnails.count, 2)
        XCTAssertFalse(model.allQuestionsAnswered)
    }

    @MainActor
    func testNativePreviewProcessingSetsDynamicScreenState() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())

        model.applyNativePreview(.processing)

        XCTAssertEqual(model.stage, .processing)
        XCTAssertEqual(model.processingTitle, "精神星体正在显影")
        XCTAssertGreaterThan(model.processingProgress, 0.5)
    }

    @MainActor
    func testNativePreviewTheaterSeedsContinuousScript() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())

        model.applyNativePreview(.theater)

        XCTAssertEqual(model.stage, .theater)
        XCTAssertEqual(model.session.part1Id, "part1_native_preview")
        XCTAssertEqual(model.session.theaterScriptId, "theater_native_preview")
        XCTAssertEqual(model.theaterPhase, .act1)
        XCTAssertEqual(model.theater?.theaterScript.act2.choices.count, 2)
        XCTAssertEqual(model.theater?.theaterScript.act3.mirrorQuestions.count, 2)
    }

    @MainActor
    func testNativePreviewConstellationSeedsResultScreen() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())

        model.applyNativePreview(.constellation)

        XCTAssertEqual(model.stage, .constellation)
        XCTAssertEqual(model.constellation?.psycheConstellation.archetype.name, "深月观测者")
        XCTAssertFalse(model.constellation?.psycheConstellation.sevenDimensions.isEmpty ?? true)
    }

    @MainActor
    func testNativePreviewConstellationEndRequestsBottomScroll() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())

        model.applyNativePreview(.constellationEnd)

        XCTAssertEqual(model.stage, .constellation)
        XCTAssertTrue(model.prefersConstellationEndPreview)
        XCTAssertEqual(model.constellation?.psycheConstellation.archetype.name, "深月观测者")
    }

    func testConstellationLayoutBudgetKeepsEndPreviewClearOfChrome() throws {
        let budget = BenyuanConstellationLayoutBudget.defaults

        XCTAssertGreaterThanOrEqual(budget.topMaskHeight, 44)
        XCTAssertEqual(budget.endPreviewAnchor, .center)
        XCTAssertGreaterThanOrEqual(budget.firstViewportReserve, 72)
        XCTAssertGreaterThanOrEqual(budget.bottomContentReserve, 300)
        XCTAssertGreaterThanOrEqual(
            budget.scrollBottomPadding(safeAreaBottom: 34),
            budget.bottomDockHeight + 260 + 34
        )
    }

    @MainActor
    func testNativeE2EAutorunSeedsAllAnswerKinds() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())
        model.applyNativeE2EAutorunSeed(questions: [
            BenyuanQuestion(
                id: "single",
                module: .a,
                title: "single",
                prompt: "single",
                kind: .single,
                minSelections: nil,
                maxSelections: nil,
                options: [
                    BenyuanQuestionOption(id: "s1", text: "one", psychologicalSignal: nil, tags: nil)
                ],
                outputKey: "single",
                helperText: nil,
                distributionKeys: nil,
                analysisDimensions: nil,
                acceptedFiles: nil,
                uploadRange: nil
            ),
            BenyuanQuestion(
                id: "multi",
                module: .a,
                title: "multi",
                prompt: "multi",
                kind: .multi,
                minSelections: 2,
                maxSelections: 3,
                options: [
                    BenyuanQuestionOption(id: "m1", text: "one", psychologicalSignal: nil, tags: nil),
                    BenyuanQuestionOption(id: "m2", text: "two", psychologicalSignal: nil, tags: nil),
                    BenyuanQuestionOption(id: "m3", text: "three", psychologicalSignal: nil, tags: nil)
                ],
                outputKey: "multi",
                helperText: nil,
                distributionKeys: nil,
                analysisDimensions: nil,
                acceptedFiles: nil,
                uploadRange: nil
            ),
            BenyuanQuestion(
                id: "distribution",
                module: .b,
                title: "distribution",
                prompt: "distribution",
                kind: .distribution,
                minSelections: nil,
                maxSelections: nil,
                options: nil,
                outputKey: "distribution",
                helperText: nil,
                distributionKeys: nil,
                analysisDimensions: nil,
                acceptedFiles: nil,
                uploadRange: nil
            ),
            BenyuanQuestion(
                id: "upload",
                module: .c,
                title: "upload",
                prompt: "upload",
                kind: .upload,
                minSelections: nil,
                maxSelections: nil,
                options: nil,
                outputKey: "upload",
                helperText: nil,
                distributionKeys: nil,
                analysisDimensions: nil,
                acceptedFiles: "image/*",
                uploadRange: BenyuanUploadRange(min: 1, max: 2)
            )
        ], fixtureAssets: [
            BenyuanUploadedAssetRef(
                assetId: "asset_e2e",
                questionId: "upload",
                name: "fixture.jpg",
                size: 1024,
                mimeType: "image/jpeg",
                uploadedAt: "2026-05-09T00:00:00.000Z",
                uploadOrigin: "ios-e2e"
            )
        ])

        XCTAssertEqual(model.session.answers["single"]?.stringValue, "s1")
        XCTAssertEqual(model.session.answers["multi"]?.arrayValue?.compactMap(\.stringValue), ["m1", "m2"])
        XCTAssertEqual(model.session.answers["distribution"]?.objectValue?["past"]?.intValue, 34)
        XCTAssertEqual(model.session.answers["distribution"]?.objectValue?["present"]?.intValue, 33)
        XCTAssertEqual(model.session.answers["distribution"]?.objectValue?["future"]?.intValue, 33)
        XCTAssertEqual(model.uploadedAssets(for: "upload").map(\.assetId), ["asset_e2e"])
        XCTAssertTrue(model.allQuestionsAnswered)
    }

    @MainActor
    func testNativeE2EAutorunStopsAtFirstPipelineFailure() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [BenyuanMockURLProtocol.self]
        let client = BenyuanAPIClient(
            baseURL: URL(string: "http://native-e2e.test")!,
            session: URLSession(configuration: config)
        )
        let suiteName = "benyuan-native-e2e-failure-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer {
            defaults.removePersistentDomain(forName: suiteName)
            BenyuanMockURLProtocol.handler = nil
        }
        let model = BenyuanNativeFlowModel(client: client, store: BenyuanFlowStore(defaults: defaults))

        BenyuanMockURLProtocol.handler = { request in
            let path = request.url?.path ?? ""
            if request.httpMethod == "POST", path == "/api/auth/anonymous" {
                return BenyuanMockURLProtocol.json(200, """
                {
                  "user": {
                    "user_id": "usr_e2e",
                    "created_at": "2026-05-09T00:00:00.000Z",
                    "updated_at": "2026-05-09T00:00:00.000Z",
                    "display_name": "访客",
                    "primary_provider": "anonymous",
                    "providers": { "anonymous": "anonymous:e2e" },
                    "phone_bound": false,
                    "wechat_bound": false
                  },
                  "session": {
                    "session_id": "auth_e2e",
                    "user_id": "usr_e2e",
                    "token": "bya_anonymous_e2e",
                    "provider": "anonymous",
                    "created_at": "2026-05-09T00:00:00.000Z",
                    "updated_at": "2026-05-09T00:00:00.000Z"
                  }
                }
                """)
            }

            if request.httpMethod == "GET", path == "/api/part1/schema" {
                return BenyuanMockURLProtocol.json(200, """
                {
                  "questions": [
                    {
                      "id": "A1_core_image",
                      "module": "A",
                      "title": "A1",
                      "prompt": "A1",
                      "kind": "single",
                      "outputKey": "A1_core_image",
                      "options": [
                        { "id": "A1-1", "text": "星空" }
                      ]
                    }
                  ],
                  "modules": {}
                }
                """)
            }

            if request.httpMethod == "POST", path == "/api/part1/submit" {
                return BenyuanMockURLProtocol.json(400, #"{ "error": "invalid_part1_seed" }"#)
            }

            return BenyuanMockURLProtocol.json(500, #"{ "error": "unexpected_request" }"#)
        }

        await model.runNativeE2EAutorun()

        XCTAssertEqual(model.stage, .error("请求失败（HTTP 400）：invalid_part1_seed"))
    }

    @MainActor
    func testUploadAssetManagementCanRemoveAndClearAssets() throws {
        let store = BenyuanFlowStore(defaults: UserDefaults(suiteName: "benyuan-upload-management-\(UUID().uuidString)")!)
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient(), store: store)
        let first = BenyuanUploadedAssetRef(
            assetId: "asset_1",
            questionId: "A2_music_analysis",
            name: "one.jpg",
            size: 1024,
            mimeType: "image/jpeg",
            uploadedAt: "2026-05-08T00:00:00.000Z",
            uploadOrigin: "native-library"
        )
        let second = BenyuanUploadedAssetRef(
            assetId: "asset_2",
            questionId: "A2_music_analysis",
            name: "two.jpg",
            size: 2048,
            mimeType: "image/jpeg",
            uploadedAt: "2026-05-08T00:00:00.000Z",
            uploadOrigin: "native-library"
        )

        model.session.uploadedAssets["A2_music_analysis"] = [first, second]
        model.session.answers["A2_music_analysis"] = .array([
            try first.benyuanJSONValue(),
            try second.benyuanJSONValue()
        ])
        model.removeUploadAsset(questionId: "A2_music_analysis", assetId: "asset_1")

        XCTAssertEqual(model.uploadedAssets(for: "A2_music_analysis").map(\.assetId), ["asset_2"])

        model.clearUploadAssets(questionId: "A2_music_analysis")

        XCTAssertTrue(model.uploadedAssets(for: "A2_music_analysis").isEmpty)
        XCTAssertEqual(model.session.answers["A2_music_analysis"], .array([]))
    }

    @MainActor
    func testUploadAssetDraftMergesAppendWithoutDuplicatesAndRespectsLimit() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())
        let first = uploadAsset(id: "asset_1", questionId: "C2_precious_photo_analysis")
        let duplicate = uploadAsset(id: "asset_1", questionId: "C2_precious_photo_analysis")
        let second = uploadAsset(id: "asset_2", questionId: "C2_precious_photo_analysis")
        let third = uploadAsset(id: "asset_3", questionId: "C2_precious_photo_analysis")

        model.session.uploadedAssets["C2_precious_photo_analysis"] = [first]

        model.applyUploadedAssets([duplicate, second, third], to: "C2_precious_photo_analysis", mode: .append, maxCount: 2)

        XCTAssertEqual(model.uploadedAssets(for: "C2_precious_photo_analysis").map(\.assetId), ["asset_1", "asset_2"])
        XCTAssertEqual(model.session.answers["C2_precious_photo_analysis"]?.arrayValue?.count, 2)
    }

    @MainActor
    func testUploadAssetDraftReplaceOnlyAfterSuccessfulResponse() throws {
        let model = BenyuanNativeFlowModel(client: BenyuanAPIClient())
        let existing = uploadAsset(id: "asset_existing", questionId: "C2_precious_photo_analysis")
        let replacement = uploadAsset(id: "asset_replacement", questionId: "C2_precious_photo_analysis")

        model.session.uploadedAssets["C2_precious_photo_analysis"] = [existing]
        model.session.answers["C2_precious_photo_analysis"] = .array([try existing.benyuanJSONValue()])

        model.applyUploadedAssets([], to: "C2_precious_photo_analysis", mode: .replace, maxCount: 3)
        XCTAssertEqual(model.uploadedAssets(for: "C2_precious_photo_analysis").map(\.assetId), ["asset_existing"])

        model.applyUploadedAssets([replacement], to: "C2_precious_photo_analysis", mode: .replace, maxCount: 3)
        XCTAssertEqual(model.uploadedAssets(for: "C2_precious_photo_analysis").map(\.assetId), ["asset_replacement"])
        XCTAssertNil(model.thumbnails["asset_existing"])
    }

    func testImagePayloadDownsamplesAndEncodesJPEG() throws {
        let image = UIGraphicsImageRenderer(size: CGSize(width: 4000, height: 2000)).image { context in
            UIColor.black.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 4000, height: 2000))
        }

        let payload = try BenyuanImagePayload.makeJPEGPayload(from: image, name: "source.png", maxDimension: 1600)

        XCTAssertEqual(payload.mimeType, "image/jpeg")
        XCTAssertEqual(payload.name, "source.jpg")
        XCTAssertLessThanOrEqual(max(payload.width, payload.height), 1600)
        XCTAssertGreaterThan(payload.data.count, 0)
    }

    private func uploadAsset(id: String, questionId: String) -> BenyuanUploadedAssetRef {
        BenyuanUploadedAssetRef(
            assetId: id,
            questionId: questionId,
            name: "\(id).jpg",
            size: 1024,
            mimeType: "image/jpeg",
            uploadedAt: "2026-05-08T00:00:00.000Z",
            uploadOrigin: "native-library"
        )
    }

    private static func theaterRecordFixture(theaterScriptId: String, part1Id: String) -> String {
        """
        {
          "theater_script_id": "\(theaterScriptId)",
          "part1_id": "\(part1Id)",
          "created_at": "2026-05-08T00:10:00.000Z",
          "runtime": {
            "provider": "fixture",
            "model": "fixture",
            "mode": "fallback"
          },
          "theater_script": {
            "user_id": "usr_replay",
            "generated_at": "2026-05-08T00:10:00.000Z",
            "personalization_summary": {
              "core_archetype": "深月观测者",
              "aesthetic_style": "deep_lunar",
              "emotional_tone": "reflective",
              "key_themes": ["boundary", "memory"]
            },
            "act1": {
              "scene_description": "黑色月面像一座缓慢转身的剧场。",
              "visual_prompt": "deep lunar theater",
              "ambient_sound": "low_tide",
              "duration": 30
            },
            "act2": {
              "choices": [
                {
                  "choice_id": 1,
                  "scene": "第一扇门向你打开，里面有一盏迟来的灯。",
                  "options": [
                    {
                      "id": "open_now",
                      "text": "现在推门进去",
                      "trait_signal": "approach",
                      "response": "门后的光线先照见你的手。"
                    }
                  ]
                },
                {
                  "choice_id": 2,
                  "scene": "第二个房间没有声音，只有墙面浮起的银色潮线。",
                  "options": [
                    {
                      "id": "silent_light",
                      "text": "站在安静的光里",
                      "trait_signal": "containment",
                      "response": "你听见自己没有说出口的名字。"
                    }
                  ]
                }
              ]
            },
            "act3": {
              "scene_description": "镜面把海和月亮折成同一个圆。",
              "mirror_questions": [
                {
                  "question_id": 1,
                  "dialogue": "镜中的人把问题还给你。",
                  "question": "你愿意给自己的边界起什么名字？",
                  "options": [
                    {
                      "id": "name_boundary",
                      "text": "给边界一个清晰的名字",
                      "trait_signal": "self_boundary"
                    }
                  ]
                }
              ],
              "mirror_final_words": "你已经把边界从沉默里领出来。"
            },
            "epilogue": {
              "scene_description": "深月落下，剧场只剩一条发亮的边。",
              "closing_text": "故事没有结束，只是把主语还给了你。",
              "transition_prompt": "星图正在显影。",
              "transition_animation": "lunar_convergence"
            }
          }
        }
        """
    }

    private static func part2RecordFixture(part2Id: String, part1Id: String, theaterScriptId: String) -> String {
        """
        {
          "part2_id": "\(part2Id)",
          "part1_id": "\(part1Id)",
          "theater_script_id": "\(theaterScriptId)",
          "created_at": "2026-05-08T00:20:00.000Z",
          "act2_choices": [
            { "choice_id": 1, "selected": "open_now", "hesitation_time": 1.2, "hover_sequence": ["open_now"], "timestamp": "2026-05-08T00:11:00.000Z" },
            { "choice_id": 2, "selected": "silent_light", "hesitation_time": 2.4, "hover_sequence": [], "timestamp": "2026-05-08T00:12:00.000Z" }
          ],
          "act3_responses": [
            { "question_id": 1, "selected": "name_boundary", "hesitation_time": 3.1, "timestamp": "2026-05-08T00:13:00.000Z" }
          ],
          "metadata": {
            "phase_durations": { "act1": 4.0, "act2": 8.0, "act3": 5.0 }
          }
        }
        """
    }

    private static func constellationRecordFixture() -> String {
        """
        {
          "constellation": {
            "user_id": "usr_test",
            "generated_at": "2026-05-08T00:30:00.000Z",
            "archetype": {
              "name": "深月观测者",
              "english_name": "Deep Moon Witness",
              "core_essence": "在暗场中保存自己的真实边界。",
              "visual_prompt": "deep moon field"
            },
            "seven_dimensions": {
              "openness": { "score": 82, "interpretation": "以隐喻进入世界。" }
            },
            "narrative_overview": "你把孤独改写成一种观察力。",
            "core_tensions": [
              {
                "tension_id": 1,
                "name": "亲密与撤退",
                "description": "想被看见，也想保留暗面。",
                "growth_direction": "练习在关系中表达边界。"
              }
            ],
            "growth_suggestions": [
              {
                "title": "写一封不寄出的信",
                "description": "把无法说出的部分放到纸面上。",
                "actionable_steps": ["今晚写下三个真实句子"]
              }
            ],
            "recommendations": {
              "books": [{ "title": "月亮与六便士", "author": "毛姆", "reason": "关于执念与自我神话。" }],
              "films": [{ "title": "花样年华", "director": "王家卫", "reason": "关于克制和错身。" }],
              "music": [{ "artist": "坂本龙一", "album": "async", "reason": "像一场缓慢的内在回声。" }]
            }
          },
          "runtime": {
            "provider_name": "fixture",
            "model": "fixture",
            "mode": "fallback",
            "source": "test",
            "fallback_active": true
          },
          "archetype_image_url": "/generated/test.png",
          "created_at": "2026-05-08T00:30:00.000Z"
        }
        """
    }

    func testSchemaDecodesPart1Questions() throws {
        let json = """
        {
          "questions": [
            {
              "id": "A1_core_image",
              "module": "A",
              "title": "A1. 核心意象",
              "prompt": "闭上眼睛",
              "kind": "single",
              "outputKey": "A1_core_image",
              "options": [
                { "id": "A1-1", "text": "无边际的星空" }
              ]
            }
          ],
          "modules": {}
        }
        """.data(using: .utf8)!

        let payload = try JSONDecoder.benyuan.decode(BenyuanPart1SchemaResponse.self, from: json)

        XCTAssertEqual(payload.questions.first?.id, "A1_core_image")
        XCTAssertEqual(payload.questions.first?.module, .a)
        XCTAssertEqual(payload.questions.first?.kind, .single)
    }

    func testTheaterGenerateResponseDecodesLiveStagingShape() throws {
        let json = """
        {
          "theater_script_id": "theater_live",
          "part1_id": "part1_live",
          "created_at": "2026-05-09T04:06:27.326Z",
          "runtime": {
            "provider": "xiaoye",
            "model": "gpt-5.5",
            "mode": "live",
            "request_id": "resp_live"
          },
          "theater_script": {
            "user_id": "usr_live",
            "generated_at": "2026-05-09T04:05:26.193Z",
            "personalization_summary": {
              "core_archetype": "黄昏海岸的独行观测者",
              "aesthetic_style": "poetic_spiritual",
              "emotional_tone": "reflective_symbolic",
              "key_themes": ["existentialism", "meaning_seeking"]
            },
            "act1": {
              "scene_description": "你从一圈深黑的入口走下去。",
              "visual_prompt": "deep black coastal library at night",
              "ambient_sound": "ocean_waves_distant",
              "duration": 30
            },
            "act2": {
              "choices": [
                {
                  "choice_id": 1,
                  "scene": "图书馆的门半开着。",
                  "options": [
                    {
                      "id": "act2_1_a",
                      "text": "走进门内，先看那张剪影画",
                      "trait_signal": "aesthetic_memory_orientation",
                      "response": "画里的太阳没有落下。"
                    }
                  ]
                }
              ]
            },
            "act3": {
              "scene_description": "门后是一面巨大的镜子。",
              "mirror_questions": [
                {
                  "question_id": 1,
                  "dialogue": "镜中的你开口。",
                  "question": "你最想承认什么？",
                  "options": [
                    {
                      "id": "act3_1_a",
                      "text": "承认自己仍在寻找。",
                      "trait_signal": "meaning_seeking"
                    }
                  ]
                }
              ],
              "mirror_final_words": "你已经知道答案了。"
            },
            "epilogue": {
              "scene_description": "镜子慢慢沉入水面。",
              "closing_text": "你的旅程结束了，但理解才刚刚开始。",
              "transition_prompt": "正在绘制你的精神星图...",
              "transition_animation": "stars_converging"
            }
          }
        }
        """.data(using: .utf8)!

        let response = try JSONDecoder.benyuan.decode(TheaterGenerateResponse.self, from: json)

        XCTAssertEqual(response.theaterScriptId, "theater_live")
        XCTAssertEqual(response.runtime.mode, "live")
        XCTAssertEqual(response.theaterScript.act2.choices.first?.options.first?.traitSignal, "aesthetic_memory_orientation")
        XCTAssertEqual(response.theaterScript.act3.mirrorQuestions.first?.options.first?.traitSignal, "meaning_seeking")
    }

}
