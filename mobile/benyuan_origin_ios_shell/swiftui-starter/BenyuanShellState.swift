import Foundation

enum BenyuanShellNativeActivity: Equatable {
    case none
    case photoLibrary
    case camera
    case share
    case externalLink

    var title: String {
        switch self {
        case .none: return ""
        case .photoLibrary: return "正在打开相册"
        case .camera: return "正在唤起相机"
        case .share: return "正在准备分享"
        case .externalLink: return "正在离开本源"
        }
    }

    var detail: String {
        switch self {
        case .none: return ""
        case .photoLibrary: return "选择几张审美线索，回来后会继续接住。"
        case .camera: return "拍下一束此刻的线索。"
        case .share: return "把这张星图交给系统分享面板。"
        case .externalLink: return "外部页面会在系统里打开。"
        }
    }

    var progressValue: Double {
        switch self {
        case .none: return 0
        case .photoLibrary: return 0.44
        case .camera: return 0.50
        case .share: return 0.68
        case .externalLink: return 0.74
        }
    }
}

@MainActor
final class BenyuanShellState: ObservableObject {
    @Published var isLoading = true
    @Published var currentURL: URL?
    @Published var isOnline = true
    @Published var errorMessage: String?
    @Published var shareItems: [Any] = []
    @Published var isShareSheetPresented = false
    @Published var nativeActivity: BenyuanShellNativeActivity = .none

    private var activityClearTask: Task<Void, Never>?

    func presentShare(items: [Any]) {
        shareItems = items
        isShareSheetPresented = !items.isEmpty
    }

    func clearShare() {
        shareItems = []
        isShareSheetPresented = false
    }

    func beginNativeActivity(_ activity: BenyuanShellNativeActivity) {
        activityClearTask?.cancel()
        nativeActivity = activity
    }

    func endNativeActivity(_ activity: BenyuanShellNativeActivity? = nil) {
        activityClearTask?.cancel()
        if activity == nil || nativeActivity == activity {
            nativeActivity = .none
        }
    }

    func flashNativeActivity(_ activity: BenyuanShellNativeActivity, duration: TimeInterval = 1.2) {
        beginNativeActivity(activity)
        activityClearTask = Task { [weak self] in
            let delay = UInt64(duration * 1_000_000_000)
            try? await Task.sleep(nanoseconds: delay)
            await MainActor.run {
                self?.endNativeActivity(activity)
            }
        }
    }
}
