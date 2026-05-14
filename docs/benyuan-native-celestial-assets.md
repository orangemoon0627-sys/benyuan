# 本源原生星体资产管线

本文件定义结果页十个固定主星体的本地视觉资产。主星体分型仍由规则决定；大模型只能生成个性化称谓、副标题和报告文字，不能替换这些主星体。

## 性能策略

- SwiftUI 负责页面结构、文字、按钮、轻量粒子、触觉反馈和低频呼吸动效。
- 复杂星体主体优先使用本地 raster 资产，降低 Shape、Gradient、Blur 每帧重绘成本。
- 如果本地资源缺失，`BenyuanDeepCelestialBody` 会自动回退到程序化 SwiftUI 星体，避免空白页。
- 第一阶段使用 source-backed 1024x1024 PNG 分层母版，SwiftUI 只叠加轻量呼吸、辉光、扫光和粒子位移。
- 当前每个星体安装 5 个 Xcode 可命名调用的 `.imageset`：backdrop、基础图、core、glow、particles；合约会校验每张 PNG 的存在、引用、1024x1024 尺寸和 alpha 通道，避免未来退回单张黑底贴片。
- 第二阶段如需更强动效，可升级为短序列 WebP/PNG、Lottie/Rive，或 Metal/SceneKit。

## iOS Asset 名称

| 主标签 | Asset catalog 名称 | 星体本体 |
| --- | --- | --- |
| 远潮观月者 | `BenyuanCelestialFarTideMoon` | 远潮、月面、暗海、银白潮汐 |
| 星图筑序者 | `BenyuanCelestialStarMapArchitect` | 星图、节点、几何秩序、微裂光 |
| 月港栖岸者 | `BenyuanCelestialMoonHarbor` | 月港、岸线、栖居灯、静水 |
| 存在游牧者 | `BenyuanCelestialExistentialNomad` | 漂移地平线、深空旅路、孤光 |
| 雨窗抒写者 | `BenyuanCelestialRainWindowScribe` | 雨窗、玻璃、水痕、低光文字感 |
| 事件视界沉潜者 | `BenyuanCelestialEventHorizonDiver` | 黑洞、事件视界、吸积盘、引力透镜 |
| 星云织梦者 | `BenyuanCelestialNebulaWeaver` | 星云、丝线、雾状纤维、梦感云团 |
| 日冕引燃者 | `BenyuanCelestialSolarCorona` | 日冕、燃烧边界、暗金喷发 |
| 类地栖居者 | `BenyuanCelestialTerrestrialPlanet` | 类地行星、薄大气、陆地纹理、栖居光点 |
| 深空锚定者 | `BenyuanCelestialDeepSpaceAnchor` | 深空坐标、锚点、冷白星核、稳定网格 |

## Image2 生成提示词模板

通用约束：

```text
Use case: stylized-concept
Asset type: iOS native celestial archetype asset, 1024x1024 PNG
Background: opaque pure deep black space, no transparency grid, no checkerboard pattern
Style/medium: premium cinematic raster concept art, realistic deep-space material, not vector, not flat icon
Composition/framing: centered celestial body with clean negative space around it, suitable for overlay in SwiftUI
Lighting/mood: deep black field, restrained silver white, muted aubergine, small dark gold highlights
Color palette: 本源深月场，深黑/墨紫/银白/少量暗金，避免蓝紫霓虹和过度彩色
Constraints: no text, no logo, no watermark, no UI frame, no card, no zodiac symbols, no cartoon, no checkerboard
Avoid: generic glowing orb with simple rings; each archetype must have a distinct astronomical body identity
```

分型增补：

- `BenyuanCelestialFarTideMoon`: moon over far tide, dark sea gravity, lunar mist, quiet reflective tide arcs.
- `BenyuanCelestialStarMapArchitect`: geometric star map lattice, precise nodes, orbital drafting marks, small fracture of gold light.
- `BenyuanCelestialMoonHarbor`: crescent moon harbor, black shoreline, quiet dock-like geometry, one sheltered warm light.
- `BenyuanCelestialExistentialNomad`: deep-space horizon road, wandering small star, drifting coordinate path, vast negative space.
- `BenyuanCelestialRainWindowScribe`: rain-streaked glass over moonlit darkness, soft writing-like light trails, window pane depth.
- `BenyuanCelestialEventHorizonDiver`: black hole with clear event horizon, closed accretion disk, gravitational lensing, dark core.
- `BenyuanCelestialNebulaWeaver`: open nebula cloud, woven luminous filaments, star dust threads, no solid planet core.
- `BenyuanCelestialSolarCorona`: dark sun core with visible corona, flame loops, restrained gold plasma, not orange cartoon fire.
- `BenyuanCelestialTerrestrialPlanet`: terrestrial exoplanet, thin atmosphere, subtle landmass texture, tiny habitat lights.
- `BenyuanCelestialDeepSpaceAnchor`: deep-space anchor point, cold star core, coordinate grid, stabilizing cross-lines and distant stars.

## 安装规则

每个星体的分层资产由 `scripts/benyuan-ios-celestial-layer-assets.mjs` 从 `output/celestial-source-backups/*.source.png` 生成。后续替换或重生成时保持：

- `BenyuanCelestialXBackdrop.imageset/celestial-backdrop.png`: 1024x1024 PNG，只保留星尘、辉光、纹理等透明信号补层；禁止保留完整 V5 暗底或第二个完整主体，避免形成一大一小的叠影。
- `BenyuanCelestialX.imageset/celestial.png`: 1024x1024 PNG，从参考图提取的透明星体/亮部主体层，用于前景呼吸和动态融合，不能保留整块近黑背景。
- `BenyuanCelestialXCore.imageset/celestial-core.png`: 1024x1024 PNG，透明边缘柔和羽化，但不要把黑洞核心、深空暗面、星体阴影扣掉；暗部仍属于星体本体。
- `BenyuanCelestialXGlow.imageset/celestial-glow.png`: 1024x1024 PNG，透明高光/辉光层，用于 SwiftUI 原生呼吸、缩放、混合模式或低频旋转。
- `BenyuanCelestialXParticles.imageset/celestial-particles.png`: 1024x1024 PNG，透明星尘/细碎高亮层，用于 SwiftUI 原生漂移、闪烁和景深。
- 每个 `Contents.json` 的 1x 必须引用对应 PNG，2x/3x 可留空或后续补充更高分辨率。
- 分层算法必须优先从 `.source.png` 生成，不能用低质纯 SwiftUI 重画替代参考美术，不能把一整块近黑背景作为动效层贴上去。
- 如果资源总量超过 15MB，再考虑压缩为 HEIF/WebP 或拆成按需下载。
