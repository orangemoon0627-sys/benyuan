import PhotosUI
import SwiftUI

struct BenyuanNativeImagePicker: UIViewControllerRepresentable {
    let limit: Int
    let onComplete: ([UIImage]) -> Void

    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration(photoLibrary: .shared())
        config.filter = .images
        config.selectionLimit = limit
        config.preferredAssetRepresentationMode = .current
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onComplete: onComplete)
    }

    final class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let onComplete: ([UIImage]) -> Void

        init(onComplete: @escaping ([UIImage]) -> Void) {
            self.onComplete = onComplete
        }

        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            picker.dismiss(animated: true)
            Task {
                var images: [UIImage] = []
                for result in results where result.itemProvider.canLoadObject(ofClass: UIImage.self) {
                    if let image = try? await result.itemProvider.loadImage() {
                        images.append(image)
                    }
                }
                await MainActor.run { self.onComplete(images) }
            }
        }
    }
}

private extension NSItemProvider {
    func loadImage() async throws -> UIImage? {
        try await withCheckedThrowingContinuation { continuation in
            loadObject(ofClass: UIImage.self) { object, error in
                if let error {
                    continuation.resume(throwing: error)
                } else {
                    continuation.resume(returning: object as? UIImage)
                }
            }
        }
    }
}
