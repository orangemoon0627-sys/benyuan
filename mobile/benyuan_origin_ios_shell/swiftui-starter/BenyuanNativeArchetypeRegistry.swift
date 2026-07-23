import Foundation

struct BenyuanNativeArchetypeProfile: Equatable {
    let name: String
    let englishName: String
    let visualPrompt: String
    let fingerprints: [String]
}

enum BenyuanNativeArchetypeRegistry {
    static let profiles: [BenyuanNativeArchetypeProfile] = [
        BenyuanNativeArchetypeProfile(
            name: "远潮观月者",
            englishName: "The Far-Tide Moon Watcher",
            visualPrompt: "far tide moon, silver lunar body, black sea horizon, restrained gold tide",
            fingerprints: ["远潮观月者", "月门潜航者", "月背寻光者", "深月观测者", "暮潮拾光者", "暮海寻光者", "暮海守光者", "目光拾亡者", "月岸守望者", "暗潮守月人", "moonlit seeker", "moonlitseeker", "far tide", "fartide", "观月", "月门", "月背", "暮潮", "暮海", "寻光", "守光", "拾光"]
        ),
        BenyuanNativeArchetypeProfile(
            name: "星图筑序者",
            englishName: "The Star-Map Architect",
            visualPrompt: "geometric star map architecture, silver coordinate lines, midnight grid",
            fingerprints: ["星图筑序者", "理性建构者", "star map architect", "starmaparchitect", "rational builder", "rationalbuilder", "筑序"]
        ),
        BenyuanNativeArchetypeProfile(
            name: "月港栖岸者",
            englishName: "The Moon-Harbor Keeper",
            visualPrompt: "moon harbor shoreline, quiet tide, warm dock lamp, black gold harbor",
            fingerprints: ["月港栖岸者", "温柔守护者", "moon harbor keeper", "moonharborkeeper", "gentle guardian", "gentleguardian", "月港"]
        ),
        BenyuanNativeArchetypeProfile(
            name: "存在游牧者",
            englishName: "The Existential Nomad",
            visualPrompt: "moving horizon beneath stars, existential nomad, dusk road and time fragments",
            fingerprints: ["存在游牧者", "existential nomad", "existentialnomad", "existential wanderer", "existentialwanderer", "游牧"]
        ),
        BenyuanNativeArchetypeProfile(
            name: "雨窗抒写者",
            englishName: "The Rain-Window Scribe",
            visualPrompt: "rain-lit window, paper texture, blue black night, soft gold reflection",
            fingerprints: ["雨窗抒写者", "rain window scribe", "rainwindowscribe", "melancholic poet", "melancholicpoet", "雨窗"]
        ),
        BenyuanNativeArchetypeProfile(
            name: "事件视界沉潜者",
            englishName: "The Event Horizon Diver",
            visualPrompt: "black hole event horizon, antique gold accretion rim, gravitational lens",
            fingerprints: ["事件视界沉潜者", "事件视界潜行者", "The Event Horizon Voyager", "Event Horizon Voyager", "event horizon diver", "eventhorizondiver", "black hole", "blackhole", "黑洞", "事件视界"]
        ),
        BenyuanNativeArchetypeProfile(
            name: "星云织梦者",
            englishName: "The Nebula Weaver",
            visualPrompt: "luminous nebula threads, violet ink, silver dust, woven cosmic cloud",
            fingerprints: ["星云织梦者", "nebula weaver", "nebulaweaver", "星云"]
        ),
        BenyuanNativeArchetypeProfile(
            name: "日冕引燃者",
            englishName: "The Solar Corona Igniter",
            visualPrompt: "dark sun, radiant solar corona, restrained gold and white fire",
            fingerprints: ["日冕引燃者", "日冕燃心者", "solar corona", "solarcorona", "太阳", "日冕"]
        ),
        BenyuanNativeArchetypeProfile(
            name: "类地栖居者",
            englishName: "The Terrestrial Dweller",
            visualPrompt: "earth-like terrestrial planet, quiet shorelines, warm window lights in deep space",
            fingerprints: ["类地栖居者", "terrestrial planet", "terrestrialplanet", "earth like", "earthlike", "类地", "栖居"]
        ),
        BenyuanNativeArchetypeProfile(
            name: "深空锚定者",
            englishName: "The Deep-Space Anchor",
            visualPrompt: "silver anchor coordinate in deep black space, calm geometry, moonlight",
            fingerprints: ["深空锚定者", "deep space anchor", "deepspaceanchor", "深空", "锚定"]
        )
    ]

    static func profile(for archetype: PsycheArchetype) -> BenyuanNativeArchetypeProfile? {
        let identities = [archetype.name, archetype.englishName]
            .map(normalize)
            .filter { !$0.isEmpty }

        if let canonical = profiles.first(where: { profile in
            identities.contains(normalize(profile.name)) || identities.contains(normalize(profile.englishName))
        }) {
            return canonical
        }

        if let legacy = profiles.first(where: { profile in
            profile.fingerprints.contains { fingerprint in
                identities.contains(normalize(fingerprint))
            }
        }) {
            return legacy
        }

        let rawIdentities = [archetype.name, archetype.englishName]
        return profiles.first { profile in
            rawIdentities.contains { identity in
                ([profile.name, profile.englishName] + profile.fingerprints)
                    .filter { $0.count >= 4 }
                    .contains { label in hasDelimitedLegacyPrefix(identity, label: label) }
            }
        }
    }

    static func canonicalNameForLegacyDisplay(_ value: String) -> String? {
        let normalized = normalize(value)
        guard !normalized.isEmpty else { return nil }
        for profile in profiles {
            if profile.fingerprints.contains(where: { normalized.contains(normalize($0)) }) {
                return profile.name
            }
        }
        return nil
    }

    static func removingArchetypeLabelPrefix(from value: String) -> String {
        let labels = profiles.flatMap { [$0.name, $0.englishName] + $0.fingerprints }
            .filter { $0.count >= 4 }
            .sorted { $0.count > $1.count }
        for label in labels {
            let escaped = NSRegularExpression.escapedPattern(for: label.trimmingCharacters(in: .whitespacesAndNewlines))
            let pattern = #"^\s*"# + escaped + #"\s*(?:：|:|·|•|\||/|—|–|-)\s*"#
            guard let range = value.range(of: pattern, options: [.regularExpression, .caseInsensitive]) else {
                continue
            }
            return String(value[range.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
        }
        return value.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func sanitizedPersonalizedName(_ value: String?, for profile: BenyuanNativeArchetypeProfile) -> String? {
        sanitizedPersonalizedValue(value, for: profile, maximumCount: 10)
    }

    static func sanitizedPersonalizedSubtitle(_ value: String?, for profile: BenyuanNativeArchetypeProfile) -> String? {
        sanitizedPersonalizedValue(value, for: profile, maximumCount: 38)
    }

    static func normalize(_ value: String) -> String {
        value
            .folding(options: [.caseInsensitive, .diacriticInsensitive, .widthInsensitive], locale: Locale(identifier: "zh_CN"))
            .replacingOccurrences(of: #"[\s\p{P}\p{S}_-]+"#, with: "", options: .regularExpression)
    }

    private static func hasDelimitedLegacyPrefix(_ value: String, label: String) -> Bool {
        let escaped = NSRegularExpression.escapedPattern(for: label.trimmingCharacters(in: .whitespacesAndNewlines))
        guard !escaped.isEmpty else { return false }
        return value.range(
            of: #"^\s*"# + escaped + #"\s*(?:：|:|—|–|-)\s*\S"#,
            options: [.regularExpression, .caseInsensitive]
        ) != nil
    }

    private static func sanitizedPersonalizedValue(_ value: String?, for profile: BenyuanNativeArchetypeProfile, maximumCount: Int) -> String? {
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !trimmed.isEmpty else { return nil }
        let normalized = normalize(trimmed)
        let containsOfficialOrRetiredLabel = profiles.contains { candidate in
            candidate.fingerprints.contains { fingerprint in
                let normalizedFingerprint = normalize(fingerprint)
                return !normalizedFingerprint.isEmpty && normalized.contains(normalizedFingerprint)
            }
        }
        if containsOfficialOrRetiredLabel { return nil }
        if normalized == normalize(profile.name) || normalized == normalize(profile.englishName) { return nil }
        if retiredPersonalizedLabels.contains(where: { normalized.contains(normalize($0)) }) { return nil }
        if trimmed.count > maximumCount { return nil }
        return trimmed
    }

    private static let retiredPersonalizedLabels = [
        "月门潜航者",
        "月背寻光者",
        "深月观测者",
        "暮潮拾光者",
        "暮海寻光者",
        "暮海守光者",
        "目光拾亡者",
        "月岸守望者",
        "暗潮守月人",
        "事件视界潜行者",
        "The Event Horizon Voyager",
        "Event Horizon Voyager",
        "日冕燃心者",
        "孤独求索者",
        "理性建构者",
        "温柔守护者",
        "Moonlit Seeker",
        "The Moonlit Seeker"
    ]
}
