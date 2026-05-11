import SwiftUI

// Starter token mirror for the first iOS shell phase.
enum BenyuanColor {
    static let bgVoid = Color(red: 2.0 / 255.0, green: 2.0 / 255.0, blue: 8.0 / 255.0)
    static let bgAbyss = Color(red: 6.0 / 255.0, green: 6.0 / 255.0, blue: 13.0 / 255.0)
    static let bgSurface = Color(red: 13.0 / 255.0, green: 12.0 / 255.0, blue: 20.0 / 255.0)
    static let aubergineBlack = Color(red: 15.0 / 255.0, green: 10.0 / 255.0, blue: 20.0 / 255.0)
    static let lunarBlue = Color(red: 12.0 / 255.0, green: 11.0 / 255.0, blue: 22.0 / 255.0)
    static let lunarBlueDeep = Color(red: 5.0 / 255.0, green: 5.0 / 255.0, blue: 13.0 / 255.0)
    static let nebulaViolet = Color(red: 30.0 / 255.0, green: 23.0 / 255.0, blue: 38.0 / 255.0)
    static let planetEdge = Color(red: 92.0 / 255.0, green: 82.0 / 255.0, blue: 104.0 / 255.0)
    static let glassFill = Color(red: 241.0 / 255.0, green: 239.0 / 255.0, blue: 246.0 / 255.0).opacity(0.060)
    static let glassFillStrong = Color(red: 241.0 / 255.0, green: 239.0 / 255.0, blue: 246.0 / 255.0).opacity(0.090)
    static let glassStroke = Color(red: 232.0 / 255.0, green: 228.0 / 255.0, blue: 236.0 / 255.0).opacity(0.13)
    static let glowGold = Color(red: 184.0 / 255.0, green: 168.0 / 255.0, blue: 121.0 / 255.0).opacity(0.16)
    static let glowSilver = Color(red: 230.0 / 255.0, green: 232.0 / 255.0, blue: 242.0 / 255.0).opacity(0.08)
    static let textPrimary = Color(red: 247.0 / 255.0, green: 248.0 / 255.0, blue: 255.0 / 255.0)
    static let textSecondary = Color(red: 196.0 / 255.0, green: 199.0 / 255.0, blue: 214.0 / 255.0)
    static let textTertiary = Color(red: 128.0 / 255.0, green: 130.0 / 255.0, blue: 150.0 / 255.0)
    static let accentGold = Color(red: 184.0 / 255.0, green: 168.0 / 255.0, blue: 121.0 / 255.0)
    static let primaryCTA = Color(red: 22.0 / 255.0, green: 21.0 / 255.0, blue: 31.0 / 255.0)
    static let primaryCTAText = Color(red: 247.0 / 255.0, green: 248.0 / 255.0, blue: 255.0 / 255.0)
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
    static let launchHero: CGFloat = 58
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
