# Benyuan Native Bridge Contract

## Goal
Provide a minimal native bridge for the iOS shell so the web layer can progressively request native capabilities without forking the full experience yet.

## Exposed concepts
- `window.__BENYUAN_SHELL_INFO__`
- `window.BenyuanNativeShell.share(payload)`
- `window.BenyuanNativeShell.openExternal(url)`
- `window.BenyuanNativeShell.pickImages(payload)`

## Proposed payloads
### share
```json
{
  "title": "我的精神星图",
  "text": "我在本源完成了一次精神探索",
  "url": "https://..."
}
```

### openExternal
```json
{
  "url": "https://..."
}
```

### pickImages
```json
{
  "questionId": "A2_music_analysis",
  "maxCount": 3,
  "source": "library"
}
```

`source` supports:
- `library`
- `camera`

### pickImages result
```json
{
  "cancelled": false,
  "assets": [
    {
      "name": "native-image-1.jpg",
      "mimeType": "image/jpeg",
      "dataUrl": "data:image/jpeg;base64,...",
      "size": 182334,
      "width": 1536,
      "height": 1024
    }
  ]
}
```

## Notes
- This bridge is additive; the web app must continue to work without it.
- Native handlers should fail silently rather than block the flow.
- `pickImages` now covers both photo-library and camera capture, while the web upload API remains the single backend ingress.
- Simulator smoke mode can inject a bundled fixture through launch arguments, so native upload validation can run without manual tapping.
- Real camera hardware still requires the checklist in `/Users/fanhao/Documents/Playground/docs/benyuan-ios-camera-real-device-checklist.md`.
