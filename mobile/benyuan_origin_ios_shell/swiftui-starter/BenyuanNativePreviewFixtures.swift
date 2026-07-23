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
            wechatBound: false,
            avatarSymbol: "moon.stars.fill",
            profileStatus: "complete",
            birthYear: 1994,
            gender: "undisclosed",
            profileBio: "把月光、影像和选择收进同一份档案。"
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
                helperText: nil,
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
                helperText: nil,
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
                prompt: "上传一张你舍不得删除的照片。",
                kind: .upload,
                minSelections: nil,
                maxSelections: nil,
                options: nil,
                outputKey: "precious_photo_analysis",
                helperText: nil,
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
                    sceneDescription: "晚上十点四十分，你赶到临海旧城区一间即将清空的照相馆。店主半小时前发来消息：整理最后一批物件时，他找到一只写着你名字的纸袋，只能替你保管到清运人员到达。\n\n门虚掩着，雨水把街灯映在地面上。后屋的旧音箱循环一段没有人声的音乐。柜台便条写着：纸袋里有两样东西，其中一件不该由店主替你决定。\n\n手机在这时亮起。那个很久没有联系、却曾和你共同保管这些东西的人发来一句：“我在街对面。你先看，决定要不要见我。”后巷已经传来推车撞上铁门的声音。\n\n你只剩二十分钟。门、电话和柜台登记簿都在伸手可及的地方，故事从你的第一个动作开始。",
                    visualPrompt: "deep lunar theater entrance, realistic black moon, restrained silver light",
                    ambientSound: "低频潮声与远处钢琴",
                    duration: 35
                ),
                act2: TheaterScript.Act2(choices: [
                    TheaterChoice(
                        choiceId: 1,
                        scene: "店主去后屋找封存单，门口只剩你和纸袋。街对面的人影没有移动，后巷的推车声却越来越近。你必须先决定从哪里弄清这件事。",
                        options: [
                            TheaterChoiceOption(id: "letter_open", text: "先回电话，确认是谁留下了纸袋。", traitSignal: "action_entry + direct_approach", response: "店主接起电话，告诉你寄存人没有留姓名，只确认你会亲自来取。"),
                            TheaterChoiceOption(id: "letter_hold", text: "推门进去，查看柜台上的登记簿。", traitSignal: "action_entry + information_first", response: "登记簿最后一页有两种笔迹，其中一行被划掉，却还看得出日期。"),
                            TheaterChoiceOption(id: "letter_reflect", text: "把地址发给朋友，请他在门外等你。", traitSignal: "action_entry + relational_support", response: "朋友回了一个定位，说十分钟后到。你不再需要独自处理现场。"),
                            TheaterChoiceOption(id: "letter_avoid", text: "绕到侧门，确认屋里是否还有人。", traitSignal: "action_entry + cautious_scan", response: "侧门没有上锁，门后放着一把湿伞，说明有人比你更早进过这里。")
                        ]
                    ),
                    TheaterChoice(
                        choiceId: 2,
                        scene: "纸袋里有一张旧照片和一把小钥匙。街对面的人发来消息：“照片是我放进去的，钥匙不是。”TA 已经走到门外，却停在雨棚边，没有自行进来。",
                        options: [
                            TheaterChoiceOption(id: "voice_door", text: "请对方进来，当面把事情说清。", traitSignal: "object_distance + direct_contact", response: "TA 进门后先放下湿伞，没有碰桌上的东西，只解释了照片的来处。"),
                            TheaterChoiceOption(id: "silver_door", text: "走到街对面，只先问一个问题。", traitSignal: "object_distance + bounded_contact", response: "你们隔着一张空桌坐下。对方回答了那个问题，没有顺势要求更多。"),
                            TheaterChoiceOption(id: "photo_bridge", text: "发一张现场照片，等对方先开口。", traitSignal: "relationship_mirror_need + reciprocal_signal", response: "对方看完照片，发来一段短语音，先说了自己隐瞒的部分。"),
                            TheaterChoiceOption(id: "step_back", text: "暂时不回复，先看完纸袋里的东西。", traitSignal: "object_distance + delayed_contact", response: "门外的人没有催促。纸袋底部还有一张折过两次的收据。")
                        ]
                    ),
                    TheaterChoice(
                        choiceId: 3,
                        scene: "钥匙打开了柜台抽屉。里面有两只盒子：一只贴着你的名字，另一只属于门外的人。清运人员开始敲后门，店主说只能再留十分钟。",
                        options: [
                            TheaterChoiceOption(id: "orbit_stabilize", text: "带走两只盒子，明天再逐一归还。", traitSignal: "desire_structure + temporary_control", response: "店主把两只盒子装进同一个袋子。门外的人看见了，但没有阻止你。"),
                            TheaterChoiceOption(id: "edge_touch", text: "只拿属于你的，把另一只留在柜台。", traitSignal: "boundary_integrity + separate_ownership", response: "你的盒子比想象中轻。另一只留在原处，等它的主人自己伸手。"),
                            TheaterChoiceOption(id: "dual_gravity", text: "请对方进来，你们一起决定归属。", traitSignal: "desire_structure + joint_decision", response: "你们同时站到抽屉前。店主把清单推过来，让两个人各自签名。"),
                            TheaterChoiceOption(id: "hidden_exit", text: "拍下现状后全部放回，今晚先离开。", traitSignal: "boundary_integrity + defer_commitment", response: "照片保存了盒子的位置和封条。店主同意把抽屉单独锁到明早。")
                        ]
                    ),
                    TheaterChoice(
                        choiceId: 4,
                        scene: "清运车的灯照进门口，最后五分钟开始倒数。对方终于说，盒子里真正需要处理的是一份当年没有共同签下的决定。你必须给今晚一个明确的收尾。",
                        options: [
                            TheaterChoiceOption(id: "final_origin", text: "把那份决定交给对方，当面说出实情。", traitSignal: "defense_style + direct_expression", response: "对方接过文件，没有立即回答。事情终于停在两个人都看得见的地方。"),
                            TheaterChoiceOption(id: "final_desire", text: "带走自己的部分，约定明晚再谈。", traitSignal: "time_gravity + planned_reentry", response: "你们在同一张便条上写下时间。延期不再是消失，而是有尽头的等待。"),
                            TheaterChoiceOption(id: "final_boundary", text: "请店主继续保管，并写下回复日期。", traitSignal: "defense_style + structured_delay", response: "店主封好抽屉，把日期写在两张收据上。决定被推迟，但没有被抹去。"),
                            TheaterChoiceOption(id: "final_action", text: "先把所有物品转到安全处，停止争论。", traitSignal: "meaning_orientation + practical_containment", response: "你们一起把箱子搬离门口。今晚先保住事实，剩下的话留到之后。")
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
                        actionableSteps: [
                            "今晚只记录一个反复出现的画面，用来把模糊情绪从身体里移到纸面上；这样做会让你更容易辨认它是否一直指向同一个张力。",
                            "选择一张最接近当下心境的图，给它命名，用来让潜意识母题先获得一个可看见的形状；这样做会减少反复解释自己的压力。"
                        ]
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
