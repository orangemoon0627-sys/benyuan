import SwiftUI
import WebKit

struct BenyuanWebContainerView: UIViewRepresentable {
    @Binding var isLoading: Bool
    @Binding var currentURL: URL?
    @Binding var errorMessage: String?
    let reloadToken: UUID
    @ObservedObject var shellState: BenyuanShellState

    func makeCoordinator() -> Coordinator {
        Coordinator(isLoading: $isLoading, currentURL: $currentURL, errorMessage: $errorMessage, shellState: shellState)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.defaultWebpagePreferences.preferredContentMode = .mobile
        let userContentController = WKUserContentController()
        context.coordinator.bridge.configure(userContentController)
        configuration.userContentController = userContentController

        let webView = WKWebView(frame: .zero, configuration: configuration)
        if #available(iOS 16.4, *), BenyuanShellConfig.showsDebugUI {
            webView.isInspectable = true
        }
        context.coordinator.webView = webView
        context.coordinator.bridge.attach(webView: webView)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.allowsLinkPreview = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.scrollView.delaysContentTouches = false
        webView.scrollView.alwaysBounceVertical = true
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear

        let restoredURL = BenyuanRouteRecovery.restoreURL()
        NSLog("[BenyuanShell] initial load base=%@ restore=%@", BenyuanShellConfig.baseURL.absoluteString, restoredURL.absoluteString)
        let request = Self.makeRequest(url: restoredURL)
        webView.load(request)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if context.coordinator.lastReloadToken != reloadToken {
            context.coordinator.lastReloadToken = reloadToken
            let nextURL = currentURL ?? BenyuanRouteRecovery.restoreURL()
            NSLog("[BenyuanShell] reload load url=%@", nextURL.absoluteString)
            let request = Self.makeRequest(url: nextURL)
            webView.load(request)
        }
    }

    private static func makeRequest(url: URL) -> URLRequest {
        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData)
        request.setValue("1", forHTTPHeaderField: "ngrok-skip-browser-warning")
        return request
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        @Binding private var isLoading: Bool
        @Binding private var currentURL: URL?
        @Binding private var errorMessage: String?
        weak var webView: WKWebView?
        let bridge: BenyuanNativeBridge
        var lastReloadToken = UUID()

        init(isLoading: Binding<Bool>, currentURL: Binding<URL?>, errorMessage: Binding<String?>, shellState: BenyuanShellState) {
            _isLoading = isLoading
            _currentURL = currentURL
            _errorMessage = errorMessage
            bridge = BenyuanNativeBridge(state: shellState)
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            isLoading = true
            errorMessage = nil
            currentURL = webView.url
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            isLoading = false
            errorMessage = nil
            if let url = webView.url {
                currentURL = url
                BenyuanShellConfig.persistRuntimeBaseURL(url)
                BenyuanRouteRecovery.save(url)
                NSLog("[BenyuanShell] didFinish url=%@", url.absoluteString)
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            guard !Self.shouldIgnoreNavigationError(error) else { return }
            isLoading = false
            errorMessage = error.localizedDescription
            NSLog("[BenyuanShell] didFail url=%@ error=%@", webView.url?.absoluteString ?? "nil", error.localizedDescription)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            guard !Self.shouldIgnoreNavigationError(error) else { return }
            isLoading = false
            errorMessage = error.localizedDescription
            NSLog("[BenyuanShell] didFailProvisional url=%@ error=%@", webView.url?.absoluteString ?? "nil", error.localizedDescription)
        }

        func webView(_ webView: WKWebView, didReceiveServerRedirectForProvisionalNavigation navigation: WKNavigation!) {
            NSLog("[BenyuanShell] redirect url=%@", webView.url?.absoluteString ?? "nil")
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if let host = url.host, BenyuanShellConfig.allowedHosts.contains(host) {
                decisionHandler(.allow)
                return
            }

            UIApplication.shared.open(url)
            decisionHandler(.cancel)
        }

        private static func shouldIgnoreNavigationError(_ error: Error) -> Bool {
            let nsError = error as NSError
            return nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled
        }
    }
}
