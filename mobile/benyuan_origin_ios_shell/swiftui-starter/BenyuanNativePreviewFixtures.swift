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
                    sceneDescription: "你醒来时，站在一片很深的月场边缘。远处的黑色天体缓慢转动，边缘有一圈暗金色的光。脚下不是地面，而是一层半透明的潮水；潮水下压着一张被银光擦亮的照片轮廓，像有人把你交出的某个画面折进了这里。\n\n空气里有那段旧音乐，低得像从月背传来。它不是背景乐，更像这个空间自己的呼吸。某处传来一句很轻的话：那封没有寄出的信，还没有离开你。这句话没有被解释，只是在你身边绕了一圈，落成一条通向前方的细线。\n\n一封没有署名的信浮在潮水上，信封背面有照片里的光。旁边几颗暗金粒子沿着同一个位置反复靠近，像在复现你刚才某一次停顿。更远处有一条窄桥，桥另一端的银白光线忽明忽暗，像在等你决定要不要把这段距离继续往前推。\n\n你意识到，这不是为了让你回答问题而临时搭出来的场景。它更像前面那些画面、声音、句子和停顿，被折成了一段只能由你继续往下走的小说。你只需要沿着第一条细线靠近，看看它会把你带到哪里。",
                    visualPrompt: "deep lunar theater entrance, realistic black moon, restrained silver light",
                    ambientSound: "低频潮声与远处钢琴",
                    duration: 35
                ),
                act2: TheaterScript.Act2(choices: [
                    TheaterChoice(
                        choiceId: 1,
                        scene: "入口打开后，那封没有寄出的信浮在黑潮上。信封没有署名，背面却压着照片里的银白光线。旧音乐在剧场深处重复同一个小节，像在问你：要不要先承认自己已经听见了它？",
                        options: [
                            TheaterChoiceOption(id: "letter_open", text: "靠近信封，让第一行字自己浮出来。", traitSignal: "direct_truth", response: "纸面没有完全展开，只露出一句很轻的话，像真相先试探了你一下。"),
                            TheaterChoiceOption(id: "letter_hold", text: "先把信收进掌心，等潮声变慢。", traitSignal: "deferred_intimacy", response: "信封变得很重，但重量并不压迫你，反而像给了你一个可以停留的位置。"),
                            TheaterChoiceOption(id: "letter_reflect", text: "把信举向银光，看背面的照片轮廓。", traitSignal: "observational_boundary", response: "银光沿着纸背游动，你发现自己不是不想知道，只是不愿被太快命名。"),
                            TheaterChoiceOption(id: "letter_avoid", text: "绕过信封，先听清那段旧音乐。", traitSignal: "aesthetic_deferral", response: "音乐替你保留了答案。它没有催促，只把你带向剧场更深处。")
                        ]
                    ),
                    TheaterChoice(
                        choiceId: 2,
                        scene: "你带着信往里走，走廊变成一条窄桥。桥的一侧是熟悉的声音，另一侧是完全安静的银光。桥中央摆着那张照片，画面里被保存下来的距离，正在变成你和某个人之间的距离。",
                        options: [
                            TheaterChoiceOption(id: "voice_door", text: "推开有声音的门，确认那是谁的回声。", traitSignal: "relationship_return", response: "声音停顿了一下，像终于被你认出，但还没有要求你回答。"),
                            TheaterChoiceOption(id: "silver_door", text: "走向安静的银光，先保留解释。", traitSignal: "inner_boundary", response: "银光落在你的肩上，像一层新的边界，让靠近不必立刻变成暴露。"),
                            TheaterChoiceOption(id: "photo_bridge", text: "停在桥中央，看照片如何被两边照亮。", traitSignal: "tension_tolerance", response: "照片没有选边。它把声音和银光同时留住，像承认你也可以暂时不二选一。"),
                            TheaterChoiceOption(id: "step_back", text: "后退半步，让对方的声音先靠近。", traitSignal: "relational_caution", response: "桥没有因为你的后退而断开。你只是想确认，靠近的人是否懂得放轻脚步。")
                        ]
                    ),
                    TheaterChoice(
                        choiceId: 3,
                        scene: "桥尽头出现一枚小小的黑色星体。它没有吞没信、照片或声音，只把它们拉进同一圈暗金轨道。你终于看见：剧场一直不是在逼你选择答案，而是在显影你保存自己的方式。",
                        options: [
                            TheaterChoiceOption(id: "orbit_stabilize", text: "把信贴近胸口，先让轨道稳定下来。", traitSignal: "security_need", response: "星体的转速慢了一点。你把稳定当成容器，而不是退路。"),
                            TheaterChoiceOption(id: "edge_touch", text: "伸手触碰星体边缘，允许未知靠近。", traitSignal: "exploration_desire", response: "你的指尖没有被吞没，只沾上一层冷银色的光。未知没有回答你，却承认你已经抵达。"),
                            TheaterChoiceOption(id: "dual_gravity", text: "留在两股引力之间，听它们同时说话。", traitSignal: "ambiguity_capacity", response: "两股引力没有互相抵消。它们像两条潮线，让你知道矛盾也可以形成轨道。"),
                            TheaterChoiceOption(id: "hidden_exit", text: "沿着暗金轨道，寻找没有标出的出口。", traitSignal: "creative_reframing", response: "轨道在脚下分出第三条细线，很窄，却贴合你的步子，像给不愿二选一的人留下的路。")
                        ]
                    ),
                    TheaterChoice(
                        choiceId: 4,
                        scene: "黑色星体把信、照片、旧音乐和桥上的回声压成一枚很小的月。星图还没有开始命名你，它先停在最后一道门前：如果要把这些线索交给它，你更愿意让它先看见哪一层？",
                        options: [
                            TheaterChoiceOption(id: "final_origin", text: "把那些总会回来的旧画面交给星图。", traitSignal: "self_narrative_time", response: "旧画面没有把你困住，它只是把你反复回望的方向照亮。"),
                            TheaterChoiceOption(id: "final_desire", text: "把迟迟没有说出口的靠近放进月光里。", traitSignal: "desire_structure", response: "那件事没有立刻变亮，却在暗处多了一圈清晰的边。"),
                            TheaterChoiceOption(id: "final_boundary", text: "把保护自己的边界放到暗金轨道上。", traitSignal: "object_distance_boundary", response: "暗金轨道贴近了一点，像承认边界也是一种靠近的方式。"),
                            TheaterChoiceOption(id: "final_action", text: "把犹豫之后仍会前行的那一步交给桥。", traitSignal: "action_after_hesitation", response: "桥的尽头出现了下一步台阶，不宽，但足够让你带着迟疑继续前行。")
                        ]
                    )
                ]),
                act3: TheaterScript.Act3(
                    sceneDescription: "黑色星体慢慢展开，信、照片、旧音乐和桥上的回声都停在同一圈暗金轨道里。接下来不是继续猜谜，而是把刚才的选择往里问一点：你为什么靠近、为什么停下，又在保护什么。",
                    mirrorQuestions: [
                        TheaterMirrorQuestion(
                            questionId: 1,
                            dialogue: "旧音乐被潮声重新送回来。它不要求你解释，只帮你辨认：刚才你保留或靠近时，最接近哪一种原因？",
                            question: "刚才的选择，更像是因为什么？",
                            options: [
                                TheaterMirrorQuestionOption(id: "mirror_understood", text: "我想被真正听懂，但不想被急着解释。", traitSignal: "being_understood_desire"),
                                TheaterMirrorQuestionOption(id: "mirror_self", text: "我需要先确认自己的感受，再决定怎么说。", traitSignal: "self_exploration"),
                                TheaterMirrorQuestionOption(id: "mirror_lamp", text: "我想先确认这件事不会打乱我的边界。", traitSignal: "security_need"),
                                TheaterMirrorQuestionOption(id: "mirror_tide", text: "我更想保留一点自由，不被任何答案固定住。", traitSignal: "freedom_desire"),
                                TheaterMirrorQuestionOption(id: "mirror_core", text: "我在意它是否真的有意义，而不只是情绪。", traitSignal: "meaning_seeking"),
                                TheaterMirrorQuestionOption(id: "mirror_breathe", text: "我需要先把心里的波动放稳，再继续靠近。", traitSignal: "emotional_regulation")
                            ]
                        ),
                        TheaterMirrorQuestion(
                            questionId: 2,
                            dialogue: "照片翻到背面，细小裂纹把时间分成几层。过去、现在、未来，还有别人看你的方式，都在轻轻拉住你。",
                            question: "如果要更准确地理解你，星图应该先看哪一部分？",
                            options: [
                                TheaterMirrorQuestionOption(id: "past_light", text: "先看我总会回头想起的那部分过去。", traitSignal: "past_oriented"),
                                TheaterMirrorQuestionOption(id: "present_light", text: "先看我现在真正想改变的现实处境。", traitSignal: "action_willingness"),
                                TheaterMirrorQuestionOption(id: "future_light", text: "先看我对未来最放不下的不确定感。", traitSignal: "future_oriented"),
                                TheaterMirrorQuestionOption(id: "external_light", text: "先看我为什么会在意别人怎么看我。", traitSignal: "external_validation_need"),
                                TheaterMirrorQuestionOption(id: "inner_light", text: "先看我对自己最难放松的那一面。", traitSignal: "self_acceptance"),
                                TheaterMirrorQuestionOption(id: "still_light", text: "先看我怎样在矛盾里仍然保持平静。", traitSignal: "acceptance_tendency")
                            ]
                        )
                    ],
                    mirrorFinalWords: "追问没有替你下结论，只把刚才的选择收成一枚很小的月。它落进你掌心，像在说：你带走的不是标准答案，而是一条更接近自己的轨道。"
                ),
                epilogue: TheaterScript.Epilogue(
                    sceneDescription: "剧场天顶缓慢打开，黑色星体退到更远处，暗金轨道却留在你脚下。",
                    closingText: "这一幕没有结束，它只是换成了星体的语言。现在，星图开始显影。",
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
                englishName: "The Far-Tide Moon Watcher",
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
                englishName: "The Solar Corona Igniter",
                personalizedName: "暗日旁的燃心者",
                personalizedSubtitle: "在克制外壳下保留一圈不肯熄灭的热量",
                coreEssence: "你会压低声量，但生命力并没有退场，只是在等待正确的释放方式。",
                visualPrompt: "dark sun with radiant solar corona, restrained gold and white fire"
            )
        case "terrestrial", "terrestrial-planet", "terrestrial_planet":
            return PsycheArchetype(
                name: "类地栖居者",
                englishName: "The Terrestrial Dweller",
                personalizedName: "暗岸上的栖居者",
                personalizedSubtitle: "在深空里寻找可以安放身体与记忆的岸",
                coreEssence: "你需要真实、可触摸的秩序，让精神深处也能落地。",
                visualPrompt: "dark earth-like terrestrial planet, quiet forests and shorelines, warm window lights"
            )
        case "deep-space-anchor", "deep_space_anchor", "deep-space", "deep_space", "anchor":
            return PsycheArchetype(
                name: "深空锚定者",
                englishName: "The Deep-Space Anchor",
                personalizedName: "静默坐标的锚定者",
                personalizedSubtitle: "在漫长黑场里守住一枚不会漂移的银白坐标",
                coreEssence: "你不是拒绝远方，而是需要先确认自己不会在远方里失重。",
                visualPrompt: "lone silver anchor in deep black space, calm geometry, restrained moonlight"
            )
        default:
            return PsycheArchetype(
                name: "远潮观月者",
                englishName: "The Far-Tide Moon Watcher",
                personalizedName: "远潮边的守信者",
                personalizedSubtitle: "把黑潮、月面与未寄出的信收成一条安静潮汐",
                coreEssence: "你常在幽暗、审美与记忆的回声里辨认意义，也愿意为真实保留足够的精神纵深。",
                visualPrompt: "moonlit far tide over deep sea, lunar mist, restrained gold light"
            )
        }
    }
}
