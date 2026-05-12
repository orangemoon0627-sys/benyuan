# Native Capabilities Checklist

## Current Native Scope
- SwiftUI native main flow
- Native authentication and account surfaces
- Native Part 1 collection and upload
- Native theater interaction
- Native constellation result
- Native share sheet
- Native photo picker and camera capture
- Network reachability banner

## Debug-Only Scope
- WKWebView inspector for local development only
- Web bridge smoke checks for legacy comparison only
- Runtime URL override in development only

## Permissions to plan for
- Photo library read access
- Camera access
- Photo library add access if saving long images locally

## Recovery-critical states
- `part1_id`
- `theater_script_id`
- `part2_id`
- `constellation_id`
- native answers and uploaded assets draft
- stage timing and choice timing
