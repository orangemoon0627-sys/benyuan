# Native Capabilities Checklist

## Phase 1
- WebView shell
- Status bar styling
- Safe area handling
- Route resume
- External browser fallback

## Phase 1.5
- Share sheet for result links and long images
- Photo picker entry handoff (implemented via bridge, photo-library first)
- Native pull-to-refresh on error states
- Simple network reachability banner

## Phase 2
- Native launch ritual
- Native theater transitions
- Native result sharing card composer
- Native image export pipeline

## Permissions to plan for
- Photo library read access
- Photo library add access if saving long images locally

## Recovery-critical states
- `benyuan-v3-pending-part1`
- `benyuan-v3-pending-part2`
- `benyuan-v3-last-session`
- `/processing/benyuan?phase=part1`
- `/processing/benyuan?phase=constellation`
