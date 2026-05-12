import Foundation

enum BenyuanJSONValue: Codable, Equatable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: BenyuanJSONValue])
    case array([BenyuanJSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([BenyuanJSONValue].self) {
            self = .array(value)
        } else if let value = try? container.decode([String: BenyuanJSONValue].self) {
            self = .object(value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported JSON value")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .number(let value):
            try container.encode(value)
        case .bool(let value):
            try container.encode(value)
        case .object(let value):
            try container.encode(value)
        case .array(let value):
            try container.encode(value)
        case .null:
            try container.encodeNil()
        }
    }

    var stringValue: String? {
        if case .string(let value) = self { return value }
        return nil
    }

    var arrayValue: [BenyuanJSONValue]? {
        if case .array(let value) = self { return value }
        return nil
    }

    var objectValue: [String: BenyuanJSONValue]? {
        if case .object(let value) = self { return value }
        return nil
    }

    var intValue: Int? {
        if case .number(let value) = self { return Int(value) }
        return nil
    }
}

enum BenyuanModuleKey: String, Codable, CaseIterable, Equatable {
    case a = "A"
    case b = "B"
    case c = "C"

    var title: String {
        switch self {
        case .a: return "审美偏好"
        case .b: return "哲学提问"
        case .c: return "生命叙事"
        }
    }
}

enum BenyuanQuestionKind: String, Codable, Equatable {
    case single
    case multi
    case upload
    case distribution
}

struct BenyuanQuestionOption: Codable, Identifiable, Equatable {
    let id: String
    let text: String
    let psychologicalSignal: String?
    let tags: [String]?
}

struct BenyuanDistributionKey: Codable, Identifiable, Equatable {
    let key: String
    let label: String

    var id: String { key }
}

struct BenyuanUploadRange: Codable, Equatable {
    let min: Int
    let max: Int
}

struct BenyuanQuestion: Codable, Identifiable, Equatable {
    let id: String
    let module: BenyuanModuleKey
    let title: String
    let prompt: String
    let kind: BenyuanQuestionKind
    let minSelections: Int?
    let maxSelections: Int?
    let options: [BenyuanQuestionOption]?
    let outputKey: String
    let helperText: String?
    let distributionKeys: [BenyuanDistributionKey]?
    let analysisDimensions: [String]?
    let acceptedFiles: String?
    let uploadRange: BenyuanUploadRange?
}

struct BenyuanPart1SchemaResponse: Codable, Equatable {
    let modules: [String: [BenyuanQuestion]]?
    let questions: [BenyuanQuestion]
}

struct BenyuanUploadedAssetRef: Codable, Identifiable, Equatable {
    let assetId: String
    let questionId: String
    let name: String
    let size: Int
    let mimeType: String
    let uploadedAt: String
    let uploadOrigin: String?

    var id: String { assetId }
}

struct BenyuanUploadResponse: Codable, Equatable {
    let questionId: String
    let assets: [BenyuanUploadedAssetRef]
}

struct BenyuanPart1SubmitResponse: Codable, Equatable {
    let part1Id: String
    let userId: String
    let part1Data: BenyuanJSONValue?
    let aggregatedTraits: BenyuanJSONValue?
    let pendingMultimodal: [String]?
}

struct BenyuanPart1HistoryRecordResponse: Codable, Equatable {
    let part1Id: String
    let userId: String
    let createdAt: String
    let updatedAt: String
    let answers: [String: BenyuanJSONValue]

    var uploadedAssets: [String: [BenyuanUploadedAssetRef]] {
        answers.reduce(into: [String: [BenyuanUploadedAssetRef]]()) { result, entry in
            guard case .array(let values) = entry.value else { return }
            let assets = values.compactMap { value -> BenyuanUploadedAssetRef? in
                guard let data = try? JSONEncoder.benyuan.encode(value) else { return nil }
                return try? JSONDecoder.benyuan.decode(BenyuanUploadedAssetRef.self, from: data)
            }
            if !assets.isEmpty {
                result[entry.key] = assets
            }
        }
    }
}

struct BenyuanMultimodalResponse: Codable, Equatable {
    let part1Id: String
    let runtime: AgentRuntimeResult?
    let aggregatedTraits: BenyuanJSONValue?
}

struct AgentRuntimeOverride: Codable, Equatable {
    var providerName: String?
    var model: String?
    var baseUrl: String?
    var reasoningEffort: String?
    var disableResponseStorage: Bool?
    var live: Bool?
}

struct AgentRuntimeResult: Codable, Equatable {
    let providerName: String?
    let model: String?
    let mode: String?
    let source: String?
    let fallbackActive: Bool?
    let error: String?
}

struct TheaterChoiceOption: Codable, Identifiable, Equatable {
    let id: String
    let text: String
    let traitSignal: String
    let response: String
}

struct TheaterChoice: Codable, Identifiable, Equatable {
    let choiceId: Int
    let scene: String
    let options: [TheaterChoiceOption]

    var id: Int { choiceId }
}

struct TheaterMirrorQuestionOption: Codable, Identifiable, Equatable {
    let id: String
    let text: String
    let traitSignal: String
}

struct TheaterMirrorQuestion: Codable, Identifiable, Equatable {
    let questionId: Int
    let dialogue: String
    let question: String
    let options: [TheaterMirrorQuestionOption]

    var id: Int { questionId }
}

struct TheaterScript: Codable, Equatable {
    struct PersonalizationSummary: Codable, Equatable {
        let coreArchetype: String
        let aestheticStyle: String
        let emotionalTone: String
        let keyThemes: [String]
    }

    struct Act1: Codable, Equatable {
        let sceneDescription: String
        let visualPrompt: String
        let ambientSound: String
        let duration: Int
    }

    struct Act2: Codable, Equatable {
        let choices: [TheaterChoice]
    }

    struct Act3: Codable, Equatable {
        let sceneDescription: String
        let mirrorQuestions: [TheaterMirrorQuestion]
        let mirrorFinalWords: String
    }

    struct Epilogue: Codable, Equatable {
        let sceneDescription: String
        let closingText: String
        let transitionPrompt: String
        let transitionAnimation: String
    }

    let userId: String
    let generatedAt: String
    let personalizationSummary: PersonalizationSummary
    let act1: Act1
    let act2: Act2
    let act3: Act3
    let epilogue: Epilogue
}

struct TheaterScriptRecord: Codable, Equatable {
    let theaterScriptId: String
    let part1Id: String
    let createdAt: String
    let runtime: AgentRuntimeResult
    let theaterScript: TheaterScript

    func generateResponse() -> TheaterGenerateResponse {
        TheaterGenerateResponse(
            theaterScriptId: theaterScriptId,
            part1Id: part1Id,
            runtime: runtime,
            theaterScript: theaterScript
        )
    }
}

struct TheaterGenerateResponse: Codable, Equatable {
    let theaterScriptId: String
    let part1Id: String
    let runtime: AgentRuntimeResult
    let theaterScript: TheaterScript
}

struct Part2ChoiceRecord: Codable, Equatable {
    let choiceId: Int
    let selected: String
    let hesitationTime: Double?
    let hoverSequence: [String]?
    let timestamp: String
}

struct Part2MirrorRecord: Codable, Equatable {
    let questionId: Int
    let selected: String
    let hesitationTime: Double?
    let timestamp: String
}

struct Part2SubmitResponse: Codable, Equatable {
    let part2Id: String
    let part1Id: String
    let theaterScriptId: String
    let act2ChoiceCount: Int
    let act3ResponseCount: Int
}

struct BenyuanPart2HistoryRecordResponse: Codable, Equatable {
    let part2Id: String
    let part1Id: String
    let theaterScriptId: String
    let createdAt: String
    let act2Choices: [Part2ChoiceRecord]
    let act3Responses: [Part2MirrorRecord]
    let metadata: [String: BenyuanJSONValue]
}

struct PsycheDimension: Codable, Equatable {
    let score: Int
    let interpretation: String
}

struct PsycheArchetype: Codable, Equatable {
    let name: String
    let englishName: String
    let coreEssence: String
    let visualPrompt: String
}

struct PsycheConstellation: Codable, Equatable {
    struct CoreTension: Codable, Identifiable, Equatable {
        let tensionId: Int
        let name: String
        let description: String
        let growthDirection: String

        var id: Int { tensionId }
    }

    struct GrowthSuggestion: Codable, Identifiable, Equatable {
        let title: String
        let description: String
        let actionableSteps: [String]

        var id: String { title }
    }

    struct Recommendations: Codable, Equatable {
        struct Book: Codable, Identifiable, Equatable {
            let title: String
            let author: String
            let reason: String

            var id: String { "\(title)-\(author)" }
        }

        struct Film: Codable, Identifiable, Equatable {
            let title: String
            let director: String
            let reason: String

            var id: String { "\(title)-\(director)" }
        }

        struct Music: Codable, Identifiable, Equatable {
            let artist: String
            let album: String
            let reason: String

            var id: String { "\(artist)-\(album)" }
        }

        let books: [Book]
        let films: [Film]
        let music: [Music]
    }

    let userId: String
    let generatedAt: String
    let archetype: PsycheArchetype
    let sevenDimensions: [String: PsycheDimension]
    let narrativeOverview: String
    let coreTensions: [CoreTension]
    let growthSuggestions: [GrowthSuggestion]
    let recommendations: Recommendations
}

struct ConstellationGenerateResponse: Codable, Equatable {
    let constellationId: String
    let runtime: AgentRuntimeResult
    let psycheConstellation: PsycheConstellation
}

struct BenyuanNativeGenerationJobResponse: Codable, Equatable {
    let jobId: String
    let userId: String
    let part1Id: String
    let part2Id: String?
    let theaterScriptId: String?
    let constellationId: String?
    let kind: String
    let status: String
    let currentStage: String
    let progress: Double
    let message: String
    let canResumeInBackground: Bool
    let error: String?
    let createdAt: String
    let updatedAt: String
    let finishedAt: String?
}

struct BenyuanConstellationRecordResponse: Codable, Equatable {
    let constellation: PsycheConstellation
    let runtime: AgentRuntimeResult
    let archetypeImageUrl: String?
    let createdAt: String?

    func generateResponse(constellationId: String) -> ConstellationGenerateResponse {
        ConstellationGenerateResponse(
            constellationId: constellationId,
            runtime: runtime,
            psycheConstellation: constellation
        )
    }
}

enum BenyuanAuthProvider: String, Codable, Equatable {
    case anonymous
    case apple
    case wechat
    case phone
}

struct BenyuanUser: Codable, Equatable {
    let userId: String
    let createdAt: String
    let updatedAt: String
    let displayName: String?
    let primaryProvider: BenyuanAuthProvider
    let providers: [String: String]
    let phoneBound: Bool?
    let wechatBound: Bool?
}

struct BenyuanAuthSession: Codable, Equatable {
    let sessionId: String
    let userId: String
    let token: String
    let provider: BenyuanAuthProvider
    let createdAt: String
    let updatedAt: String
}

struct BenyuanAuthResponse: Codable, Equatable {
    let user: BenyuanUser
    let session: BenyuanAuthSession
}

struct BenyuanLogoutResponse: Codable, Equatable {
    let ok: Bool
}

enum BenyuanAuthProviderStatus: String, Codable, Equatable {
    case ready
    case reserved
}

struct BenyuanAuthProviderCapability: Codable, Identifiable, Equatable {
    let provider: BenyuanAuthProvider
    let enabled: Bool
    let status: BenyuanAuthProviderStatus
    let actions: [String]

    var id: BenyuanAuthProvider { provider }
}

struct BenyuanAuthProvidersResponse: Codable, Equatable {
    let providers: [BenyuanAuthProviderCapability]
    let capabilities: [String]

    func provider(_ provider: BenyuanAuthProvider) -> BenyuanAuthProviderCapability? {
        providers.first { $0.provider == provider }
    }
}

struct BenyuanPhoneCodeResponse: Codable, Equatable {
    let phone: String
    let expiresAt: String
    let fixtureCode: String?
}

enum BenyuanAccountHistoryStage: String, Codable, Equatable {
    case part1
    case theater
    case part2
    case constellation

    var label: String {
        switch self {
        case .part1: return "收集中"
        case .theater: return "剧场中"
        case .part2: return "剧场完成"
        case .constellation: return "星图完成"
        }
    }
}

struct BenyuanAccountHistoryItem: Codable, Identifiable, Equatable {
    let part1Id: String
    let theaterScriptId: String?
    let part2Id: String?
    let constellationId: String?
    let stage: BenyuanAccountHistoryStage
    let title: String
    let subtitle: String
    let archetypeName: String?
    let createdAt: String
    let updatedAt: String
    let assetCount: Int

    var id: String { part1Id }
}

struct BenyuanAccountHistoryResponse: Codable, Equatable {
    let items: [BenyuanAccountHistoryItem]
}

enum BenyuanFeedbackKind: String, Codable, CaseIterable, Equatable, Identifiable {
    case issue
    case ui
    case content
    case speed
    case other

    var id: String { rawValue }

    var label: String {
        switch self {
        case .issue: return "问题上报"
        case .ui: return "界面反馈"
        case .content: return "内容风格"
        case .speed: return "速度卡顿"
        case .other: return "其他"
        }
    }
}

struct BenyuanFeedbackSubmitResponse: Codable, Equatable {
    let ok: Bool
    let feedbackId: String
    let createdAt: String
}

struct BenyuanNativeSession: Codable, Equatable {
    var authSession: BenyuanAuthSession?
    var user: BenyuanUser?
    var part1Id: String?
    var theaterScriptId: String?
    var part2Id: String?
    var constellationId: String?
    var activeGenerationJobId: String?
    var answers: [String: BenyuanJSONValue]
    var uploadedAssets: [String: [BenyuanUploadedAssetRef]]
    var phaseDurations: [String: Double]

    static let empty = BenyuanNativeSession(
        authSession: nil,
        user: nil,
        part1Id: nil,
        theaterScriptId: nil,
        part2Id: nil,
        constellationId: nil,
        activeGenerationJobId: nil,
        answers: [
            "B4_time_philosophy": .object(["past": .number(34), "present": .number(33), "future": .number(33)]),
            "A3_literature": .array([]),
            "C3_resonance_moments": .array([]),
            "A2_music_analysis": .array([]),
            "C1_social_posts_analysis": .array([]),
            "C2_precious_photo_analysis": .array([])
        ],
        uploadedAssets: [:],
        phaseDurations: [:]
    )
}

extension JSONDecoder {
    static var benyuan: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        return decoder
    }
}

extension JSONEncoder {
    static var benyuan: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        return encoder
    }
}

extension Encodable {
    func benyuanJSONValue() throws -> BenyuanJSONValue {
        let data = try JSONEncoder.benyuan.encode(self)
        return try JSONDecoder.benyuan.decode(BenyuanJSONValue.self, from: data)
    }
}
