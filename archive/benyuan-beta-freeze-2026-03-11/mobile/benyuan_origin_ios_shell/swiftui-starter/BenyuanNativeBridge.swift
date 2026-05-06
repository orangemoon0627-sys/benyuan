import Foundation
import PhotosUI
import UIKit
import UniformTypeIdentifiers
import WebKit

final class BenyuanNativeBridge: NSObject {
    private weak var state: BenyuanShellState?
    weak var webView: WKWebView?
    private var pendingImageRequestId: String?

    init(state: BenyuanShellState) {
        self.state = state
    }

    func configure(_ userContentController: WKUserContentController) {
        userContentController.add(self, name: "benyuanShare")
        userContentController.add(self, name: "benyuanOpenExternal")
        userContentController.add(self, name: "benyuanPickImages")

        let scriptSource = """
        window.__BENYUAN_SHELL_INFO__ = {
          platform: 'ios-shell',
          version: '0.3.0',
          bridge: ['share', 'openExternal', 'pickImages']
        };
        window.__BENYUAN_NATIVE_PICK_IMAGE_PENDING__ = window.__BENYUAN_NATIVE_PICK_IMAGE_PENDING__ || {};
        window.__BENYUAN_NATIVE_PICK_IMAGE_RESOLVE__ = function(requestId, payload) {
          var entry = window.__BENYUAN_NATIVE_PICK_IMAGE_PENDING__[requestId];
          if (!entry) return;
          delete window.__BENYUAN_NATIVE_PICK_IMAGE_PENDING__[requestId];
          entry.resolve(payload || { assets: [] });
        };
        window.__BENYUAN_NATIVE_PICK_IMAGE_REJECT__ = function(requestId, message) {
          var entry = window.__BENYUAN_NATIVE_PICK_IMAGE_PENDING__[requestId];
          if (!entry) return;
          delete window.__BENYUAN_NATIVE_PICK_IMAGE_PENDING__[requestId];
          entry.reject(new Error(message || 'native_pick_failed'));
        };
        window.BenyuanNativeShell = {
          share: function(payload) {
            try { window.webkit.messageHandlers.benyuanShare.postMessage(payload || {}); } catch (_) {}
          },
          openExternal: function(url) {
            try { window.webkit.messageHandlers.benyuanOpenExternal.postMessage({ url: url }); } catch (_) {}
          },
          pickImages: function(payload) {
            return new Promise(function(resolve, reject) {
              var requestId = 'pick_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
              window.__BENYUAN_NATIVE_PICK_IMAGE_PENDING__[requestId] = { resolve: resolve, reject: reject };
              try {
                window.webkit.messageHandlers.benyuanPickImages.postMessage(Object.assign({ requestId: requestId }, payload || {}));
              } catch (error) {
                delete window.__BENYUAN_NATIVE_PICK_IMAGE_PENDING__[requestId];
                reject(error);
              }
            });
          }
        };
        """

        let script = WKUserScript(source: scriptSource, injectionTime: .atDocumentStart, forMainFrameOnly: false)
        userContentController.addUserScript(script)
    }

    func attach(webView: WKWebView) {
        self.webView = webView
    }

    private func handlePickImages(_ body: Any) {
        guard let payload = body as? [String: Any],
              let requestId = payload["requestId"] as? String else {
            return
        }

        if pendingImageRequestId != nil {
            rejectPickImages(requestId: requestId, message: "picker_busy")
            return
        }

        let requestedMax = (payload["maxCount"] as? NSNumber)?.intValue ?? 1
        let selectionLimit = max(1, min(requestedMax, 3))
        let source = (payload["source"] as? String) == "camera" ? "camera" : "library"

        if let fixtureAssets = loadFixtureAssets(limit: selectionLimit), !fixtureAssets.isEmpty {
            resolvePickImages(requestId: requestId, payload: [
                "cancelled": false,
                "assets": fixtureAssets
            ])
            return
        }

        guard let presenter = topViewController() else {
            rejectPickImages(requestId: requestId, message: "picker_presenter_unavailable")
            return
        }

        pendingImageRequestId = requestId

        if source == "camera" {
            guard UIImagePickerController.isSourceTypeAvailable(.camera) else {
                pendingImageRequestId = nil
                rejectPickImages(requestId: requestId, message: "camera_unavailable")
                return
            }

            let picker = UIImagePickerController()
            picker.delegate = self
            picker.sourceType = .camera
            picker.cameraCaptureMode = .photo
            picker.mediaTypes = [UTType.image.identifier]
            presenter.present(picker, animated: true)
            return
        }

        var configuration = PHPickerConfiguration(photoLibrary: .shared())
        configuration.filter = .images
        configuration.selectionLimit = selectionLimit
        configuration.preferredAssetRepresentationMode = .current

        let picker = PHPickerViewController(configuration: configuration)
        picker.delegate = self
        presenter.present(picker, animated: true)
    }

    private func handleShare(_ body: Any) {
        guard let state else { return }
        if let payload = body as? [String: Any] {
            var items: [Any] = []
            if let title = payload["title"] as? String, !title.isEmpty { items.append(title) }
            if let text = payload["text"] as? String, !text.isEmpty { items.append(text) }
            if let urlString = payload["url"] as? String, let url = URL(string: urlString) { items.append(url) }
            Task { @MainActor in
                state.presentShare(items: items)
            }
        }
    }

    private func handleExternal(_ body: Any) {
        if let payload = body as? [String: Any],
           let raw = payload["url"] as? String,
           let url = URL(string: raw) {
            UIApplication.shared.open(url)
        }
    }

    private func topViewController() -> UIViewController? {
        if let root = webView?.window?.rootViewController {
            return visibleViewController(from: root)
        }

        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let activeScene = scenes.first { $0.activationState == .foregroundActive }
        let root = activeScene?.windows.first(where: \.isKeyWindow)?.rootViewController
        return visibleViewController(from: root)
    }

    private func visibleViewController(from root: UIViewController?) -> UIViewController? {
        if let navigationController = root as? UINavigationController {
            return visibleViewController(from: navigationController.visibleViewController)
        }
        if let tabBarController = root as? UITabBarController {
            return visibleViewController(from: tabBarController.selectedViewController)
        }
        if let presented = root?.presentedViewController {
            return visibleViewController(from: presented)
        }
        return root
    }

    private func resolvePickImages(requestId: String, payload: [String: Any]) {
        guard let requestIdJSON = serializeForJavaScript(requestId),
              let payloadJSON = serializeForJavaScript(payload) else {
            rejectPickImages(requestId: requestId, message: "native_pick_serialize_failed")
            return
        }
        webView?.evaluateJavaScript("window.__BENYUAN_NATIVE_PICK_IMAGE_RESOLVE__(\(requestIdJSON), \(payloadJSON));")
    }

    private func rejectPickImages(requestId: String, message: String) {
        guard let requestIdJSON = serializeForJavaScript(requestId),
              let messageJSON = serializeForJavaScript(message) else {
            return
        }
        webView?.evaluateJavaScript("window.__BENYUAN_NATIVE_PICK_IMAGE_REJECT__(\(requestIdJSON), \(messageJSON));")
    }

    private func serializeForJavaScript(_ object: Any) -> String? {
        guard JSONSerialization.isValidJSONObject(object) || object is String || object is NSNumber || object is NSNull else {
            return nil
        }
        guard let data = try? JSONSerialization.data(withJSONObject: object, options: [.fragmentsAllowed]) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }

    private func loadFixtureAssets(limit: Int) -> [[String: Any]]? {
        let fixtureNames = Array(BenyuanShellConfig.nativePickFixtureNames.prefix(limit))
        guard !fixtureNames.isEmpty else { return nil }

        let assets = fixtureNames.compactMap { fixtureName -> [String: Any]? in
            let fixtureURL = resolveFixtureURL(name: fixtureName)
            guard let fixtureURL,
                  let data = try? Data(contentsOf: fixtureURL),
                  let image = UIImage(data: data) else {
                return nil
            }
            return buildAssetPayload(image: image, name: fixtureURL.lastPathComponent)
        }

        return assets.isEmpty ? nil : assets
    }

    private func resolveFixtureURL(name: String) -> URL? {
        if name.hasPrefix("/") {
            return URL(fileURLWithPath: name)
        }

        let resourceName = (name as NSString).deletingPathExtension
        let resourceExtension = (name as NSString).pathExtension
        return Bundle.main.url(forResource: resourceName, withExtension: resourceExtension.isEmpty ? nil : resourceExtension)
    }

    private func loadPickedAssets(from results: [PHPickerResult]) async -> [[String: Any]] {
        var assets: [[String: Any]] = []

        for (index, result) in results.enumerated() {
            if let asset = await loadPickedAsset(from: result.itemProvider, index: index) {
                assets.append(asset)
            }
        }

        return assets
    }

    private func loadPickedAsset(from provider: NSItemProvider, index: Int) async -> [String: Any]? {
        guard provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) else {
            return nil
        }

        do {
            let rawData = try await loadImageData(from: provider)
            guard let image = UIImage(data: rawData) else {
                return nil
            }
            let baseName = (provider.suggestedName?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false)
                ? provider.suggestedName!
                : "native-image-\(index + 1)"
            return buildAssetPayload(image: image, name: "\(baseName).jpg")
        } catch {
            return nil
        }
    }

    private func loadImageData(from provider: NSItemProvider) async throws -> Data {
        try await withCheckedThrowingContinuation { continuation in
            provider.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { data, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }
                guard let data else {
                    continuation.resume(throwing: NSError(domain: "BenyuanNativeBridge", code: 0, userInfo: [NSLocalizedDescriptionKey: "native_pick_empty_data"]))
                    return
                }
                continuation.resume(returning: data)
            }
        }
    }

    private func buildAssetPayload(image: UIImage, name: String) -> [String: Any]? {
        let processedImage = downsampledImage(from: image, maxDimension: 2048)
        guard let jpegData = processedImage.jpegData(compressionQuality: 0.84) else {
            return nil
        }

        return [
            "name": name.hasSuffix(".jpg") || name.hasSuffix(".jpeg") ? name : "\(name).jpg",
            "mimeType": "image/jpeg",
            "dataUrl": "data:image/jpeg;base64,\(jpegData.base64EncodedString())",
            "size": jpegData.count,
            "width": Int(processedImage.size.width.rounded()),
            "height": Int(processedImage.size.height.rounded())
        ]
    }

    private func downsampledImage(from image: UIImage, maxDimension: CGFloat) -> UIImage {
        let sourceSize = image.size
        let longestSide = max(sourceSize.width, sourceSize.height)
        guard longestSide > maxDimension, longestSide > 0 else {
            return image
        }

        let scale = maxDimension / longestSide
        let targetSize = CGSize(width: sourceSize.width * scale, height: sourceSize.height * scale)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        let renderer = UIGraphicsImageRenderer(size: targetSize, format: format)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
    }
}

extension BenyuanNativeBridge: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "benyuanShare":
            handleShare(message.body)
        case "benyuanOpenExternal":
            handleExternal(message.body)
        case "benyuanPickImages":
            handlePickImages(message.body)
        default:
            break
        }
    }
}

extension BenyuanNativeBridge: PHPickerViewControllerDelegate {
    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        let requestId = pendingImageRequestId
        pendingImageRequestId = nil
        picker.dismiss(animated: true)

        guard let requestId else { return }

        if results.isEmpty {
            resolvePickImages(requestId: requestId, payload: [
                "cancelled": true,
                "assets": []
            ])
            return
        }

        Task { [weak self] in
            guard let self else { return }
            let assets = await self.loadPickedAssets(from: results)
            await MainActor.run {
                if assets.isEmpty {
                    self.rejectPickImages(requestId: requestId, message: "native_pick_empty")
                } else {
                    self.resolvePickImages(requestId: requestId, payload: [
                        "cancelled": false,
                        "assets": assets
                    ])
                }
            }
        }
    }
}

extension BenyuanNativeBridge: UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        let requestId = pendingImageRequestId
        pendingImageRequestId = nil
        picker.dismiss(animated: true)

        guard let requestId else { return }
        resolvePickImages(requestId: requestId, payload: [
            "cancelled": true,
            "assets": []
        ])
    }

    func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
        let requestId = pendingImageRequestId
        pendingImageRequestId = nil
        let image = (info[.editedImage] as? UIImage) ?? (info[.originalImage] as? UIImage)
        picker.dismiss(animated: true)

        guard let requestId else { return }
        guard let image, let asset = buildAssetPayload(image: image, name: "native-camera-photo.jpg") else {
            rejectPickImages(requestId: requestId, message: "camera_capture_failed")
            return
        }

        resolvePickImages(requestId: requestId, payload: [
            "cancelled": false,
            "assets": [asset]
        ])
    }
}
