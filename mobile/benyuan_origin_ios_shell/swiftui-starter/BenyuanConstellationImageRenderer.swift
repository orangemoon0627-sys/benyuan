import UIKit

enum BenyuanConstellationImageRenderer {
    static func render(constellation: PsycheConstellation) -> UIImage {
        let size = CGSize(width: 1080, height: 1680)
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { context in
            let rect = CGRect(origin: .zero, size: size)
            UIColor(red: 0.01, green: 0.01, blue: 0.03, alpha: 1).setFill()
            context.fill(rect)

            UIColor(red: 0.72, green: 0.66, blue: 0.48, alpha: 0.24).setStroke()
            context.cgContext.setLineWidth(2)
            context.cgContext.strokeEllipse(in: CGRect(x: 690, y: 120, width: 320, height: 320))
            UIColor(red: 0.05, green: 0.04, blue: 0.08, alpha: 1).setFill()
            context.cgContext.fillEllipse(in: CGRect(x: 730, y: 160, width: 240, height: 240))

            draw("本源 · 精神星图", at: CGPoint(x: 96, y: 112), size: 32, weight: .semibold, color: UIColor(red: 0.72, green: 0.66, blue: 0.48, alpha: 1))
            drawWrapped(constellation.archetype.name, at: CGPoint(x: 96, y: 190), width: 780, size: 78, weight: .black, color: .white, lineHeight: 88)
            draw(constellation.archetype.englishName, at: CGPoint(x: 96, y: 380), size: 28, weight: .medium, color: UIColor(red: 0.72, green: 0.66, blue: 0.48, alpha: 0.92))
            drawWrapped("\(constellation.archetype.displayName)：\(constellation.archetype.displaySubtitle)", at: CGPoint(x: 96, y: 432), width: 830, size: 30, weight: .regular, color: UIColor(white: 0.84, alpha: 1), lineHeight: 42)
            drawWrapped(constellation.archetype.coreEssence, at: CGPoint(x: 96, y: 548), width: 830, size: 36, weight: .regular, color: UIColor(white: 0.92, alpha: 1), lineHeight: 52)

            let tension = constellation.coreTensions.first?.name ?? "未命名张力"
            let action = constellation.growthSuggestions.first?.actionableSteps.first ?? constellation.growthSuggestions.first?.title ?? "慢慢靠近自己"
            draw("核心张力", at: CGPoint(x: 96, y: 820), size: 28, weight: .semibold, color: UIColor(red: 0.72, green: 0.66, blue: 0.48, alpha: 1))
            drawWrapped(tension, at: CGPoint(x: 96, y: 872), width: 840, size: 42, weight: .bold, color: .white, lineHeight: 58)
            draw("行动入口", at: CGPoint(x: 96, y: 1048), size: 28, weight: .semibold, color: UIColor(red: 0.72, green: 0.66, blue: 0.48, alpha: 1))
            drawWrapped(action, at: CGPoint(x: 96, y: 1100), width: 840, size: 34, weight: .regular, color: UIColor(white: 0.86, alpha: 1), lineHeight: 50)

            let narrative = constellation.narrativeOverview.components(separatedBy: "\n").first ?? constellation.narrativeOverview
            drawWrapped(narrative, at: CGPoint(x: 96, y: 1278), width: 840, size: 30, weight: .regular, color: UIColor(white: 0.78, alpha: 1), lineHeight: 46)
        }
    }

    private static func draw(_ text: String, at point: CGPoint, size: CGFloat, weight: UIFont.Weight, color: UIColor) {
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color
        ]
        text.draw(at: point, withAttributes: attributes)
    }

    private static func drawWrapped(_ text: String, at point: CGPoint, width: CGFloat, size: CGFloat, weight: UIFont.Weight, color: UIColor, lineHeight: CGFloat) {
        let paragraph = NSMutableParagraphStyle()
        paragraph.minimumLineHeight = lineHeight
        paragraph.maximumLineHeight = lineHeight
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color,
            .paragraphStyle: paragraph
        ]
        text.draw(with: CGRect(x: point.x, y: point.y, width: width, height: 420), options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attributes, context: nil)
    }
}
