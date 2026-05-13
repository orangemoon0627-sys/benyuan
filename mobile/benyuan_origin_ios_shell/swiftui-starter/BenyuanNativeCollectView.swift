import SwiftUI

struct BenyuanNativeCollectView: View {
    @ObservedObject var model: BenyuanNativeFlowModel
    @State private var pickingQuestion: BenyuanQuestion?
    @State private var replacesExistingUpload = false
    @State private var novaBurstOptionId: String?
    @State private var novaBurstToken = 0
    private let collectBottomSafeSpace: CGFloat = 178

    var body: some View {
        VStack(spacing: 0) {
            BenyuanNativeTopBar(progress: model.progress, label: "线索收集 \(model.answeredCount)/\(model.questions.count)", onAccount: model.showAccount)

            if let question = model.currentQuestion {
                ScrollView(showsIndicators: false) {
                    BenyuanQuestionStepMotion(direction: model.questionMotionDirection, token: model.questionMotionToken) {
                        BenyuanRevealedStack(spacing: BenyuanSpacing.x4) {
                            if question.kind == .upload {
                                uploadHeader(question)
                            } else {
                                questionHeader(question)
                            }
                            questionBody(question)
                        }
                    }
                    .id(model.activeQuestionIndex)
                    .padding(.horizontal, BenyuanSpacing.x4)
                    .padding(.top, question.kind == .upload ? BenyuanSpacing.x6 : BenyuanSpacing.x8)
                    .padding(.bottom, collectBottomSafeSpace)
                }
            } else {
                Spacer()
                ProgressView()
                    .tint(BenyuanColor.accentGold)
                Spacer()
            }

            bottomBar
        }
        .sheet(item: $pickingQuestion) { question in
            let existingCount = replacesExistingUpload ? 0 : model.uploadedAssets(for: question.id).count
            let limit = max(1, (question.uploadRange?.max ?? 1) - existingCount)
            BenyuanNativeImagePicker(limit: limit) { images in
                let shouldReplace = replacesExistingUpload
                replacesExistingUpload = false
                Task {
                    if shouldReplace {
                        await model.uploadImages(images, for: question, origin: "native-library", mode: .replace)
                    } else {
                        await model.uploadImages(images, for: question, origin: "native-library", mode: .append)
                    }
                }
            }
            .onDisappear {
                replacesExistingUpload = false
            }
        }
    }

    private func questionHeader(_ question: BenyuanQuestion) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
            HStack {
                Text("\(String(format: "%02d", model.activeQuestionIndex + 1)) / \(String(format: "%02d", model.questions.count))")
                    .font(.system(size: 12, weight: .black, design: .monospaced))
                    .foregroundStyle(BenyuanColor.accentGold)
                Spacer()
            }

            Text(question.prompt)
                .font(.system(size: questionTitleSize(question.prompt), weight: .semibold))
                .lineSpacing(4)
                .foregroundStyle(BenyuanColor.textPrimary)
                .minimumScaleFactor(0.82)

            BenyuanQuestionSignalField(progress: model.progress, module: question.module)
                .frame(height: 112)

            if question.kind == .upload {
                Text(question.helperText ?? "选择图片线索，上传后会进入多模态分析。")
                    .font(.system(size: 14, weight: .semibold))
                    .lineSpacing(5)
                    .foregroundStyle(BenyuanColor.textSecondary)
            }
        }
    }

    private func uploadHeader(_ question: BenyuanQuestion) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
            HStack(alignment: .firstTextBaseline) {
                Text("\(String(format: "%02d", model.activeQuestionIndex + 1)) / \(String(format: "%02d", model.questions.count))")
                    .font(.system(size: 12, weight: .black, design: .monospaced))
                    .foregroundStyle(BenyuanColor.accentGold)
                Spacer()
            }

            Text(question.prompt)
                .font(.system(size: uploadQuestionTitleSize(question.prompt), weight: .semibold))
                .lineSpacing(4)
                .foregroundStyle(BenyuanColor.textPrimary)
                .minimumScaleFactor(0.82)

            Text(question.helperText ?? "选择图片线索，上传后会进入多模态分析。")
                .font(.system(size: 13, weight: .regular))
                .lineSpacing(5)
                .foregroundStyle(BenyuanColor.textSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private func questionBody(_ question: BenyuanQuestion) -> some View {
        switch question.kind {
        case .single:
            VStack(spacing: BenyuanSpacing.x3) {
                ForEach(Array((question.options ?? []).enumerated()), id: \.element.id) { index, option in
                    let selected = model.session.answers[question.id]?.stringValue == option.id
                    BenyuanNativeOptionButton(index: index, title: option.text, active: selected) {
                        novaBurstOptionId = option.id
                        novaBurstToken += 1
                        model.setSingleAnswer(option.id)
                    }
                    .overlay(BenyuanSelectionPulseLayer(isActive: selected, cornerRadius: 24))
                    .overlay(BenyuanNovaSelectionBurst(trigger: novaBurstOptionId == option.id ? novaBurstToken : 0))
                }
            }
        case .multi:
            VStack(spacing: BenyuanSpacing.x3) {
                ForEach(Array((question.options ?? []).enumerated()), id: \.element.id) { index, option in
                    let selected = model.session.answers[question.id]?.arrayValue?.contains(.string(option.id)) == true
                    BenyuanNativeOptionButton(index: index, title: option.text, active: selected) {
                        novaBurstOptionId = option.id
                        novaBurstToken += 1
                        model.toggleMultiAnswer(option.id)
                    }
                    .overlay(BenyuanSelectionPulseLayer(isActive: selected, cornerRadius: 24))
                    .overlay(BenyuanNovaSelectionBurst(trigger: novaBurstOptionId == option.id ? novaBurstToken : 0))
                }
            }
        case .distribution:
            distributionBody(question)
        case .upload:
            uploadBody(question)
        }
    }

    private func distributionBody(_ question: BenyuanQuestion) -> some View {
        let object = model.session.answers[question.id]?.objectValue ?? ["past": .number(34), "present": .number(33), "future": .number(33)]
        return VStack(spacing: BenyuanSpacing.x4) {
            ForEach(question.distributionKeys ?? []) { item in
                VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
                    HStack {
                        Text(item.label)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(BenyuanColor.textSecondary)
                        Spacer()
                        Text("\(object[item.key]?.intValue ?? 0)%")
                            .font(.system(size: 26, weight: .semibold))
                            .foregroundStyle(BenyuanColor.textPrimary)
                    }
                    Slider(value: Binding(
                        get: { Double(object[item.key]?.intValue ?? 0) },
                        set: { model.setDistribution(key: item.key, value: $0) }
                    ), in: 0...100)
                    .tint(BenyuanColor.accentGold)
                }
                .padding(BenyuanSpacing.x4)
                .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(BenyuanColor.glassFill).overlay(RoundedRectangle(cornerRadius: 26).stroke(BenyuanColor.glassStroke)))
            }
        }
    }

    private func uploadBody(_ question: BenyuanQuestion) -> some View {
        let assets = model.uploadedAssets(for: question.id)
        let maxCount = question.uploadRange?.max ?? 1
        let hasAssets = !assets.isEmpty
        let canAddMore = assets.count < maxCount
        return VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
            Button {
                pickingQuestion = question
            } label: {
                VStack(alignment: .leading, spacing: BenyuanSpacing.x3) {
                    BenyuanUploadArtPanel(
                        progress: min(max(Double(max(assets.count, 1)) / Double(max(maxCount, 1)), 0.24), 1),
                        module: question.module,
                        hasAssets: hasAssets,
                        canAddMore: canAddMore
                    )

                    BenyuanUploadStatusPanel(
                        count: assets.count,
                        maxCount: maxCount,
                        hasAssets: hasAssets,
                        canAddMore: canAddMore,
                        isUploading: model.uploadingQuestionId == question.id
                    )
                }
            }
            .buttonStyle(.plain)
            .buttonStyle(BenyuanPressableMotionStyle(scale: 0.986, glow: hasAssets ? 0.14 : 0.08))
            .disabled(model.uploadingQuestionId != nil || !canAddMore)

            uploadActionRow(question: question, hasAssets: hasAssets, canAddMore: canAddMore)

            if hasAssets {
                BenyuanAssetMutationMotion(mutationKey: assets.map(\.assetId).joined(separator: "|")) {
                    uploadThumbnailStrip(question: question, assets: assets)
                }
            }
        }
        .animation(.easeOut(duration: 0.24), value: assets.map(\.assetId))
    }

    private struct BenyuanUploadArtPanel: View {
        var progress: Double
        var module: BenyuanModuleKey
        var hasAssets: Bool
        var canAddMore: Bool

        var body: some View {
            ZStack(alignment: .topTrailing) {
                BenyuanUploadCelestialPortal(
                    progress: progress,
                    module: module,
                    hasAssets: hasAssets
                )

                Image(systemName: canAddMore ? "chevron.right" : "checkmark")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(canAddMore ? BenyuanColor.textTertiary : BenyuanColor.accentGold)
                    .frame(width: 38, height: 38)
                    .background(Circle().fill(BenyuanColor.bgVoid.opacity(0.50)).overlay(Circle().stroke(BenyuanColor.glassStroke.opacity(0.72))))
                    .padding(BenyuanSpacing.x4)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 156)
            .clipShape(RoundedRectangle(cornerRadius: 30, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 30, style: .continuous)
                    .stroke(hasAssets ? BenyuanColor.accentGold.opacity(0.24) : BenyuanColor.glassStroke, lineWidth: 1)
            )
        }
    }

    private struct BenyuanUploadStatusPanel: View {
        var count: Int
        var maxCount: Int
        var hasAssets: Bool
        var canAddMore: Bool
        var isUploading: Bool

        var body: some View {
            HStack(alignment: .center, spacing: BenyuanSpacing.x3) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(spacing: 8) {
                        Image(systemName: hasAssets ? "photo.stack.fill" : "plus")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(hasAssets ? BenyuanColor.accentGold : BenyuanColor.textPrimary)
                        Text(hasAssets ? "\(count)/\(maxCount) 张线索" : "选择图片线索")
                            .font(.system(size: 11, weight: .black, design: .monospaced))
                            .foregroundStyle(hasAssets ? BenyuanColor.accentGold : BenyuanColor.textTertiary)
                    }

                    Text(hasAssets ? "图片线索已进入剧场" : isUploading ? "图片正在进入剧场" : "选择图片线索")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(BenyuanColor.textPrimary)
                        .lineLimit(2)
                        .minimumScaleFactor(0.82)

                    Text(hasAssets ? "已加入 \(count) / \(maxCount) 张，还可以继续添加或逐张删除。" : "把一张场景、物品或记忆照片交给本源。")
                        .font(.system(size: 13, weight: .regular))
                        .lineSpacing(4)
                        .foregroundStyle(BenyuanColor.textSecondary)
                        .lineLimit(3)
                }

                Spacer(minLength: BenyuanSpacing.x2)

                Image(systemName: canAddMore ? "chevron.right" : "checkmark")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(canAddMore ? BenyuanColor.textTertiary : BenyuanColor.accentGold)
                    .frame(width: 38, height: 38)
                    .background(Circle().fill(BenyuanColor.bgVoid.opacity(0.50)).overlay(Circle().stroke(BenyuanColor.glassStroke.opacity(0.72))))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, BenyuanSpacing.x4)
            .padding(.vertical, BenyuanSpacing.x3)
            .background(
                RoundedRectangle(cornerRadius: 28, style: .continuous)
                    .fill(BenyuanColor.bgVoid.opacity(0.64))
                    .overlay(RoundedRectangle(cornerRadius: 28, style: .continuous).stroke(hasAssets ? BenyuanColor.accentGold.opacity(0.24) : BenyuanColor.glassStroke, lineWidth: 1))
            )
        }
    }

    private func uploadThumbnailStrip(question: BenyuanQuestion, assets: [BenyuanUploadedAssetRef]) -> some View {
        VStack(alignment: .leading, spacing: BenyuanSpacing.x2) {
            HStack {
                Text("已选择图片")
                    .font(.system(size: 13, weight: .black, design: .monospaced))
                    .foregroundStyle(BenyuanColor.accentGold)
                Spacer()
                Text("点 × 删除单张")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(BenyuanColor.textTertiary)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: BenyuanSpacing.x3) {
                    ForEach(Array(assets.enumerated()), id: \.element.assetId) { index, asset in
                        uploadThumbnailCard(question: question, asset: asset, index: index)
                    }
                }
            }
        }
    }

    private func uploadThumbnailCard(question: BenyuanQuestion, asset: BenyuanUploadedAssetRef, index: Int) -> some View {
        ZStack(alignment: .topTrailing) {
            if let image = model.thumbnails[asset.assetId] {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else {
                RoundedRectangle(cornerRadius: 18)
                    .fill(BenyuanColor.glassFillStrong)
                    .overlay(Text("线索").font(.system(size: 12, weight: .bold)).foregroundStyle(BenyuanColor.textTertiary))
            }

            Button {
                model.removeUploadAsset(questionId: question.id, assetId: asset.assetId)
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 11, weight: .black))
                    .foregroundStyle(BenyuanColor.textPrimary)
                    .frame(width: 27, height: 27)
                    .background(Circle().fill(Color.black.opacity(0.74)))
            }
            .padding(7)
            .buttonStyle(BenyuanPressableMotionStyle(scale: 0.90, glow: 0.16, haptic: .light))

            VStack {
                Spacer()
                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("线索 \(index + 1)")
                            .font(.system(size: 10, weight: .black, design: .monospaced))
                            .foregroundStyle(BenyuanColor.accentGold)
                        Text(asset.name)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(BenyuanColor.textPrimary)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 0)
                }
                .padding(8)
                .background(
                    LinearGradient(
                        colors: [.clear, Color.black.opacity(0.76)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            }
        }
        .frame(width: 112, height: 118)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(BenyuanColor.glassStroke.opacity(0.92), lineWidth: 1)
        )
    }

    private func uploadActionRow(question: BenyuanQuestion, hasAssets: Bool, canAddMore: Bool) -> some View {
        HStack(spacing: BenyuanSpacing.x3) {
            if canAddMore {
                uploadUtilityButton(title: hasAssets ? "继续添加" : "从相册选择", systemImage: "photo.on.rectangle.angled") {
                    replacesExistingUpload = false
                    pickingQuestion = question
                }
            }

            if hasAssets {
                uploadUtilityButton(title: "重新选择", systemImage: "arrow.triangle.2.circlepath") {
                    replacesExistingUpload = true
                    pickingQuestion = question
                }

                uploadUtilityButton(title: "全部清空", systemImage: "trash") {
                    model.clearUploadAssets(questionId: question.id)
                }
            }
        }
    }

    private func uploadHeroTitle(hasAssets: Bool, isUploading: Bool) -> String {
        if isUploading { return "正在归位图片线索" }
        return hasAssets ? "图片线索已进入剧场" : "选择图片线索"
    }

    private func uploadHeroDetail(count: Int, maxCount: Int, canAddMore: Bool) -> String {
        if count == 0 { return "可上传最多 \(maxCount) 张，之后仍可删除、追加或重选。" }
        if canAddMore { return "已加入 \(count) / \(maxCount) 张，还可以继续添加或逐张删除。" }
        return "已加入 \(count) / \(maxCount) 张，可重新选择或清空后再来。"
    }

    private func uploadUtilityButton(title: String, systemImage: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 7) {
                Image(systemName: systemImage)
                    .font(.system(size: 13, weight: .semibold))
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                    .lineLimit(1)
                    .minimumScaleFactor(0.82)
            }
            .foregroundStyle(BenyuanColor.textPrimary)
            .frame(maxWidth: .infinity, minHeight: 42)
            .background(Capsule().fill(BenyuanColor.glassFill).overlay(Capsule().stroke(BenyuanColor.glassStroke)))
        }
        .buttonStyle(BenyuanPressableMotionStyle(scale: 0.972, glow: 0.10, haptic: .light))
        .disabled(model.uploadingQuestionId != nil)
        .opacity(model.uploadingQuestionId != nil ? 0.46 : 1)
    }

    private var bottomBar: some View {
        HStack(spacing: BenyuanSpacing.x3) {
            Button("上一题") { model.previousQuestion() }
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(BenyuanColor.textSecondary)
                .frame(width: 84, height: 54)
                .background(Capsule().fill(BenyuanColor.glassFill))
                .buttonStyle(BenyuanPressableMotionStyle(scale: 0.96, glow: 0.08, haptic: .light))
            Button("下一题") { model.nextQuestion() }
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(BenyuanColor.textSecondary)
                .frame(width: 84, height: 54)
                .background(Capsule().fill(BenyuanColor.glassFill))
                .buttonStyle(BenyuanPressableMotionStyle(scale: 0.96, glow: 0.08, haptic: .light))
            BenyuanNativePrimaryButton(title: model.allQuestionsAnswered ? "进入剧场生成" : "继续收集", disabled: model.uploadingQuestionId != nil) {
                if model.allQuestionsAnswered {
                    Task { await model.submitPart1AndGenerateTheater() }
                } else {
                    model.nextQuestion()
                }
            }
        }
        .padding(.horizontal, BenyuanSpacing.x4)
        .padding(.vertical, BenyuanSpacing.x4)
        .background(BenyuanColor.bgVoid.opacity(0.76).ignoresSafeArea().blur(radius: 0))
    }

    private func questionTitleSize(_ value: String) -> CGFloat {
        if value.count > 30 { return 26 }
        return 30
    }

    private func uploadQuestionTitleSize(_ value: String) -> CGFloat {
        if value.count > 30 { return 24 }
        return 28
    }
}
