import Foundation

enum BenyuanAPIError: Error, LocalizedError, Equatable {
    case invalidImage
    case invalidResponse
    case server(status: Int, message: String)

    var errorDescription: String? {
        switch self {
        case .invalidImage:
            return "图片暂时无法处理。"
        case .invalidResponse:
            return "服务器返回了无法识别的结果。"
        case .server(let status, let message):
            if message == "sms_provider_not_configured" {
                return "手机号登录还在接入短信网关，请先用 Apple 或访客进入。"
            }
            if message == "invalid_phone" {
                return "请填写带国家区号的手机号，例如 +8613800138000。"
            }
            if message == "invalid_phone_code" {
                return "验证码不正确或已经过期。"
            }
            if message == "wechat_not_configured" {
                return "微信登录还在接入开放平台，请先用 Apple 或访客进入。"
            }
            if message == "invalid_wechat_code" {
                return "微信授权暂时无效，请重新尝试。"
            }
            if message == "rate_limited" {
                return "请求太频繁了，稍后再试。"
            }
            if message == "auth_required" {
                return "登录状态已过期，请重新进入。"
            }
            if message.isEmpty {
                return "请求失败（HTTP \(status)）。"
            }
            return "请求失败（HTTP \(status)）：\(message)"
        }
    }
}

final class BenyuanAPIClient {
    let baseURL: URL
    private let session: URLSession
    private var authSession: BenyuanAuthSession?
    private let defaultTimeout: TimeInterval = 60
    private let longAgentTimeout: TimeInterval = 240

    init(baseURL: URL = BenyuanShellConfig.baseURL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    var authorizationHeaderValue: String? {
        guard let token = authSession?.token else { return nil }
        return "Bearer \(token)"
    }

    func setAuthSession(_ authSession: BenyuanAuthSession?) {
        self.authSession = authSession
    }

    func url(path: String) -> URL {
        let normalized = path.hasPrefix("/") ? String(path.dropFirst()) : path
        return baseURL.appendingPathComponent(normalized)
    }

    func fetchSchema() async throws -> BenyuanPart1SchemaResponse {
        try await get("/api/part1/schema")
    }

    func fetchAuthProviders() async throws -> BenyuanAuthProvidersResponse {
        try await get("/api/auth/providers")
    }

    func fetchCurrentAccount() async throws -> BenyuanAuthResponse {
        try await get("/api/auth/me")
    }

    func fetchAccountHistory() async throws -> BenyuanAccountHistoryResponse {
        try await get("/api/account/history")
    }

    func deleteAccountHistoryItem(part1Id: String) async throws -> BenyuanLogoutResponse {
        try await delete("/api/account/history/\(part1Id)")
    }

    func fetchPart1HistoryRecord(part1Id: String) async throws -> BenyuanPart1HistoryRecordResponse {
        try await get("/api/account/history/\(part1Id)/part1")
    }

    func submitFeedback(
        kind: BenyuanFeedbackKind,
        message: String,
        stage: BenyuanNativeStage,
        session nativeSession: BenyuanNativeSession
    ) async throws -> BenyuanFeedbackSubmitResponse {
        var body: [String: BenyuanJSONValue] = [
            "kind": .string(kind.rawValue),
            "message": .string(message),
            "stage": .string(stage.feedbackStage),
            "device_context": .object([
                "platform": .string("ios-native"),
                "bundle_id": .string(Bundle.main.bundleIdentifier ?? "unknown"),
                "app_version": .string(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"),
                "build": .string(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "unknown")
            ])
        ]
        if let part1Id = nativeSession.part1Id {
            body["part1_id"] = .string(part1Id)
        }
        if let theaterScriptId = nativeSession.theaterScriptId {
            body["theater_script_id"] = .string(theaterScriptId)
        }
        if let part2Id = nativeSession.part2Id {
            body["part2_id"] = .string(part2Id)
        }
        if let constellationId = nativeSession.constellationId {
            body["constellation_id"] = .string(constellationId)
        }
        return try await post("/api/account/feedback", body: body)
    }

    func fetchTheaterScript(theaterScriptId: String) async throws -> TheaterScriptRecord {
        try await get("/api/theater/\(theaterScriptId)")
    }

    func fetchConstellationRecord(constellationId: String) async throws -> BenyuanConstellationRecordResponse {
        try await get("/api/constellation/\(constellationId)")
    }

    func logout() async throws -> BenyuanLogoutResponse {
        try await post("/api/auth/logout", body: [:])
    }

    func createAnonymousSession() async throws -> BenyuanAuthResponse {
        try await post("/api/auth/anonymous", body: [:])
    }

    func createAppleSession(identityToken: String? = nil, authorizationCode: String? = nil, displayName: String? = nil) async throws -> BenyuanAuthResponse {
        var body: [String: BenyuanJSONValue] = [:]
        if let identityToken {
            body["identity_token"] = .string(identityToken)
        }
        if let authorizationCode {
            body["authorization_code"] = .string(authorizationCode)
        }
        if let displayName {
            body["display_name"] = .string(displayName)
        }
        return try await post("/api/auth/apple", body: body)
    }

    func createWechatSession(code: String, displayName: String? = nil) async throws -> BenyuanAuthResponse {
        var body: [String: BenyuanJSONValue] = [
            "code": .string(code)
        ]
        if let displayName {
            body["display_name"] = .string(displayName)
        }
        return try await post("/api/auth/wechat", body: body)
    }

    func requestPhoneCode(phone: String) async throws -> BenyuanPhoneCodeResponse {
        try await post("/api/auth/phone/request-code", body: [
            "phone": .string(phone)
        ])
    }

    func verifyPhoneCode(phone: String, code: String) async throws -> BenyuanAuthResponse {
        try await post("/api/auth/phone/verify-code", body: [
            "phone": .string(phone),
            "code": .string(code)
        ])
    }

    func upload(questionId: String, images: [BenyuanImagePayload], origin: String) async throws -> BenyuanUploadResponse {
        let boundary = "benyuan-\(UUID().uuidString)"
        var request = URLRequest(url: url(path: "/api/part1/upload"))
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = makeMultipartBody(questionId: questionId, images: images, origin: origin, boundary: boundary)
        return try await send(request)
    }

    func submitPart1(answers: [String: BenyuanJSONValue]) async throws -> BenyuanPart1SubmitResponse {
        try await post("/api/part1/submit", body: [
            "answers": .object(answers)
        ])
    }

    func runMultimodal(part1Id: String, runtime: AgentRuntimeOverride? = nil) async throws -> BenyuanMultimodalResponse {
        var body: [String: BenyuanJSONValue] = ["part1_id": .string(part1Id)]
        if let runtime {
            body["runtime_override"] = try runtime.benyuanJSONValue()
        }
        return try await post("/api/analyze/multimodal", body: body, timeout: longAgentTimeout)
    }

    func generateTheater(part1Id: String, runtime: AgentRuntimeOverride? = nil) async throws -> TheaterGenerateResponse {
        var body: [String: BenyuanJSONValue] = ["part1_id": .string(part1Id)]
        if let runtime {
            body["runtime_override"] = try runtime.benyuanJSONValue()
        }
        return try await post("/api/theater/generate", body: body, timeout: longAgentTimeout)
    }

    func submitPart2(
        part1Id: String,
        theaterScriptId: String,
        choices: [Part2ChoiceRecord],
        mirrors: [Part2MirrorRecord],
        metadata: [String: BenyuanJSONValue]
    ) async throws -> Part2SubmitResponse {
        try await post("/api/part2/submit", body: [
            "part1_id": .string(part1Id),
            "theater_script_id": .string(theaterScriptId),
            "act2_choices": try choices.benyuanJSONValue(),
            "act3_responses": try mirrors.benyuanJSONValue(),
            "metadata": .object(metadata)
        ])
    }

    func generateConstellation(part1Id: String, part2Id: String, runtime: AgentRuntimeOverride? = nil) async throws -> ConstellationGenerateResponse {
        var body: [String: BenyuanJSONValue] = [
            "part1_id": .string(part1Id),
            "part2_id": .string(part2Id)
        ]
        if let runtime {
            body["runtime_override"] = try runtime.benyuanJSONValue()
        }
        return try await post("/api/constellation/generate", body: body, timeout: longAgentTimeout)
    }

    private func get<Response: Decodable>(_ path: String) async throws -> Response {
        var request = URLRequest(url: url(path: path))
        request.httpMethod = "GET"
        applyAuth(to: &request)
        return try await send(request)
    }

    private func post<Response: Decodable>(_ path: String, body: [String: BenyuanJSONValue], timeout: TimeInterval? = nil) async throws -> Response {
        var request = URLRequest(url: url(path: path), timeoutInterval: timeout ?? defaultTimeout)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        applyAuth(to: &request)
        request.httpBody = try JSONEncoder.benyuan.encode(body)
        return try await send(request)
    }

    private func delete<Response: Decodable>(_ path: String) async throws -> Response {
        var request = URLRequest(url: url(path: path))
        request.httpMethod = "DELETE"
        applyAuth(to: &request)
        return try await send(request)
    }

    private func applyAuth(to request: inout URLRequest) {
        if let authorizationHeaderValue {
            request.setValue(authorizationHeaderValue, forHTTPHeaderField: "Authorization")
        }
    }

    private func send<Response: Decodable>(_ request: URLRequest) async throws -> Response {
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw BenyuanAPIError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let message = Self.serverErrorMessage(from: data)
            throw BenyuanAPIError.server(status: http.statusCode, message: message)
        }
        return try JSONDecoder.benyuan.decode(Response.self, from: data)
    }

    private static func serverErrorMessage(from data: Data) -> String {
        let body = bodyPreview(from: data)
        guard !data.isEmpty else {
            return ""
        }

        if
            let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let message = preferredErrorMessage(in: object)
        {
            return message
        }

        return body
    }

    private static func preferredErrorMessage(in object: [String: Any]) -> String? {
        if
            let error = object["error"] as? String,
            let detail = object["detail"] as? String
        {
            let trimmedError = error.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedDetail = detail.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmedError.isEmpty && !trimmedDetail.isEmpty {
                return "\(trimmedError): \(trimmedDetail)"
            }
        }

        for key in ["error", "message", "detail", "code"] {
            if let value = object[key] as? String {
                let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
                if !trimmed.isEmpty {
                    return trimmed
                }
            }
        }
        return nil
    }

    private static func bodyPreview(from data: Data, limit: Int = 240) -> String {
        guard let raw = String(data: data, encoding: .utf8) else {
            return "<\(data.count) bytes>"
        }
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count > limit else {
            return trimmed
        }
        let endIndex = trimmed.index(trimmed.startIndex, offsetBy: limit)
        return "\(trimmed[..<endIndex])..."
    }

    private func makeMultipartBody(questionId: String, images: [BenyuanImagePayload], origin: String, boundary: String) -> Data {
        var body = Data()
        appendField("question_id", value: questionId, to: &body, boundary: boundary)
        appendField("upload_origin", value: origin, to: &body, boundary: boundary)
        for image in images {
            body.appendString("--\(boundary)\r\n")
            body.appendString("Content-Disposition: form-data; name=\"files\"; filename=\"\(image.name)\"\r\n")
            body.appendString("Content-Type: \(image.mimeType)\r\n\r\n")
            body.append(image.data)
            body.appendString("\r\n")
        }
        body.appendString("--\(boundary)--\r\n")
        return body
    }

    private func appendField(_ name: String, value: String, to body: inout Data, boundary: String) {
        body.appendString("--\(boundary)\r\n")
        body.appendString("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n")
        body.appendString("\(value)\r\n")
    }
}

private extension BenyuanNativeStage {
    var feedbackStage: String {
        switch self {
        case .auth: return "auth"
        case .account: return "account"
        case .collect: return "collect"
        case .processing: return "processing"
        case .theater: return "theater"
        case .constellation: return "constellation"
        case .launching, .error: return "unknown"
        }
    }
}

private extension Data {
    mutating func appendString(_ value: String) {
        append(Data(value.utf8))
    }
}
