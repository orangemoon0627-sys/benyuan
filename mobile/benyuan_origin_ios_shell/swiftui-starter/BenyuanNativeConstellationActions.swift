import Photos

@MainActor
extension BenyuanNativeFlowModel {
    func shareConstellation() {
        guard let constellation else { return }
        let data = constellation.psycheConstellation
        let text = [
            "本源｜\(data.archetype.name)",
            "主星体：\(data.archetype.name) · \(data.archetype.englishName)",
            "本次显影：\(data.archetype.displayName)",
            data.archetype.displaySubtitle,
            data.archetype.coreEssence,
            "核心张力：\(data.coreTensions.first?.name ?? "未命名张力")",
            "行动入口：\(data.growthSuggestions.first?.actionableSteps.first ?? data.growthSuggestions.first?.title ?? "慢慢靠近自己")"
        ].joined(separator: "\n\n")
        shareItems = [text]
        isShareSheetPresented = true
    }

    func saveConstellationImage() {
        guard let constellation else { return }
        let image = BenyuanConstellationImageRenderer.render(constellation: constellation.psycheConstellation)
        PHPhotoLibrary.shared().performChanges {
            PHAssetChangeRequest.creationRequestForAsset(from: image)
        } completionHandler: { [weak self] success, error in
            Task { @MainActor in
                self?.toast = success ? "星图摘要已保存到相册。" : (error?.localizedDescription ?? "保存失败。")
            }
        }
    }
}
