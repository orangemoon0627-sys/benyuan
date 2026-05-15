import AuthenticationServices
import Combine
import UIKit

struct BenyuanAppleCredential {
    let identityToken: String
    let authorizationCode: String?
    let displayName: String?
}

enum BenyuanAppleAuthCoordinatorError: LocalizedError {
    case requestInProgress
    case missingCredential

    var errorDescription: String? {
        switch self {
        case .requestInProgress:
            return "Apple 登录正在打开，请稍等。"
        case .missingCredential:
            return "Apple 凭证暂时没有返回。"
        }
    }
}

final class BenyuanAppleAuthCoordinator: NSObject, ObservableObject {
    private var continuation: CheckedContinuation<BenyuanAppleCredential, Error>?
    private var authorizationController: ASAuthorizationController?

    func requestSignIn() async throws -> BenyuanAppleCredential {
        if continuation != nil {
            throw BenyuanAppleAuthCoordinatorError.requestInProgress
        }

        return try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation

            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = [.fullName]

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            self.authorizationController = controller
            controller.performRequests()
        }
    }

    private func finish(_ result: Result<BenyuanAppleCredential, Error>) {
        let continuation = continuation
        self.continuation = nil
        authorizationController = nil

        switch result {
        case .success(let credential):
            continuation?.resume(returning: credential)
        case .failure(let error):
            continuation?.resume(throwing: error)
        }
    }
}

extension BenyuanAppleAuthCoordinator: ASAuthorizationControllerDelegate {
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let identityTokenData = credential.identityToken,
              let identityToken = String(data: identityTokenData, encoding: .utf8) else {
            finish(.failure(BenyuanAppleAuthCoordinatorError.missingCredential))
            return
        }

        let authorizationCode = credential.authorizationCode.flatMap { String(data: $0, encoding: .utf8) }
        let displayName = [credential.fullName?.givenName, credential.fullName?.familyName]
            .compactMap { $0 }
            .joined()

        finish(.success(BenyuanAppleCredential(
            identityToken: identityToken,
            authorizationCode: authorizationCode,
            displayName: displayName.isEmpty ? nil : displayName
        )))
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        finish(.failure(error))
    }
}

extension BenyuanAppleAuthCoordinator: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }?
            .windows
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}
