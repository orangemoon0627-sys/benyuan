# Benyuan Design Tokens v1

Generated: 2026-03-10

## Purpose
This file freezes the current Benyuan visual system before iOS migration so UI refactors can move fast without losing the current black-gold language.

## Core direction
- Atmosphere: calm, void-like, ceremonial, restrained
- Palette: black / white / gray with a single gold accent
- Typography: SF Pro Display + SF Pro Text + PingFang fallback
- Motion: soft, short, never playful
- Interaction: one primary action per screen, strong focus, minimal chrome

## Color tokens
- `bgVoid`: `#000000`
- `bgAbyss`: `#0A0A0A`
- `bgSurface`: `#1A1A1A`
- `textPrimary`: `#FFFFFF`
- `textSecondary`: `#999999`
- `textTertiary`: `#666666`
- `accentGold`: `#D4AF37`
- `accentGoldDim`: `rgba(212, 175, 55, 0.3)`
- `border`: `rgba(255, 255, 255, 0.08)`
- `overlay`: `rgba(0, 0, 0, 0.9)`
- `glow`: `rgba(212, 175, 55, 0.2)`

## Typography tokens
- Hero title: `72px`
- Large title: `56px`
- Section title: `40px`
- Main heading: `28px`
- Body: `16px`
- Helper: `14px`
- Meta / eyebrow: `12px`
- Display weight: `300`
- Body line-height: `1.65`
- Long-form reading line-height: `1.8`

## Motion tokens
- Fast: `150ms`
- Base: `300ms`
- Slow: `500ms`
- Slower: `800ms`
- Long press launch: `3000ms`
- Part 1 auto-advance after single select: `520ms`
- Part 1 auto-advance after upload: `680ms`

## Layout tokens
- Minimum touch target: `44px`
- Nav height: `56px`
- Bottom action bar height: `80px`
- Progress hairline: `1px`
- Max content widths: `640 / 768 / 1024 / 1280`

## Safe migration rules
- Freeze these tokens as the first shared visual contract for web and iOS.
- Future UI changes should adjust token values first, not hand-tune page by page.
- Keep the single gold accent rule during the first iOS shell phase.
- If a new iOS-native surface needs deviation, record it as an override instead of mutating the base set silently.

## Source of truth
- Type-safe token export: `/Users/fanhao/Documents/Playground/src/config/benyuan-design-tokens.ts`
- Current CSS runtime tokens: `/Users/fanhao/Documents/Playground/src/app/globals.css`
