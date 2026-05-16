import AuthenticationServices
import SwiftUI

struct BenyuanNativeAuthView: View {
    @ObservedObject var model: BenyuanNativeFlowModel
    @ObservedObject private var wechatAuth = BenyuanWechatAuthClient.shared
    @StateObject private var appleAuth = BenyuanAppleAuthCoordinator()
    @State private var phone = ""
    @State private var code = ""
    @State private var showsPhonePanel = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: BenyuanSpacing.x8)

            BenyuanRevealedStack(spacing: BenyuanSpacing.x6) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("本源")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(BenyuanColor.textPrimary)
                        Text("私人月相档案")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(BenyuanColor.textTertiary)
                    }
                    Spacer()
                }

                Spacer(minLength: BenyuanSpacing.x4)

                ZStack {
                    BenyuanDeepCelestialBody(size: 172, progress: 0.38, mode: .constellation)
                    Circle()
                        .trim(from: 0.08, to: 0.82)
                        .stroke(BenyuanColor.textPrimary.opacity(0.16), style: StrokeStyle(lineWidth: 1.2, lineCap: .round, dash: [2, 13]))
                        .frame(width: 238, height: 238)
                        .rotationEffect(.degrees(-38))
                }
                .padding(.vertical, BenyuanSpacing.x3)

                VStack(alignment: .leading, spacing: BenyuanSpacing.x4) {
                    HStack(spacing: BenyuanSpacing.x2) {
                        Rectangle()
                            .fill(BenyuanColor.accentGold.opacity(0.72))
                            .frame(width: 28, height: 1)
                        Text("ORIGIN BEFORE LIGHT")
                            .font(.system(size: 10, weight: .semibold, design: .monospaced))
                            .tracking(1.8)
                            .foregroundStyle(BenyuanColor.accentGold.opacity(0.72))
                    }

                    Text("其实在宇宙大爆炸的那一瞬间，\n你就已经诞生了")
                        .font(.system(size: 29, weight: .semibold))
                        .lineSpacing(8)
                        .minimumScaleFactor(0.78)
                        .foregroundStyle(BenyuanColor.textPrimary)
                        .frame(maxWidth: 352, alignment: .leading)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.horizontal, BenyuanSpacing.x6)

            Spacer(minLength: BenyuanSpacing.x6)

            BenyuanRevealedStack(spacing: BenyuanSpacing.x3, delay: 0.12) {
                Button {
                    Task {
                        await startAppleLogin()
                    }
                } label: {
                    appleLoginLabel
                }
                .buttonStyle(BenyuanPressableMotionStyle(scale: 0.974, glow: 0.12))
                .accessibilityLabel("用 Apple 登录")
                .frame(maxWidth: .infinity, minHeight: 56, maxHeight: 56)

                HStack(spacing: BenyuanSpacing.x2) {
                    Button {
                        Task {
                            await startWechatLogin()
                        }
                    } label: {
                        authPill("微信登录", ready: isWechatEntryReady)
                    }
                    .buttonStyle(.plain)
                    Button {
                        withAnimation(.easeInOut(duration: BenyuanMotion.base)) {
                            showsPhonePanel = true
                        }
                    } label: {
                        Text(model.isPhoneAuthReady ? "手机号码登录" : "手机号码登录")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(model.isPhoneAuthReady ? BenyuanColor.textPrimary : BenyuanColor.textTertiary)
                            .frame(maxWidth: .infinity, minHeight: 34)
                            .background(Capsule().fill(BenyuanColor.glassFill.opacity(model.isPhoneAuthReady ? 0.82 : 0.72)).overlay(Capsule().stroke(BenyuanColor.glassStroke.opacity(model.isPhoneAuthReady ? 0.86 : 0.72))))
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, BenyuanSpacing.x2)

                if showsPhonePanel {
                    phonePanel
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
            }
            .padding(.horizontal, BenyuanSpacing.x6)
            .padding(.bottom, BenyuanSpacing.x8)
        }
    }

    private var appleLoginLabel: some View {
        HStack(spacing: BenyuanSpacing.x3) {
            Image(systemName: "apple.logo")
                .font(.system(size: 18, weight: .semibold))
            Text("用 Apple 登录")
                .font(.system(size: 16, weight: .semibold))
        }
        .foregroundStyle(BenyuanColor.bgVoid)
        .frame(maxWidth: .infinity, minHeight: 56, maxHeight: 56)
        .background(Capsule().fill(BenyuanColor.textPrimary))
        .overlay(Capsule().stroke(BenyuanColor.textPrimary.opacity(0.16), lineWidth: 1))
    }

    private var phonePanel: some View {
        VStack(spacing: BenyuanSpacing.x3) {
            HStack(spacing: BenyuanSpacing.x2) {
                TextField("手机号", text: $phone)
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(BenyuanColor.textPrimary)
                    .padding(.horizontal, BenyuanSpacing.x4)
                    .frame(minHeight: 46)
                    .background(Capsule().fill(BenyuanColor.glassFill).overlay(Capsule().stroke(BenyuanColor.glassStroke)))

                Button("取码") {
                    Task { await model.requestPhoneCode(phone: phone) }
                }
                .font(.system(size: 13, weight: .black))
                .foregroundStyle(BenyuanColor.primaryCTAText)
                .frame(width: 74, height: 46)
                .background(Capsule().fill(BenyuanColor.textPrimary))
                .buttonStyle(.plain)
            }

            HStack(spacing: BenyuanSpacing.x2) {
                TextField("验证码", text: $code)
                    .keyboardType(.numberPad)
                    .textContentType(.oneTimeCode)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(BenyuanColor.textPrimary)
                    .padding(.horizontal, BenyuanSpacing.x4)
                    .frame(minHeight: 46)
                    .background(Capsule().fill(BenyuanColor.glassFill).overlay(Capsule().stroke(BenyuanColor.glassStroke)))

                Button("绑定") {
                    Task { await model.continueWithPhone(phone: phone, code: code) }
                }
                .font(.system(size: 13, weight: .black))
                .foregroundStyle(BenyuanColor.primaryCTAText)
                .frame(width: 74, height: 46)
                .background(Capsule().fill(BenyuanColor.accentGold))
                .buttonStyle(.plain)
            }

            HStack {
                Text(model.isPhoneAuthReady ? "手机号会绑定到当前本源档案。" : "短信验证码登录还在接入中。")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(BenyuanColor.textTertiary)
                Spacer()
                Button("收起") {
                    withAnimation(.easeInOut(duration: BenyuanMotion.base)) {
                        showsPhonePanel = false
                    }
                }
                .font(.system(size: 11, weight: .black))
                .foregroundStyle(BenyuanColor.accentGold)
            }
        }
        .padding(BenyuanSpacing.x3)
        .background(RoundedRectangle(cornerRadius: 24, style: .continuous).fill(BenyuanColor.glassFill.opacity(0.72)).overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).stroke(BenyuanColor.glassStroke)))
    }

    private var isWechatEntryReady: Bool {
        model.isWechatAuthReady && wechatAuth.authState == .ready
    }

    private func startAppleLogin() async {
        model.showToast("正在打开 Apple 登录…")
        do {
            let credential = try await appleAuth.requestSignIn()
            model.showToast(nil)
            await model.continueWithApple(
                identityToken: credential.identityToken,
                authorizationCode: credential.authorizationCode,
                displayName: credential.displayName
            )
        } catch {
            model.showToast(BenyuanAppleAuthorizationCopy.toastMessage(for: error))
        }
    }

    private func startWechatLogin() async {
        guard model.isWechatAuthReady else {
            model.showToast("微信登录还在接入开放平台，请先用 Apple 登录。")
            return
        }

        do {
            let code = try await wechatAuth.requestCode()
            await model.continueWithWechat(code: code, displayName: "微信用户")
        } catch {
            model.showToast(error.localizedDescription)
        }
    }

    private func reservedAuthPill(_ title: String) -> some View {
        authPill(title, ready: false)
    }

    private func authPill(_ title: String, ready: Bool) -> some View {
        Text(title)
            .font(.system(size: 12, weight: .black))
            .foregroundStyle(ready ? BenyuanColor.textPrimary : BenyuanColor.textTertiary)
            .frame(maxWidth: .infinity, minHeight: 34)
            .background(Capsule().fill(BenyuanColor.glassFill.opacity(ready ? 0.82 : 0.72)).overlay(Capsule().stroke(BenyuanColor.glassStroke.opacity(ready ? 0.86 : 0.72))))
    }
}

enum BenyuanAppleAuthorizationCopy {
    static func toastMessage(for error: Error) -> String? {
        let nsError = error as NSError
        if nsError.domain == ASAuthorizationError.errorDomain,
           let code = ASAuthorizationError.Code(rawValue: nsError.code) {
            switch code {
            case .canceled:
                return nil
            case .notInteractive:
                return "当前环境不能弹出 Apple 登录，请在真机或可交互环境中重试。"
            default:
                return "Apple 登录暂时没有连上，请稍后再试。"
            }
        }

        if let localizedError = error as? LocalizedError,
           let description = localizedError.errorDescription {
            return description
        }

        return "Apple 登录暂时没有连上，请稍后再试。"
    }
}
