import Foundation

@MainActor
final class BenyuanShellState: ObservableObject {
    @Published var isLoading = true
    @Published var currentURL: URL?
    @Published var isOnline = true
    @Published var errorMessage: String?
    @Published var shareItems: [Any] = []
    @Published var isShareSheetPresented = false

    func presentShare(items: [Any]) {
        shareItems = items
        isShareSheetPresented = !items.isEmpty
    }

    func clearShare() {
        shareItems = []
        isShareSheetPresented = false
    }
}
