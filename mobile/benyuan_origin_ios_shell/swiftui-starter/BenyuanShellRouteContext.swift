import Foundation

struct BenyuanShellRouteContext {
    let stageLabel: String
    let title: String
    let detail: String
    let progressValue: Double

    static func resolve(currentURL: URL?) -> BenyuanShellRouteContext {
        guard let url = currentURL,
              let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return landing
        }

        let path = components.path
        let phase = components.queryItems?.first(where: { $0.name == "phase" })?.value

        if path.hasPrefix("/collect") {
            return .init(stageLabel: "Part 1", title: "正在进入显影。", detail: "把当前问题接到你眼前。", progressValue: 0.18)
        }

        if path.hasPrefix("/processing/benyuan") {
            if phase == "constellation" {
                return .init(stageLabel: "显影中", title: "正在把轨迹折成星图。", detail: "这一层完成后会直接继续。", progressValue: 0.72)
            }

            return .init(stageLabel: "显影中", title: "正在把线索折成剧场。", detail: "这一层完成后会直接继续。", progressValue: 0.42)
        }

        if path.hasPrefix("/theater") {
            return .init(stageLabel: "Part 2", title: "剧场正在就位。", detail: "把下一幕平稳地接过来。", progressValue: 0.64)
        }

        if path.hasPrefix("/constellation") {
            return .init(stageLabel: "Part 3", title: "星图正在显形。", detail: "结果一旦返回，就会完整接住。", progressValue: 0.92)
        }

        return landing
    }

    private static let landing = BenyuanShellRouteContext(
        stageLabel: "本源",
        title: "正在接住这次进入。",
        detail: "先把氛围、节奏和安全区稳定下来。",
        progressValue: 0.08
    )
}
