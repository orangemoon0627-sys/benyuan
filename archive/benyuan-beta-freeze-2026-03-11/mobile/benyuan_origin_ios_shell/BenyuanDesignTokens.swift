import SwiftUI

// Starter token mirror for the first iOS shell phase.
enum BenyuanColor {
    static let bgVoid = Color(red: 0.0, green: 0.0, blue: 0.0)
    static let bgAbyss = Color(red: 10.0 / 255.0, green: 10.0 / 255.0, blue: 10.0 / 255.0)
    static let bgSurface = Color(red: 26.0 / 255.0, green: 26.0 / 255.0, blue: 26.0 / 255.0)
    static let textPrimary = Color.white
    static let textSecondary = Color(red: 153.0 / 255.0, green: 153.0 / 255.0, blue: 153.0 / 255.0)
    static let textTertiary = Color(red: 102.0 / 255.0, green: 102.0 / 255.0, blue: 102.0 / 255.0)
    static let accentGold = Color(red: 212.0 / 255.0, green: 175.0 / 255.0, blue: 55.0 / 255.0)
}

enum BenyuanSpacing {
    static let x1: CGFloat = 4
    static let x2: CGFloat = 8
    static let x3: CGFloat = 12
    static let x4: CGFloat = 16
    static let x6: CGFloat = 24
    static let x8: CGFloat = 32
    static let x12: CGFloat = 48
    static let x16: CGFloat = 64
}

enum BenyuanTypography {
    static let hero: CGFloat = 72
    static let x3l: CGFloat = 56
    static let x2l: CGFloat = 40
    static let xl: CGFloat = 28
    static let lg: CGFloat = 20
    static let base: CGFloat = 16
    static let sm: CGFloat = 14
    static let xs: CGFloat = 12
    static let bodyLineHeight: CGFloat = 1.65
    static let readingLineHeight: CGFloat = 1.8
}

enum BenyuanMotion {
    static let fast: Double = 0.15
    static let base: Double = 0.30
    static let slow: Double = 0.50
    static let slower: Double = 0.80
    static let longPressLaunch: Double = 3.0
    static let questionAutoAdvance: Double = 0.52
    static let uploadAutoAdvance: Double = 0.68
}
