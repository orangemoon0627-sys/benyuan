import UIKit

struct BenyuanImagePayload: Equatable {
    let name: String
    let mimeType: String
    let data: Data
    let width: Int
    let height: Int

    static func makeJPEGPayload(from image: UIImage, name: String, maxDimension: CGFloat = 1600) throws -> BenyuanImagePayload {
        let prepared = downsample(image, maxDimension: maxDimension)
        guard let data = prepared.jpegData(compressionQuality: 0.84) else {
            throw BenyuanAPIError.invalidImage
        }

        let baseName = (name as NSString).deletingPathExtension
        let safeBaseName = baseName.isEmpty ? "native-image" : baseName
        return BenyuanImagePayload(
            name: "\(safeBaseName).jpg",
            mimeType: "image/jpeg",
            data: data,
            width: Int(prepared.size.width.rounded()),
            height: Int(prepared.size.height.rounded())
        )
    }

    private static func downsample(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let longest = max(image.size.width, image.size.height)
        guard longest > maxDimension, longest > 0 else { return image }

        let scale = maxDimension / longest
        let targetSize = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        return UIGraphicsImageRenderer(size: targetSize, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
    }
}
