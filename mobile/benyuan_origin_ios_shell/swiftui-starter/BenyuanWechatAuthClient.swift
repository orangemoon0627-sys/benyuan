import Foundation
import UIKit

#if canImport(WechatOpenSDK) && BENYUAN_WECHAT_OPENSDK
import WechatOpenSDK
#endif

enum BenyuanWechatAuthState: Equatable {
    case unavailable(String)
    case ready
    case pending
}

enum BenyuanWechatAuthError: LocalizedError, Equatable {
    case notConfigured
    case sdkUnavailable
    case wechatNotInstalled
    case sendFailed
    case stateMismatch
    case cancelled
    case denied
    case failed(String)

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "微信登录还在接入开放平台，请先用 Apple 或访客进入。"
        case .sdkUnavailable:
            return "微信 SDK 尚未进入当前构建。"
        case .wechatNotInstalled:
            return "这台设备还没有安装微信。"
        case .sendFailed:
            return "暂时无法唤起微信授权。"
        case .stateMismatch:
            return "微信授权状态不一致，请重新尝试。"
        case .cancelled:
            return "你已取消微信授权。"
        case .denied:
            return "微信授权未通过。"
        case .failed(let message):
            return message
        }
    }
}

@MainActor
final class BenyuanWechatAuthClient: NSObject, ObservableObject {
    static let shared = BenyuanWechatAuthClient()

    @Published private(set) var authState: BenyuanWechatAuthState = .unavailable("微信开放平台尚未配置。")

    private var appID: String?
    private var universalLink: String?
    private var pendingState: String?
    private var continuation: CheckedContinuation<String, Error>?

    var isConfigured: Bool {
        Self.validConfigValue(appID) && Self.validConfigValue(universalLink)
    }

    func configure() {
        let appID = Bundle.main.object(forInfoDictionaryKey: "BenyuanWechatAppID") as? String
        let universalLink = Bundle.main.object(forInfoDictionaryKey: "BenyuanWechatUniversalLink") as? String
        configure(appID: appID, universalLink: universalLink)
    }

    func configure(appID: String?, universalLink: String?) {
        self.appID = appID
        self.universalLink = universalLink

        guard Self.validConfigValue(appID), Self.validConfigValue(universalLink) else {
            authState = .unavailable("微信开放平台尚未配置。")
            return
        }

#if canImport(WechatOpenSDK) && BENYUAN_WECHAT_OPENSDK
        let registered = WXApi.registerApp(appID ?? "", universalLink: universalLink ?? "")
        authState = registered ? .ready : .unavailable("微信 SDK 注册失败。")
#else
        authState = .unavailable("微信 SDK 尚未进入当前构建。")
#endif
    }

    func requestCode() async throws -> String {
        guard isConfigured else {
            throw BenyuanWechatAuthError.notConfigured
        }

#if canImport(WechatOpenSDK) && BENYUAN_WECHAT_OPENSDK
        guard WXApi.isWXAppInstalled() else {
            throw BenyuanWechatAuthError.wechatNotInstalled
        }

        let state = "benyuan_ios_\(UUID().uuidString.replacingOccurrences(of: "-", with: ""))"
        pendingState = state
        authState = .pending

        return try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            let request = SendAuthReq()
            request.scope = "snsapi_userinfo"
            request.state = state
            WXApi.sendReq(request) { success in
                Task { @MainActor in
                    if !success {
                        self.finish(error: BenyuanWechatAuthError.sendFailed)
                    }
                }
            }
        }
#else
        throw BenyuanWechatAuthError.sdkUnavailable
#endif
    }

    func handleOpenURL(_ url: URL) -> Bool {
#if canImport(WechatOpenSDK) && BENYUAN_WECHAT_OPENSDK
        WXApi.handleOpen(url, delegate: self)
#else
        false
#endif
    }

    func handleUniversalLink(_ userActivity: NSUserActivity) -> Bool {
#if canImport(WechatOpenSDK) && BENYUAN_WECHAT_OPENSDK
        WXApi.handleOpenUniversalLink(userActivity, delegate: self)
#else
        false
#endif
    }

    private func finish(code: String) {
        authState = .ready
        pendingState = nil
        let active = continuation
        continuation = nil
        active?.resume(returning: code)
    }

    private func finish(error: Error) {
        authState = isConfigured ? .ready : .unavailable("微信开放平台尚未配置。")
        pendingState = nil
        let active = continuation
        continuation = nil
        active?.resume(throwing: error)
    }

    private static func validConfigValue(_ value: String?) -> Bool {
        guard let value else { return false }
        let normalized = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return !normalized.isEmpty && !normalized.contains("$(") && normalized != "BENYUAN_WECHAT_APP_ID" && normalized != "BENYUAN_WECHAT_UNIVERSAL_LINK"
    }
}

#if canImport(WechatOpenSDK) && BENYUAN_WECHAT_OPENSDK
extension BenyuanWechatAuthClient: WXApiDelegate {
    nonisolated func onResp(_ resp: BaseResp) {
        Task { @MainActor in
            guard let authResp = resp as? SendAuthResp else { return }
            guard authResp.state == pendingState else {
                finish(error: BenyuanWechatAuthError.stateMismatch)
                return
            }

            switch resp.errCode {
            case 0:
                if let code = authResp.code, !code.isEmpty {
                    finish(code: code)
                } else {
                    finish(error: BenyuanWechatAuthError.failed("微信授权暂时没有返回。"))
                }
            case -2:
                finish(error: BenyuanWechatAuthError.cancelled)
            case -4:
                finish(error: BenyuanWechatAuthError.denied)
            default:
                finish(error: BenyuanWechatAuthError.failed(resp.errStr ?? "微信授权暂时无效，请重新尝试。"))
            }
        }
    }
}
#endif
