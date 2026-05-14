import UIKit

extension BenyuanNativeFlowModel {
    static var previewAuthProviders: BenyuanAuthProvidersResponse {
        BenyuanAuthProvidersResponse(
            providers: [
                BenyuanAuthProviderCapability(provider: .anonymous, enabled: true, status: .ready, actions: ["login"]),
                BenyuanAuthProviderCapability(provider: .apple, enabled: true, status: .ready, actions: ["login"]),
                BenyuanAuthProviderCapability(provider: .wechat, enabled: false, status: .reserved, actions: ["login", "bind_wechat"]),
                BenyuanAuthProviderCapability(provider: .phone, enabled: false, status: .reserved, actions: ["login", "bind_phone"])
            ],
            capabilities: ["guest_login", "apple_login", "wechat_login", "bind_phone"]
        )
    }

    static var previewAuthSession: BenyuanAuthSession {
        BenyuanAuthSession(
            sessionId: "auth_native_preview",
            userId: "usr_native_preview",
            token: "bya_native_preview",
            provider: .anonymous,
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z"
        )
    }

    static var previewUser: BenyuanUser {
        BenyuanUser(
            userId: "usr_native_preview",
            createdAt: "2026-05-08T00:00:00.000Z",
            updatedAt: "2026-05-08T00:00:00.000Z",
            displayName: "本源预览用户",
            primaryProvider: .anonymous,
            providers: [
                "anonymous": "anonymous:native-preview",
                "apple": "apple:native-preview"
            ],
            phoneBound: false,
            wechatBound: false
        )
    }

    static var previewAccountHistory: [BenyuanAccountHistoryItem] {
        [
            BenyuanAccountHistoryItem(
                part1Id: "part1_native_preview",
                theaterScriptId: "theater_native_preview",
                part2Id: "part2_native_preview",
                constellationId: "const_native_preview",
                stage: .constellation,
                title: "远潮观月者的星图",
                subtitle: "剧场已完成 / 星图可回看",
                archetypeName: "远潮观月者",
                createdAt: "2026-05-08T20:12:00.000Z",
                updatedAt: "2026-05-08T20:18:00.000Z",
                assetCount: 3
            ),
            BenyuanAccountHistoryItem(
                part1Id: "part1_theater_preview",
                theaterScriptId: "theater_midnight_preview",
                part2Id: nil,
                constellationId: nil,
                stage: .theater,
                title: "午夜走廊里的第二幕",
                subtitle: "剧场进行中 / 等待选择",
                archetypeName: nil,
                createdAt: "2026-05-08T18:32:00.000Z",
                updatedAt: "2026-05-08T18:39:00.000Z",
                assetCount: 2
            ),
            BenyuanAccountHistoryItem(
                part1Id: "part1_draft_preview",
                theaterScriptId: nil,
                part2Id: nil,
                constellationId: nil,
                stage: .part1,
                title: "未完成的月相草稿",
                subtitle: "Part 1 收集中 / 还差图片线索",
                archetypeName: nil,
                createdAt: "2026-05-08T16:02:00.000Z",
                updatedAt: "2026-05-08T16:07:00.000Z",
                assetCount: 1
            )
        ]
    }

    static var previewUploadedAsset: BenyuanUploadedAssetRef {
        BenyuanUploadedAssetRef(
            assetId: "asset_native_preview_moon",
            questionId: "C2_precious_photo_analysis",
            name: "moon-memory.jpg",
            size: 224_000,
            mimeType: "image/jpeg",
            uploadedAt: "2026-05-08T00:00:00.000Z",
            uploadOrigin: "native-preview"
        )
    }

    static var previewUploadedAssets: [BenyuanUploadedAssetRef] {
        [
            previewUploadedAsset,
            BenyuanUploadedAssetRef(
                assetId: "asset_native_preview_room",
                questionId: "C2_precious_photo_analysis",
                name: "quiet-room.jpg",
                size: 186_000,
                mimeType: "image/jpeg",
                uploadedAt: "2026-05-08T00:01:00.000Z",
                uploadOrigin: "native-preview"
            )
        ]
    }

    static var previewThumbnails: [String: UIImage] {
        var next: [String: UIImage] = [:]
        for (index, asset) in previewUploadedAssets.enumerated() {
            next[asset.assetId] = previewThumbnail(index: index)
        }
        return next
    }

    private static func previewThumbnail(index: Int) -> UIImage {
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 320, height: 360))
        return renderer.image { context in
            let rect = CGRect(x: 0, y: 0, width: 320, height: 360)
            UIColor(red: 0.02, green: 0.02, blue: 0.05, alpha: 1).setFill()
            context.fill(rect)

            let center = CGPoint(x: index.isMultiple(of: 2) ? 188 : 132, y: index.isMultiple(of: 2) ? 150 : 188)
            let glow = CGGradient(
                colorsSpace: CGColorSpaceCreateDeviceRGB(),
                colors: [
                    UIColor(red: 0.72, green: 0.66, blue: 0.48, alpha: 0.34).cgColor,
                    UIColor(red: 0.18, green: 0.14, blue: 0.25, alpha: 0.20).cgColor,
                    UIColor.clear.cgColor
                ] as CFArray,
                locations: [0, 0.44, 1]
            )
            if let glow {
                context.cgContext.drawRadialGradient(glow, startCenter: center, startRadius: 8, endCenter: center, endRadius: 190, options: [])
            }

            UIColor(red: 0.78, green: 0.75, blue: 0.88, alpha: 0.42).setStroke()
            let orbit = UIBezierPath(ovalIn: CGRect(x: 42, y: 92, width: 236, height: 78))
            context.cgContext.saveGState()
            context.cgContext.translateBy(x: 160, y: 180)
            context.cgContext.rotate(by: index.isMultiple(of: 2) ? -0.34 : 0.42)
            context.cgContext.translateBy(x: -160, y: -180)
            orbit.lineWidth = 3
            orbit.stroke()
            context.cgContext.restoreGState()

            UIColor(red: 0.96, green: 0.97, blue: 1.0, alpha: 0.82).setFill()
            UIBezierPath(ovalIn: CGRect(x: center.x - 34, y: center.y - 34, width: 68, height: 68)).fill()

            UIColor(red: 0.72, green: 0.66, blue: 0.48, alpha: 0.95).setFill()
            UIBezierPath(ovalIn: CGRect(x: 72 + CGFloat(index * 128), y: 238, width: 18, height: 18)).fill()
        }
    }

    static var previewQuestions: [BenyuanQuestion] {
        [
            BenyuanQuestion(
                id: "A1_core_image",
                module: .a,
                title: "第一眼靠近的图像",
                prompt: "如果今晚只能带走一种画面，你会选择哪一种深处的光？",
                kind: .single,
                minSelections: nil,
                maxSelections: nil,
                options: [
                    BenyuanQuestionOption(id: "A1_1", text: "悬在黑潮上的月面，安静但有引力。", psychologicalSignal: "lunar_depth", tags: ["moon", "depth"]),
                    BenyuanQuestionOption(id: "A1_2", text: "一条低光走廊，尽头像有未说出口的答案。", psychologicalSignal: "liminal_corridor", tags: ["threshold", "desire"]),
                    BenyuanQuestionOption(id: "A1_3", text: "雾里慢慢亮起的城市，像记忆正在回到身体。", psychologicalSignal: "memory_city", tags: ["memory", "urban"])
                ],
                outputKey: "core_image",
                helperText: "这个选择会决定你的第一层视觉母题。",
                distributionKeys: nil,
                analysisDimensions: nil,
                acceptedFiles: nil,
                uploadRange: nil
            ),
            BenyuanQuestion(
                id: "B4_time_philosophy",
                module: .b,
                title: "时间分配",
                prompt: "把你的精神注意力分给过去、现在和未来。",
                kind: .distribution,
                minSelections: nil,
                maxSelections: nil,
                options: nil,
                outputKey: "time_philosophy",
                helperText: "比例不是事实，而是你当下的内部重力。",
                distributionKeys: [
                    BenyuanDistributionKey(key: "past", label: "过去"),
                    BenyuanDistributionKey(key: "present", label: "现在"),
                    BenyuanDistributionKey(key: "future", label: "未来")
                ],
                analysisDimensions: ["memory_weight", "presence", "projection"],
                acceptedFiles: nil,
                uploadRange: nil
            ),
            BenyuanQuestion(
                id: "C2_precious_photo_analysis",
                module: .c,
                title: "珍贵影像",
                prompt: "上传一张你舍不得删除的照片，让它成为剧场的入口。",
                kind: .upload,
                minSelections: nil,
                maxSelections: nil,
                options: nil,
                outputKey: "precious_photo_analysis",
                helperText: "照片不会被当作普通素材，它会参与后续剧情和星图解释。",
                distributionKeys: nil,
                analysisDimensions: ["attachment", "loss", "identity"],
                acceptedFiles: "image/*",
                uploadRange: BenyuanUploadRange(min: 1, max: 3)
            )
        ]
    }

    static var previewTheater: TheaterGenerateResponse {
        TheaterGenerateResponse(
            theaterScriptId: "theater_native_preview",
            part1Id: "part1_native_preview",
            runtime: AgentRuntimeResult(
                providerName: "preview",
                model: "local-fixture",
                mode: "fixture",
                source: "ios-native-preview",
                fallbackActive: false,
                error: nil
            ),
            theaterScript: TheaterScript(
                userId: "usr_native_preview",
                generatedAt: "2026-05-08T00:00:00.000Z",
                personalizationSummary: TheaterScript.PersonalizationSummary(
                    coreArchetype: "远潮观月者",
                    aestheticStyle: "低照度月面 / 黑潮 / 银白玻璃",
                    emotionalTone: "克制、敏感、缓慢靠近",
                    keyThemes: ["边界", "凝视", "未寄出的信"]
                ),
                act1: TheaterScript.Act1(
                    sceneDescription: "你站在一座没有门牌的月下剧场前，墙面像黑色海水，里面传来一段只属于你的旧音乐。",
                    visualPrompt: "deep lunar theater entrance, realistic black moon, restrained silver light",
                    ambientSound: "低频潮声与远处钢琴",
                    duration: 35
                ),
                act2: TheaterScript.Act2(choices: [
                    TheaterChoice(
                        choiceId: 1,
                        scene: "第一幕里，一位戴银色面具的人递给你一封没有署名的信。他说：你可以现在拆开，也可以带着它穿过走廊。",
                        options: [
                            TheaterChoiceOption(id: "open_now", text: "立刻拆开，承认自己想知道真相。", traitSignal: "direct_truth", response: "纸面像月光一样发冷。"),
                            TheaterChoiceOption(id: "carry_forward", text: "先收起来，等到更深处再读。", traitSignal: "deferred_intimacy", response: "信封在掌心变得很重。")
                        ]
                    ),
                    TheaterChoice(
                        choiceId: 2,
                        scene: "走廊尽头有两扇门：一扇传来熟悉的声音，一扇完全安静，却透出微弱银光。",
                        options: [
                            TheaterChoiceOption(id: "familiar_voice", text: "推开有声音的门，面对旧关系的回声。", traitSignal: "relationship_return", response: "声音停顿了一下，像等你命名它。"),
                            TheaterChoiceOption(id: "silent_light", text: "走向安静的银光，选择暂时不解释。", traitSignal: "inner_boundary", response: "银光落在你的肩上，像一层新的边界。")
                        ]
                    )
                ]),
                act3: TheaterScript.Act3(
                    sceneDescription: "镜厅中央出现一口黑色水井，水面映出的不是脸，而是你还没有说出口的愿望。",
                    mirrorQuestions: [
                        TheaterMirrorQuestion(
                            questionId: 1,
                            dialogue: "水井问：你最常用什么方式保护自己？",
                            question: "当别人靠近你的核心时，你更像哪一种反应？",
                            options: [
                                TheaterMirrorQuestionOption(id: "name_boundary", text: "说清界限，但仍留在现场。", traitSignal: "secure_boundary"),
                                TheaterMirrorQuestionOption(id: "vanish", text: "先消失，让对方猜不到入口。", traitSignal: "withdrawal")
                            ]
                        ),
                        TheaterMirrorQuestion(
                            questionId: 2,
                            dialogue: "面具人把信还给你：现在你可以决定它要不要被寄出。",
                            question: "你想把哪一部分自己交给世界？",
                            options: [
                                TheaterMirrorQuestionOption(id: "unfinished_desire", text: "还没完成、但真实的愿望。", traitSignal: "emergent_desire"),
                                TheaterMirrorQuestionOption(id: "precise_silence", text: "不解释的沉默和选择。", traitSignal: "aesthetic_silence")
                            ]
                        )
                    ],
                    mirrorFinalWords: "你不是没有答案，你只是不愿把答案交给不够深的场合。"
                ),
                epilogue: TheaterScript.Epilogue(
                    sceneDescription: "剧场天顶缓慢打开，一枚黑月从银白轨道后方升起。",
                    closingText: "最后一镜没有替你总结，它只是把你的停顿、选择和回望压成一枚精神星核。",
                    transitionPrompt: "从剧场过渡到星图生成",
                    transitionAnimation: "deep-moon-continuous-shot"
                )
            )
        )
    }

    static var previewConstellation: ConstellationGenerateResponse {
        previewConstellation(archetypeVariant: nil)
    }

    static func previewConstellation(archetypeVariant: String?) -> ConstellationGenerateResponse {
        let archetype = previewArchetype(variant: archetypeVariant)
        return ConstellationGenerateResponse(
            constellationId: "const_native_preview",
            runtime: AgentRuntimeResult(
                providerName: "preview",
                model: "local-fixture",
                mode: "fixture",
                source: "ios-native-preview",
                fallbackActive: false,
                error: nil
            ),
            psycheConstellation: PsycheConstellation(
                userId: "usr_native_preview",
                generatedAt: "2026-05-08T00:00:00.000Z",
                archetype: archetype,
                sevenDimensions: [
                    "openness": PsycheDimension(score: 86, interpretation: "你更容易被未命名的经验吸引，愿意把不确定当作入口，而不是噪声。"),
                    "meaning_seeking": PsycheDimension(score: 91, interpretation: "你会把关系、选择和作品放进更大的意义结构里反复观看。"),
                    "aesthetic_sensitivity": PsycheDimension(score: 88, interpretation: "氛围、材质与语气会直接影响你对一件事是否真实的判断。"),
                    "emotional_depth": PsycheDimension(score: 79, interpretation: "情绪很少只停在表层，你会追问它背后的需要与防御。"),
                    "independence": PsycheDimension(score: 74, interpretation: "你需要自己的节奏，不喜欢被过早定义，也不愿把复杂性降成口号。"),
                    "action_tendency": PsycheDimension(score: 63, interpretation: "你并非缺少行动，而是需要先确认动作和内在方向之间没有背叛。"),
                    "relationship_need": PsycheDimension(score: 69, interpretation: "你期待一种安静但稳定的回应，能接住复杂性，而不是急着把你变简单。")
                ],
                narrativeOverview: "你像一颗慢速经过黑潮的月体：外侧安静，内部却持续发生潮汐。你不是单纯回避世界，而是在等待一种能与你的深度相称的抵达。",
                coreTensions: [
                    PsycheConstellation.CoreTension(
                        tensionId: 1,
                        name: "靠近与隐退",
                        description: "你渴望被真正理解，又会在被粗略理解时迅速后撤。",
                        growthDirection: "练习把边界说清，而不是只用消失保护自己。"
                    ),
                    PsycheConstellation.CoreTension(
                        tensionId: 2,
                        name: "意义与行动",
                        description: "你会先寻找精神上的准确性，因此有时推迟了现实中的第一步。",
                        growthDirection: "允许一个不完美动作先发生，再让意义慢慢跟上。"
                    )
                ],
                growthSuggestions: [
                    PsycheConstellation.GrowthSuggestion(
                        title: "给暗面一个出口",
                        description: "把不愿被立刻解释的部分保留下来，但给它一个可被看见的形状。",
                        actionableSteps: ["今晚写下三个不需要立刻解决的问题。", "选择一张最接近当下心境的图，给它命名。"]
                    )
                ],
                recommendations: PsycheConstellation.Recommendations(
                    books: [
                        PsycheConstellation.Recommendations.Book(title: "局外人", author: "阿尔贝·加缪", reason: "关于疏离感与真实感之间的冷光。"),
                        PsycheConstellation.Recommendations.Book(title: "月亮与六便士", author: "毛姆", reason: "关于自我召唤如何压过日常秩序。")
                    ],
                    films: [
                        PsycheConstellation.Recommendations.Film(title: "潜行者", director: "安德烈·塔可夫斯基", reason: "像进入内在禁区的一次缓慢长镜头。"),
                        PsycheConstellation.Recommendations.Film(title: "花样年华", director: "王家卫", reason: "克制、错身与没有说出口的情感秩序。")
                    ],
                    music: [
                        PsycheConstellation.Recommendations.Music(artist: "坂本龙一", album: "async", reason: "像一层缓慢展开的精神潮汐。"),
                        PsycheConstellation.Recommendations.Music(artist: "Tim Hecker", album: "Virgins", reason: "噪声、庄严与不可完全解释的深场。")
                    ]
                )
            )
        )
    }

    static func previewArchetype(variant: String?) -> PsycheArchetype {
        switch variant?.lowercased() {
        case "moonlit-seeker", "moonlit_seeker", "far-tide-moon", "far_tide_moon", "lone-seeker", "lone_seeker":
            return PsycheArchetype(
                name: "远潮观月者",
                englishName: "The Moonlit Seeker",
                personalizedName: "远潮边的守信者",
                personalizedSubtitle: "把黑潮、月面与未寄出的信收成一条安静潮汐",
                coreEssence: "你常在幽暗、审美与记忆的回声里辨认意义，也愿意为真实保留足够的精神纵深。",
                visualPrompt: "moonlit far tide over deep sea, lunar mist, restrained gold light"
            )
        case "star-map-architect", "star_map_architect", "rational-builder", "rational_builder":
            return PsycheArchetype(
                name: "星图筑序者",
                englishName: "The Star-Map Architect",
                personalizedName: "银线结构的校准者",
                personalizedSubtitle: "用几何星图替混乱搭出可以落脚的秩序",
                coreEssence: "你用结构、秩序和可持续的节律把混沌折成可行的星图，也借此安放自己的复杂感受。",
                visualPrompt: "geometric star-map architecture, measured silver gold nodes, clean midnight grid"
            )
        case "moon-harbor-keeper", "moon_harbor_keeper", "gentle-guardian", "gentle_guardian":
            return PsycheArchetype(
                name: "月港栖岸者",
                englishName: "The Moon-Harbor Keeper",
                personalizedName: "月港灯下的留守者",
                personalizedSubtitle: "在岸线、灯影与潮声之间为重要之物保留温度",
                coreEssence: "你用温度、稳定与连接感为重要的人点灯，也在学习把自己的容量放回中心。",
                visualPrompt: "moon harbor shoreline, warm dock lamp, quiet tide, restrained black gold palette"
            )
        case "existential-nomad", "existential_nomad", "existential-wanderer", "existential_wanderer":
            return PsycheArchetype(
                name: "存在游牧者",
                englishName: "The Existential Nomad",
                personalizedName: "无名路口的追问者",
                personalizedSubtitle: "沿着移动地平线，把未完成的问题带向下一处星路",
                coreEssence: "你不断移动、不断追问，也在变化和不确定里寻找一种仍能认出自己的活法。",
                visualPrompt: "moving horizon beneath stars, dusk road, existential nomad, floating time fragments"
            )
        case "rain-window-scribe", "rain_window_scribe", "melancholic-poet", "melancholic_poet":
            return PsycheArchetype(
                name: "雨窗抒写者",
                englishName: "The Rain-Window Scribe",
                personalizedName: "雨窗后的译梦者",
                personalizedSubtitle: "把雨痕、纸页与旧光写成一封给自己的回信",
                coreEssence: "你会把复杂情绪、审美回声与记忆细节留得很近，再慢慢把它们变成理解世界的语言。",
                visualPrompt: "rain-lit window, blue black velvet night, soft gold reflection, tactile paper texture"
            )
        case "event-horizon-diver", "event_horizon_diver", "black-hole", "black_hole", "event-horizon", "event_horizon":
            return PsycheArchetype(
                name: "事件视界沉潜者",
                englishName: "The Event Horizon Diver",
                personalizedName: "黑潮边的守信者",
                personalizedSubtitle: "把未寄出的海与剧场里的长停顿收成一条暗金轨道",
                coreEssence: "你习惯在强引力前保持清醒，只把自己交给足够深的入口。",
                visualPrompt: "black hole event horizon with antique gold accretion rim, restrained cosmic gravity"
            )
        case "nebula-weaver", "nebula_weaver", "nebula":
            return PsycheArchetype(
                name: "星云织梦者",
                englishName: "The Nebula Weaver",
                personalizedName: "雾光里的编织者",
                personalizedSubtitle: "把梦、迟疑和回声织成一片柔软星云",
                coreEssence: "你不急着把混乱变成答案，而是先让它浮现出纹理。",
                visualPrompt: "luminous nebula threads, soft violet ink and silver dust, delicate cosmic studio"
            )
        case "solar", "solar-corona", "solar_corona":
            return PsycheArchetype(
                name: "日冕引燃者",
                englishName: "The Solar Corona",
                personalizedName: "暗日旁的燃心者",
                personalizedSubtitle: "在克制外壳下保留一圈不肯熄灭的热量",
                coreEssence: "你会压低声量，但生命力并没有退场，只是在等待正确的释放方式。",
                visualPrompt: "dark sun with radiant solar corona, restrained gold and white fire"
            )
        case "terrestrial", "terrestrial-planet", "terrestrial_planet":
            return PsycheArchetype(
                name: "类地栖居者",
                englishName: "The Terrestrial Planet",
                personalizedName: "暗岸上的栖居者",
                personalizedSubtitle: "在深空里寻找可以安放身体与记忆的岸",
                coreEssence: "你需要真实、可触摸的秩序，让精神深处也能落地。",
                visualPrompt: "dark earth-like terrestrial planet, quiet forests and shorelines, warm window lights"
            )
        case "deep-space-anchor", "deep_space_anchor", "deep-space", "deep_space", "anchor":
            return PsycheArchetype(
                name: "深空锚定者",
                englishName: "The Deep Space Anchor",
                personalizedName: "静默坐标的锚定者",
                personalizedSubtitle: "在漫长黑场里守住一枚不会漂移的银白坐标",
                coreEssence: "你不是拒绝远方，而是需要先确认自己不会在远方里失重。",
                visualPrompt: "lone silver anchor in deep black space, calm geometry, restrained moonlight"
            )
        default:
            return PsycheArchetype(
                name: "远潮观月者",
                englishName: "The Moonlit Seeker",
                personalizedName: "远潮边的守信者",
                personalizedSubtitle: "把黑潮、月面与未寄出的信收成一条安静潮汐",
                coreEssence: "你常在幽暗、审美与记忆的回声里辨认意义，也愿意为真实保留足够的精神纵深。",
                visualPrompt: "moonlit far tide over deep sea, lunar mist, restrained gold light"
            )
        }
    }
}
