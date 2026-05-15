import UIKit

enum BenyuanConstellationImageRenderer {
    // 完整星图长图导出尺寸，对应 height: 3840 的保存海报。
    private static let posterWidth: CGFloat = 1080
    private static let posterHeight: CGFloat = 3840
    private static let margin: CGFloat = 88
    private static let contentWidth: CGFloat = posterWidth - margin * 2

    static func render(constellation: PsycheConstellation) -> UIImage {
        renderLongImage(constellation: constellation)
    }

    static func renderLongImage(constellation: PsycheConstellation) -> UIImage {
        let size = CGSize(width: posterWidth, height: posterHeight)
        let renderer = UIGraphicsImageRenderer(size: size)

        return renderer.image { context in
            let cg = context.cgContext
            drawBackground(in: cg, size: size)

            var y: CGFloat = 108
            draw("本源 · 精神星图", at: CGPoint(x: margin, y: y), size: 31, weight: .semibold, color: gold)
            y += 68

            drawCelestialMark(in: cg, center: CGPoint(x: posterWidth - 245, y: 225))
            drawWrapped(constellation.archetype.name, at: CGPoint(x: margin, y: y), width: 670, size: 74, weight: .black, color: .white, lineHeight: 86, maxHeight: 180)
            y += 184
            draw(constellation.archetype.englishName, at: CGPoint(x: margin, y: y), size: 27, weight: .medium, color: gold.withAlphaComponent(0.92))
            y += 54

            drawWrapped("\(constellation.archetype.displayName)：\(constellation.archetype.displaySubtitle)", at: CGPoint(x: margin, y: y), width: contentWidth, size: 31, weight: .semibold, color: softWhite, lineHeight: 45, maxHeight: 118)
            y += 132
            drawWrapped(constellation.archetype.coreEssence, at: CGPoint(x: margin, y: y), width: contentWidth, size: 38, weight: .regular, color: UIColor(white: 0.92, alpha: 1), lineHeight: 55, maxHeight: 170)
            y += 218

            drawSectionTitle("七维轨道", atY: y)
            y += 58
            y = drawDimensionBars(constellation.sevenDimensions, atY: y)
            y += 72

            drawSectionTitle("星际谱系", atY: y)
            y += 58
            y = drawLineageBlock(constellation, atY: y)
            y += 70

            drawSectionTitle("精神肖像", atY: y)
            y += 58
            let narrative = constellation.narrativeOverview.replacingOccurrences(of: "\n\n", with: "\n")
            let narrativeHeight = drawWrapped(narrative, at: CGPoint(x: margin, y: y), width: contentWidth, size: 30, weight: .regular, color: softWhite.withAlphaComponent(0.88), lineHeight: 48, maxHeight: 780)
            y += narrativeHeight + 84

            drawSectionTitle("核心张力", atY: y)
            y += 58
            y = drawTensions(constellation.coreTensions, atY: y)
            y += 70

            drawSectionTitle("航线", atY: y)
            y += 58
            y = drawGrowth(constellation.growthSuggestions, atY: y)
            y += 70

            drawSectionTitle("继续共鸣", atY: y)
            y += 58
            y = drawRecommendations(constellation.recommendations, atY: y)

            drawFooter(atY: min(posterHeight - 190, max(y + 50, posterHeight - 230)))
        }
    }

    private static func drawBackground(in context: CGContext, size: CGSize) {
        UIColor(red: 0.009, green: 0.008, blue: 0.022, alpha: 1).setFill()
        context.fill(CGRect(origin: .zero, size: size))

        let colors = [
            UIColor(red: 0.12, green: 0.09, blue: 0.18, alpha: 0.72).cgColor,
            UIColor(red: 0.02, green: 0.018, blue: 0.04, alpha: 0.0).cgColor
        ] as CFArray
        let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 1])!
        context.drawRadialGradient(
            gradient,
            startCenter: CGPoint(x: size.width * 0.68, y: 210),
            startRadius: 20,
            endCenter: CGPoint(x: size.width * 0.68, y: 210),
            endRadius: 620,
            options: []
        )

        context.setStrokeColor(gold.withAlphaComponent(0.09).cgColor)
        context.setLineWidth(1.2)
        for index in 0..<9 {
            let rect = CGRect(
                x: margin - CGFloat(index) * 22,
                y: 740 + CGFloat(index) * 290,
                width: contentWidth + CGFloat(index) * 44,
                height: 76 + CGFloat(index % 3) * 22
            )
            context.strokeEllipse(in: rect)
        }
    }

    private static func drawCelestialMark(in context: CGContext, center: CGPoint) {
        context.setStrokeColor(gold.withAlphaComponent(0.28).cgColor)
        context.setLineWidth(2)
        context.strokeEllipse(in: CGRect(x: center.x - 164, y: center.y - 164, width: 328, height: 328))
        context.strokeEllipse(in: CGRect(x: center.x - 216, y: center.y - 60, width: 432, height: 120))
        UIColor(red: 0.035, green: 0.028, blue: 0.060, alpha: 1).setFill()
        context.fillEllipse(in: CGRect(x: center.x - 118, y: center.y - 118, width: 236, height: 236))
        context.setStrokeColor(UIColor(white: 0.9, alpha: 0.18).cgColor)
        context.strokeEllipse(in: CGRect(x: center.x - 92, y: center.y - 92, width: 184, height: 184))
    }

    private static func drawSectionTitle(_ title: String, atY y: CGFloat) {
        draw(title, at: CGPoint(x: margin, y: y), size: 27, weight: .black, color: gold)
    }

    private static func drawDimensionBars(_ dimensions: [String: PsycheDimension], atY startY: CGFloat) -> CGFloat {
        let labels: [String: String] = [
            "openness": "开放性",
            "independence": "独立性",
            "emotional_depth": "情感深度",
            "meaning_seeking": "意义追寻",
            "aesthetic_sensitivity": "审美敏感",
            "action_tendency": "行动力",
            "relationship_need": "关系需求"
        ]
        var y = startY
        for item in dimensions.sorted(by: { $0.value.score > $1.value.score }) {
            let label = labels[item.key] ?? item.key
            draw(label, at: CGPoint(x: margin, y: y), size: 28, weight: .semibold, color: .white)
            draw("\(item.value.score)", at: CGPoint(x: posterWidth - margin - 58, y: y), size: 28, weight: .bold, color: gold)
            y += 42

            let track = CGRect(x: margin, y: y, width: contentWidth, height: 12)
            rounded(track, radius: 6, color: UIColor(white: 1, alpha: 0.08))
            rounded(CGRect(x: margin, y: y, width: contentWidth * CGFloat(max(0, min(item.value.score, 100))) / 100, height: 12), radius: 6, color: gold.withAlphaComponent(0.78))
            y += 44

            let summary = item.value.interpretation.components(separatedBy: " 盲点：").first ?? item.value.interpretation
            let height = drawWrapped(summary, at: CGPoint(x: margin, y: y), width: contentWidth, size: 24, weight: .regular, color: softWhite.withAlphaComponent(0.78), lineHeight: 36, maxHeight: 76)
            y += height + 34
        }
        return y
    }

    private static func drawLineageBlock(_ constellation: PsycheConstellation, atY startY: CGFloat) -> CGFloat {
        var y = startY
        let lines = [
            "主星体：\(constellation.archetype.name)",
            "本次称谓：\(constellation.archetype.displayName)",
            "星体锚点：\(constellation.archetype.englishName)"
        ]
        for line in lines {
            y += drawCardLine(line, atY: y)
        }
        return y
    }

    private static func drawTensions(_ tensions: [PsycheConstellation.CoreTension], atY startY: CGFloat) -> CGFloat {
        var y = startY
        for tension in tensions.prefix(2) {
            draw(tension.name, at: CGPoint(x: margin, y: y), size: 34, weight: .bold, color: .white)
            y += 48
            let height = drawWrapped(tension.description, at: CGPoint(x: margin, y: y), width: contentWidth, size: 27, weight: .regular, color: softWhite.withAlphaComponent(0.82), lineHeight: 42, maxHeight: 220)
            y += height + 42
        }
        return y
    }

    private static func drawGrowth(_ suggestions: [PsycheConstellation.GrowthSuggestion], atY startY: CGFloat) -> CGFloat {
        var y = startY
        for suggestion in suggestions.prefix(2) {
            draw(suggestion.title, at: CGPoint(x: margin, y: y), size: 33, weight: .bold, color: .white)
            y += 48
            let body = suggestion.actionableSteps.first ?? suggestion.description
            let height = drawWrapped(body, at: CGPoint(x: margin, y: y), width: contentWidth, size: 27, weight: .regular, color: softWhite.withAlphaComponent(0.82), lineHeight: 42, maxHeight: 150)
            y += height + 42
        }
        return y
    }

    private static func drawRecommendations(_ recommendations: PsycheConstellation.Recommendations, atY startY: CGFloat) -> CGFloat {
        var y = startY
        let values = [
            ("书籍", recommendations.books.first.map { "\($0.title) · \($0.author)" }),
            ("电影", recommendations.films.first.map { "\($0.title) · \($0.director)" }),
            ("音乐", recommendations.music.first.map { "\($0.artist) · \($0.album)" })
        ]

        for value in values {
            guard let body = value.1 else { continue }
            draw(value.0, at: CGPoint(x: margin, y: y), size: 24, weight: .black, color: gold)
            y += 34
            y += drawCardLine(body, atY: y)
        }
        return y
    }

    private static func drawFooter(atY y: CGFloat) {
        let rect = CGRect(x: margin, y: y, width: contentWidth, height: 138)
        rounded(rect, radius: 34, color: UIColor(white: 1, alpha: 0.055))
        draw("在「本源」里，生成你的精神星图。", at: CGPoint(x: margin + 34, y: y + 30), size: 30, weight: .black, color: .white)
        drawWrapped("搜索「本源」，或把这张星图发给想一起探索的人。", at: CGPoint(x: margin + 34, y: y + 78), width: contentWidth - 68, size: 24, weight: .semibold, color: gold.withAlphaComponent(0.92), lineHeight: 34, maxHeight: 48)
    }

    private static func drawCardLine(_ text: String, atY y: CGFloat) -> CGFloat {
        let rect = CGRect(x: margin, y: y, width: contentWidth, height: 82)
        rounded(rect, radius: 26, color: UIColor(white: 1, alpha: 0.055))
        drawWrapped(text, at: CGPoint(x: margin + 28, y: y + 22), width: contentWidth - 56, size: 27, weight: .semibold, color: softWhite, lineHeight: 36, maxHeight: 48)
        return 104
    }

    private static func rounded(_ rect: CGRect, radius: CGFloat, color: UIColor) {
        color.setFill()
        UIBezierPath(roundedRect: rect, cornerRadius: radius).fill()
    }

    @discardableResult
    private static func drawWrapped(_ text: String, at point: CGPoint, width: CGFloat, size: CGFloat, weight: UIFont.Weight, color: UIColor, lineHeight: CGFloat, maxHeight: CGFloat) -> CGFloat {
        let paragraph = NSMutableParagraphStyle()
        paragraph.minimumLineHeight = lineHeight
        paragraph.maximumLineHeight = lineHeight
        paragraph.lineBreakMode = .byTruncatingTail
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color,
            .paragraphStyle: paragraph
        ]
        let rect = CGRect(x: point.x, y: point.y, width: width, height: maxHeight)
        let attributed = NSAttributedString(string: text, attributes: attributes)
        attributed.draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading], context: nil)
        let measured = attributed.boundingRect(with: CGSize(width: width, height: maxHeight), options: [.usesLineFragmentOrigin, .usesFontLeading], context: nil)
        return min(ceil(measured.height), maxHeight)
    }

    private static func draw(_ text: String, at point: CGPoint, size: CGFloat, weight: UIFont.Weight, color: UIColor) {
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color
        ]
        text.draw(at: point, withAttributes: attributes)
    }

    private static let gold = UIColor(red: 0.76, green: 0.68, blue: 0.47, alpha: 1)
    private static let softWhite = UIColor(white: 0.86, alpha: 1)
}
