import UIKit

enum BenyuanConstellationImageRenderer {
    // 完整精神星图长图导出尺寸，对应 height: 3840 的保存海报。
    private static let posterWidth: CGFloat = 1080
    private static let posterHeight: CGFloat = 3840
    private static let margin: CGFloat = 88
    private static let contentWidth: CGFloat = posterWidth - margin * 2
    private static let footerHeight: CGFloat = 166
    private static let footerBottomInset: CGFloat = 92
    private static let footerTop = posterHeight - footerBottomInset - footerHeight
    private static let contentBottomLimit = footerTop - 84

    private struct DimensionOrbitPoint {
        let key: String
        let label: String
        let dimension: PsycheDimension
    }

    static func render(constellation: PsycheConstellation, userName: String? = nil) -> UIImage {
        renderLongImage(constellation: constellation.canonicalizedForNativeDisplay, userName: userName)
    }

    static func renderLongImage(constellation: PsycheConstellation, userName: String? = nil) -> UIImage {
        let data = constellation.canonicalizedForNativeDisplay
        let size = CGSize(width: posterWidth, height: posterHeight)
        let renderer = UIGraphicsImageRenderer(size: size)

        return renderer.image { context in
            let cg = context.cgContext
            drawBackground(in: cg, size: size, archetype: data.archetype)

            var y: CGFloat = 108
            draw("本源 · 精神星图", at: CGPoint(x: margin, y: y), size: 31, weight: .semibold, color: gold)
            y += 58

            drawUserLine(userName, atY: y)
            y += 54

            drawArchetypeMark(for: data.archetype, in: cg, center: CGPoint(x: posterWidth - 240, y: 262), diameter: 286)
            drawWrapped(data.archetype.name, at: CGPoint(x: margin, y: y), width: 650, size: 72, weight: .black, color: .white, lineHeight: 84, maxHeight: 176)
            y += 178
            draw(data.archetype.englishName, at: CGPoint(x: margin, y: y), size: 27, weight: .medium, color: gold.withAlphaComponent(0.92))
            y += 54

            if data.archetype.displayName != data.archetype.name || data.archetype.displaySubtitle != data.archetype.englishName {
                let annotationHeight = drawWrapped("\(data.archetype.displayName)：\(data.archetype.displaySubtitle)", at: CGPoint(x: margin, y: y), width: contentWidth, size: 29, weight: .semibold, color: softWhite, lineHeight: 42, maxHeight: 92)
                y += annotationHeight + 32
            }

            drawWrapped(data.archetype.coreEssence, at: CGPoint(x: margin, y: y), width: contentWidth, size: 36, weight: .regular, color: UIColor(white: 0.92, alpha: 1), lineHeight: 53, maxHeight: 158)
            y += 212

            drawSectionTitle("七维轨道", atY: y)
            y += 54
            y = drawDimensionOrbitChart(data.sevenDimensions, atY: y)
            y += 74

            drawSectionTitle("精神肖像", atY: y)
            y += 56
            let narrative = data.narrativeOverview.replacingOccurrences(of: "\n\n", with: "\n")
            let narrativeHeight = drawWrapped(narrative, at: CGPoint(x: margin, y: y), width: contentWidth, size: 29, weight: .regular, color: softWhite.withAlphaComponent(0.88), lineHeight: 46, maxHeight: 640)
            y += narrativeHeight + 76

            drawSectionTitle("核心张力", atY: y)
            y += 56
            y = drawTensions(data.coreTensions, atY: y)
            y += 64

            drawSectionTitle("航线", atY: y)
            y += 56
            y = drawGrowth(data.growthSuggestions, atY: y)
            y += 64

            drawSectionTitle("继续共鸣", atY: y)
            y += 56
            y = drawRecommendations(data.recommendations, atY: y)

            drawFooter(atY: footerTop)
        }
    }

    private static func drawBackground(in context: CGContext, size: CGSize, archetype: PsycheArchetype) {
        UIColor(red: 0.009, green: 0.008, blue: 0.022, alpha: 1).setFill()
        context.fill(CGRect(origin: .zero, size: size))

        let accent = accentColor(for: archetype)
        let colors = [
            accent.withAlphaComponent(0.45).cgColor,
            UIColor(red: 0.02, green: 0.018, blue: 0.04, alpha: 0.0).cgColor
        ] as CFArray
        let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 1])!
        context.drawRadialGradient(
            gradient,
            startCenter: CGPoint(x: size.width * 0.66, y: 230),
            startRadius: 24,
            endCenter: CGPoint(x: size.width * 0.66, y: 230),
            endRadius: 690,
            options: []
        )

        context.setStrokeColor(gold.withAlphaComponent(0.075).cgColor)
        context.setLineWidth(1.2)
        for index in 0..<9 {
            let rect = CGRect(
                x: margin - CGFloat(index) * 22,
                y: 720 + CGFloat(index) * 298,
                width: contentWidth + CGFloat(index) * 44,
                height: 78 + CGFloat(index % 3) * 22
            )
            context.strokeEllipse(in: rect)
        }
    }

    private static func drawUserLine(_ userName: String?, atY y: CGFloat) {
        let name = cleanedUserName(userName)
        draw("为 \(name) 生成", at: CGPoint(x: margin, y: y), size: 27, weight: .black, color: softWhite.withAlphaComponent(0.90))
    }

    private static func drawArchetypeMark(for archetype: PsycheArchetype, in context: CGContext, center: CGPoint, diameter: CGFloat) {
        context.saveGState()
        let accent = accentColor(for: archetype)
        let halo = CGRect(x: center.x - diameter * 0.60, y: center.y - diameter * 0.60, width: diameter * 1.20, height: diameter * 1.20)
        context.setStrokeColor(accent.withAlphaComponent(0.22).cgColor)
        context.setLineWidth(1.8)
        context.strokeEllipse(in: halo)
        context.strokeEllipse(in: halo.insetBy(dx: diameter * 0.12, dy: diameter * 0.34))

        let assetRect = CGRect(x: center.x - diameter * 0.50, y: center.y - diameter * 0.50, width: diameter, height: diameter)
        if let image = UIImage(named: celestialCoreAssetName(for: archetype)) ?? UIImage(named: celestialBaseAssetName(for: archetype)) {
            image.draw(in: assetRect, blendMode: .normal, alpha: 1)
        } else {
            drawFallbackArchetypeGlyph(for: archetype, in: context, rect: assetRect, accent: accent)
        }
        context.restoreGState()
    }

    private static func drawFallbackArchetypeGlyph(for archetype: PsycheArchetype, in context: CGContext, rect: CGRect, accent: UIColor) {
        let name = archetype.name
        UIColor(red: 0.035, green: 0.028, blue: 0.060, alpha: 0.95).setFill()
        context.fillEllipse(in: rect.insetBy(dx: rect.width * 0.16, dy: rect.height * 0.16))
        context.setStrokeColor(accent.withAlphaComponent(0.62).cgColor)
        context.setLineWidth(5)
        if name == "事件视界沉潜者" {
            context.strokeEllipse(in: rect.insetBy(dx: rect.width * 0.08, dy: rect.height * 0.36))
        } else if name == "星云织梦者" {
            context.strokeEllipse(in: rect.insetBy(dx: rect.width * 0.18, dy: rect.height * 0.24))
            context.strokeEllipse(in: rect.insetBy(dx: rect.width * 0.30, dy: rect.height * 0.18))
        } else if name == "星图筑序者" || name == "深空锚定者" {
            context.move(to: CGPoint(x: rect.minX + rect.width * 0.20, y: rect.midY))
            context.addLine(to: CGPoint(x: rect.maxX - rect.width * 0.20, y: rect.midY))
            context.move(to: CGPoint(x: rect.midX, y: rect.minY + rect.height * 0.20))
            context.addLine(to: CGPoint(x: rect.midX, y: rect.maxY - rect.height * 0.20))
            context.strokePath()
        } else {
            context.strokeEllipse(in: rect.insetBy(dx: rect.width * 0.08, dy: rect.height * 0.30))
        }
    }

    private static func drawSectionTitle(_ title: String, atY y: CGFloat) {
        draw(title, at: CGPoint(x: margin, y: y), size: 27, weight: .black, color: gold)
    }

    private static func drawDimensionOrbitChart(_ dimensions: [String: PsycheDimension], atY startY: CGFloat) -> CGFloat {
        let points = orderedDimensionPoints(dimensions)
        let chartSize: CGFloat = 500
        let center = CGPoint(x: posterWidth / 2, y: startY + chartSize / 2 + 18)
        let maxRadius = chartSize * 0.38
        let topThree = points.sorted { $0.dimension.score > $1.dimension.score }.prefix(3)

        guard !points.isEmpty else {
            return startY
        }

        let context = UIGraphicsGetCurrentContext()
        context?.saveGState()
        context?.setLineWidth(1.1)
        context?.setStrokeColor(gold.withAlphaComponent(0.18).cgColor)
        for ring in 1...4 {
            let radius = maxRadius * CGFloat(ring) / 4
            context?.strokeEllipse(in: CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2))
        }

        for index in points.indices {
            let angle = chartAngle(index: index, count: points.count)
            let end = polarPoint(center: center, angle: angle, radius: maxRadius)
            context?.move(to: center)
            context?.addLine(to: end)
            context?.strokePath()
        }

        let polygon = UIBezierPath()
        for (index, item) in points.enumerated() {
            let radius = maxRadius * CGFloat(max(0, min(item.dimension.score, 100))) / 100
            let point = polarPoint(center: center, angle: chartAngle(index: index, count: points.count), radius: radius)
            if index == 0 { polygon.move(to: point) } else { polygon.addLine(to: point) }
        }
        polygon.close()
        gold.withAlphaComponent(0.16).setFill()
        polygon.fill()
        gold.withAlphaComponent(0.72).setStroke()
        polygon.lineWidth = 3.2
        polygon.stroke()

        for (index, item) in points.enumerated() {
            let angle = chartAngle(index: index, count: points.count)
            let point = polarPoint(center: center, angle: angle, radius: maxRadius * CGFloat(max(0, min(item.dimension.score, 100))) / 100)
            rounded(CGRect(x: point.x - 6, y: point.y - 6, width: 12, height: 12), radius: 6, color: .white.withAlphaComponent(0.90))

            let labelPoint = polarPoint(center: center, angle: angle, radius: maxRadius + 78)
            let labelWidth: CGFloat = 150
            let labelRect = CGRect(x: labelPoint.x - labelWidth / 2, y: labelPoint.y - 26, width: labelWidth, height: 52)
            drawCentered("\(item.label)\n\(item.dimension.score)", in: labelRect, size: 20, weight: .black, color: softWhite.withAlphaComponent(0.94), lineHeight: 25)
        }
        context?.restoreGState()

        var y = startY + chartSize + 78
        for item in topThree {
            y += drawCardLine("\(item.label)：\(dimensionLead(item.dimension.interpretation))", atY: y, maxHeight: 78)
        }
        return y
    }

    private static func drawTensions(_ tensions: [PsycheConstellation.CoreTension], atY startY: CGFloat) -> CGFloat {
        var y = startY
        for tension in tensions.prefix(2) where y < contentBottomLimit - 230 {
            draw(tension.name, at: CGPoint(x: margin, y: y), size: 33, weight: .bold, color: .white)
            y += 46
            let height = drawWrapped(tension.description, at: CGPoint(x: margin, y: y), width: contentWidth, size: 26, weight: .regular, color: softWhite.withAlphaComponent(0.82), lineHeight: 40, maxHeight: 176)
            y += height + 38
        }
        return y
    }

    private static func drawGrowth(_ suggestions: [PsycheConstellation.GrowthSuggestion], atY startY: CGFloat) -> CGFloat {
        var y = startY
        for suggestion in suggestions.prefix(2) where y < contentBottomLimit - 250 {
            draw(suggestion.title, at: CGPoint(x: margin, y: y), size: 32, weight: .bold, color: .white)
            y += 46
            draw("为什么做", at: CGPoint(x: margin, y: y), size: 20, weight: .black, color: gold.withAlphaComponent(0.92))
            y += 30
            let descriptionHeight = drawWrapped(suggestion.description, at: CGPoint(x: margin, y: y), width: contentWidth, size: 25, weight: .regular, color: softWhite.withAlphaComponent(0.82), lineHeight: 39, maxHeight: 118)
            y += descriptionHeight + 16
            if let step = suggestion.actionableSteps.first {
                draw("可以尝试", at: CGPoint(x: margin, y: y), size: 20, weight: .black, color: gold.withAlphaComponent(0.92))
                y += 30
                y += drawCardLine(step, atY: y, maxHeight: 88)
                if y < contentBottomLimit - 120 {
                    draw("会带来什么", at: CGPoint(x: margin, y: y), size: 20, weight: .black, color: gold.withAlphaComponent(0.92))
                    y += 30
                    let effect = growthExpectedEffect(for: suggestion, step: step)
                    let effectHeight = drawWrapped(effect, at: CGPoint(x: margin, y: y), width: contentWidth, size: 23, weight: .regular, color: softWhite.withAlphaComponent(0.78), lineHeight: 35, maxHeight: 74)
                    y += effectHeight + 24
                }
            } else {
                y += 22
            }
        }
        return y
    }

    private static func drawRecommendations(_ recommendations: PsycheConstellation.Recommendations, atY startY: CGFloat) -> CGFloat {
        var y = startY
        let intro = "这些不是书影音清单，而是这张星图的外部回声：每一项都说明它为什么会和你的精神结构发生共振。"
        let introHeight = drawWrapped(intro, at: CGPoint(x: margin, y: y), width: contentWidth, size: 24, weight: .regular, color: softWhite.withAlphaComponent(0.80), lineHeight: 36, maxHeight: 78)
        y += introHeight + 28

        let values: [(String, String?, String?)] = [
            ("书籍", recommendations.books.first.map { "\($0.title) · \($0.author)" }, recommendations.books.first?.reason),
            ("电影", recommendations.films.first.map { "\($0.title) · \($0.director)" }, recommendations.films.first?.reason),
            ("音乐", recommendations.music.first.map { "\($0.artist) · \($0.album)" }, recommendations.music.first?.reason)
        ]

        for value in values where y < contentBottomLimit - 170 {
            guard let title = value.1 else { continue }
            draw(value.0, at: CGPoint(x: margin, y: y), size: 24, weight: .black, color: gold)
            y += 34
            y += drawRecommendationCard(title: title, reason: value.2, atY: y)
        }
        return y
    }

    private static func growthExpectedEffect(for suggestion: PsycheConstellation.GrowthSuggestion, step: String) -> String {
        let markers = ["这样做会", "会让你", "帮助你", "从而", "用来"]
        for marker in markers {
            if let range = step.range(of: marker) {
                let effect = String(step[range.lowerBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
                if effect.count >= 8 {
                    return effect
                }
            }
        }
        if suggestion.description.contains("边界") {
            return "这样做会让边界从撤退变成可沟通的坐标，减少关系里的误读。"
        }
        if suggestion.description.contains("行动") || suggestion.description.contains("现实") {
            return "这样做会让理解落到现实动作里，减少只在脑内反复校准的消耗。"
        }
        if suggestion.description.contains("情绪") || suggestion.description.contains("感受") {
            return "这样做会让模糊感受变得可辨认，避免它只在身体里反复回放。"
        }
        return "这样做会让这条路径从理解变成可观察的小变化，而不是停留在一句漂亮建议里。"
    }

    private static func drawRecommendationCard(title: String, reason: String?, atY y: CGFloat) -> CGFloat {
        let rect = CGRect(x: margin, y: y, width: contentWidth, height: 132)
        rounded(rect, radius: 26, color: UIColor(white: 1, alpha: 0.055))
        drawWrapped(title, at: CGPoint(x: margin + 28, y: y + 18), width: contentWidth - 56, size: 25, weight: .semibold, color: softWhite, lineHeight: 34, maxHeight: 36)
        if let reason, !reason.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            drawWrapped(reason, at: CGPoint(x: margin + 28, y: y + 64), width: contentWidth - 56, size: 21, weight: .regular, color: softWhite.withAlphaComponent(0.78), lineHeight: 30, maxHeight: 54)
        }
        return 154
    }

    private static func drawFooter(atY y: CGFloat) {
        let rect = CGRect(x: margin, y: y, width: contentWidth, height: footerHeight)
        rounded(rect, radius: 36, color: UIColor(white: 1, alpha: 0.055))
        draw("在「本源」里，生成你的精神星图。", at: CGPoint(x: margin + 34, y: y + 35), size: 31, weight: .black, color: .white)
        drawWrapped("搜索「本源」，把这张星图发给想一起探索的人。", at: CGPoint(x: margin + 34, y: y + 91), width: contentWidth - 68, size: 24, weight: .semibold, color: gold.withAlphaComponent(0.92), lineHeight: 34, maxHeight: 52)
    }

    private static func drawCardLine(_ text: String, atY y: CGFloat, maxHeight: CGFloat = 82) -> CGFloat {
        let rect = CGRect(x: margin, y: y, width: contentWidth, height: maxHeight)
        rounded(rect, radius: 26, color: UIColor(white: 1, alpha: 0.055))
        drawWrapped(text, at: CGPoint(x: margin + 28, y: y + 18), width: contentWidth - 56, size: 25, weight: .semibold, color: softWhite, lineHeight: 34, maxHeight: maxHeight - 26)
        return maxHeight + 22
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

    private static func drawCentered(_ text: String, in rect: CGRect, size: CGFloat, weight: UIFont.Weight, color: UIColor, lineHeight: CGFloat) {
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = .center
        paragraph.minimumLineHeight = lineHeight
        paragraph.maximumLineHeight = lineHeight
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color,
            .paragraphStyle: paragraph
        ]
        text.draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading], attributes: attributes, context: nil)
    }

    private static func draw(_ text: String, at point: CGPoint, size: CGFloat, weight: UIFont.Weight, color: UIColor) {
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: size, weight: weight),
            .foregroundColor: color
        ]
        text.draw(at: point, withAttributes: attributes)
    }

    private static func orderedDimensionPoints(_ dimensions: [String: PsycheDimension]) -> [DimensionOrbitPoint] {
        let labels: [(String, String)] = [
            ("openness", "潜意识开放度"),
            ("independence", "边界完整度"),
            ("emotional_depth", "情绪沉潜度"),
            ("meaning_seeking", "意义欲望"),
            ("aesthetic_sensitivity", "象征感受力"),
            ("action_tendency", "现实落地力"),
            ("relationship_need", "客体联结需求")
        ]

        return labels.compactMap { key, label in
            guard let dimension = dimensions[key] else { return nil }
            return DimensionOrbitPoint(key: key, label: label, dimension: dimension)
        }
    }

    private static func chartAngle(index: Int, count: Int) -> CGFloat {
        -CGFloat.pi / 2 + CGFloat(index) * CGFloat.pi * 2 / CGFloat(max(count, 1))
    }

    private static func polarPoint(center: CGPoint, angle: CGFloat, radius: CGFloat) -> CGPoint {
        CGPoint(x: center.x + cos(angle) * radius, y: center.y + sin(angle) * radius)
    }

    private static func dimensionLead(_ value: String) -> String {
        let firstSentence = value
            .replacingOccurrences(of: "\n", with: " ")
            .components(separatedBy: " 盲点：")
            .first?
            .components(separatedBy: "。")
            .first ?? value
        let cleaned = firstSentence.trimmingCharacters(in: .whitespacesAndNewlines)
        return cleaned.isEmpty ? "这条轨道是你这次星图里最亮的精神线索。" : cleaned
    }

    private static func cleanedUserName(_ value: String?) -> String {
        let cleaned = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !cleaned.isEmpty else { return "你的本源档案" }
        return cleaned.count > 18 ? "\(cleaned.prefix(18))" : cleaned
    }

    private static func celestialCoreAssetName(for archetype: PsycheArchetype) -> String {
        celestialBaseAssetName(for: archetype) + "Core"
    }

    private static func celestialBaseAssetName(for archetype: PsycheArchetype) -> String {
        switch archetype.name.trimmingCharacters(in: .whitespacesAndNewlines) {
        case "远潮观月者":
            return "BenyuanCelestialFarTideMoon"
        case "星图筑序者":
            return "BenyuanCelestialStarMapArchitect"
        case "月港栖岸者":
            return "BenyuanCelestialMoonHarbor"
        case "存在游牧者":
            return "BenyuanCelestialExistentialNomad"
        case "雨窗抒写者":
            return "BenyuanCelestialRainWindowScribe"
        case "事件视界沉潜者":
            return "BenyuanCelestialEventHorizonDiver"
        case "星云织梦者":
            return "BenyuanCelestialNebulaWeaver"
        case "日冕引燃者":
            return "BenyuanCelestialSolarCorona"
        case "类地栖居者":
            return "BenyuanCelestialTerrestrialPlanet"
        case "深空锚定者":
            return "BenyuanCelestialDeepSpaceAnchor"
        default:
            return "BenyuanCelestialFarTideMoon"
        }
    }

    private static func accentColor(for archetype: PsycheArchetype) -> UIColor {
        switch archetype.name.trimmingCharacters(in: .whitespacesAndNewlines) {
        case "事件视界沉潜者", "日冕引燃者":
            return UIColor(red: 0.72, green: 0.55, blue: 0.22, alpha: 1)
        case "星云织梦者":
            return UIColor(red: 0.48, green: 0.38, blue: 0.78, alpha: 1)
        case "类地栖居者":
            return UIColor(red: 0.36, green: 0.53, blue: 0.60, alpha: 1)
        case "雨窗抒写者":
            return UIColor(red: 0.42, green: 0.54, blue: 0.68, alpha: 1)
        default:
            return gold
        }
    }

    private static let gold = UIColor(red: 0.76, green: 0.68, blue: 0.47, alpha: 1)
    private static let softWhite = UIColor(white: 0.86, alpha: 1)
}
