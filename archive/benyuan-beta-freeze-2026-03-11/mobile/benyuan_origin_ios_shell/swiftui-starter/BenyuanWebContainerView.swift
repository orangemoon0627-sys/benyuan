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
        let userContentController = WKUserContentController()
        context.coordinator.bridge.configure(userContentController)
        configuration.userContentController = userContentController

        let webView = WKWebView(frame: .zero, configuration: configuration)
        context.coordinator.webView = webView
        context.coordinator.bridge.attach(webView: webView)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear

        let request = URLRequest(url: BenyuanRouteRecovery.restoreURL(), cachePolicy: .reloadIgnoringLocalCacheData)
        webView.load(request)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if context.coordinator.lastReloadToken != reloadToken {
            context.coordinator.lastReloadToken = reloadToken
            let request = URLRequest(url: currentURL ?? BenyuanRouteRecovery.restoreURL(), cachePolicy: .reloadIgnoringLocalCacheData)
            webView.load(request)
        }
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
                BenyuanRouteRecovery.save(url)
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            isLoading = false
            errorMessage = error.localizedDescription
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            isLoading = false
            errorMessage = error.localizedDescription
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
    }
}
