import { analysisRuntimePreviewPresetConfig, type AnalysisRuntimePreviewPresetConfig } from "@/config/analysis/runtime-preview-presets";
import type { AssessmentContentDraftBlueprint } from "@/features/assessment";
import { getAnalysisRuntimeStatus } from "@/lib/analysis/registry";
import { listAnalysisPromptTemplates, resolveAnalysisPromptTemplate, type AnalysisPromptTemplateKey } from "@/lib/analysis/prompt-templates";
import { listAnalysisReportSchemas, resolveAnalysisReportSchema, type AnalysisReportSchemaKey } from "@/lib/analysis/report-schemas";
import type { Mode } from "@/lib/types";

export type AnalysisRuntimePreviewScenario = AnalysisRuntimePreviewPresetConfig;

export function buildAnalysisRuntimePreviewScenarios(): AnalysisRuntimePreviewScenario[] {
  return analysisRuntimePreviewPresetConfig;
}

export function buildAnalysisRuntimePreviewMatrix() {
  return buildAnalysisRuntimePreviewScenarios().map((scenario) => ({
    ...scenario,
    runtime: getAnalysisRuntimeStatus(scenario.mode, scenario.options),
  }));
}

export function diffAnalysisPromptTemplates(baseKey: AnalysisPromptTemplateKey, targetKey: AnalysisPromptTemplateKey, mode: Mode) {
  const base = resolveAnalysisPromptTemplate(baseKey, mode);
  const target = resolveAnalysisPromptTemplate(targetKey, mode);

  return {
    baseKey,
    targetKey,
    mode,
    systemChanged: base.system !== target.system,
    addedGuidance: target.guidance.filter((item) => !base.guidance.includes(item)),
    removedGuidance: base.guidance.filter((item) => !target.guidance.includes(item)),
    addedEmphasis: target.emphasis.filter((item) => !base.emphasis.includes(item)),
    removedEmphasis: base.emphasis.filter((item) => !target.emphasis.includes(item)),
  };
}

export function diffAnalysisReportSchemas(baseKey: AnalysisReportSchemaKey, targetKey: AnalysisReportSchemaKey, mode: Mode) {
  const base = resolveAnalysisReportSchema(baseKey, mode);
  const target = resolveAnalysisReportSchema(targetKey, mode);

  return {
    baseKey,
    targetKey,
    mode,
    recommendationLimitDelta: target.recommendationLimit - base.recommendationLimit,
    dimensionOrderChanged: base.dimensionOrder.join("|") !== target.dimensionOrder.join("|"),
    baseDimensionOrder: base.dimensionOrder,
    targetDimensionOrder: target.dimensionOrder,
    noteChanged: base.note !== target.note,
  };
}

export type AnalysisAdminDraftSurface = {
  key: string;
  title: string;
  targetFile: string;
  modes: Mode[];
  editableFields: string[];
  patchPreview: string[];
  validationChecks: string[];
  linkedRoutes: string[];
};

export type AnalysisAdminImpactRoute = {
  route: string;
  title: string;
  reason: string;
};

export type AnalysisAdminImpactMatrixItem = {
  surfaceKey: string;
  draftId: string;
  title: string;
  affectedPresetKeys: string[];
  defaultModes: Mode[];
  linkedContentDraftKeys: string[];
  verificationRoutes: string[];
  riskLevel: "notice" | "warning" | "blocking";
  why: string;
};

export function buildAnalysisAdminDraftSurfaces(): AnalysisAdminDraftSurface[] {
  return [
    {
      key: "prompt_templates",
      title: "Prompt template draft",
      targetFile: "src/config/analysis/prompt-templates.ts",
      modes: ["lite", "deep"],
      editableFields: ["system", "guidance", "emphasis"],
      patchPreview: [
        "新增或替换 guidance 条目时，同步检查安全边界文案。",
        "切换模板支持范围前，确认 runtime 默认组合仍能 resolve。",
      ],
      validationChecks: [
        "在 /lab/kernel 选择对应 prompt template，确认 runtime status 可解析。",
        "跑 golden 对比，确认 narrative 风格变化在可接受范围。",
      ],
      linkedRoutes: ["/lab/kernel", "/lab/golden", "/lab/kernel-admin"],
    },
    {
      key: "report_schemas",
      title: "Report schema draft",
      targetFile: "src/config/analysis/report-schemas.ts",
      modes: ["lite", "deep"],
      editableFields: ["recommendationLimit", "dimensionOrder", "note"],
      patchPreview: [
        "调整 dimension order 后，同步核对 report-builder 输出段落顺序。",
        "提高 recommendation limit 时，确认导出卡片与长图布局仍稳定。",
      ],
      validationChecks: [
        "在 /report/[sessionId] 检查章节顺序和推荐块数量。",
        "在 /lab/kernel 对比 schema diff，确认 fallback 路径仍可用。",
      ],
      linkedRoutes: ["/lab/kernel", "/lab/content", "/lab/golden"],
    },
    {
      key: "runtime_preview_presets",
      title: "Runtime preset draft",
      targetFile: "src/config/analysis/runtime-preview-presets.ts",
      modes: ["lite", "deep"],
      editableFields: ["engine", "provider", "promptTemplate", "reportSchema", "intent"],
      patchPreview: [
        "新增 preset 时，给 workbench 评审链路留清晰命名和意图。",
        "涉及 hybrid provider 的 preset 要确认 provider available/fallback 行为。",
      ],
      validationChecks: [
        "在 /lab/kernel 中点选 preset 组合，确认 engine/provider/status 一致。",
        "查看 /api/internal/kernel-admin 响应，确认 preset 已进入后台摘要。",
      ],
      linkedRoutes: ["/lab/kernel", "/lab/runtime", "/lab/kernel-admin"],
    },
  ];
}

export function buildAnalysisAdminImpactRoutes(): AnalysisAdminImpactRoute[] {
  return [
    {
      route: "/lab/kernel",
      title: "内核工作台",
      reason: "prompt/schema/preset 变化都会直接影响 runtime resolve 和 diff 视图。",
    },
    {
      route: "/lab/golden",
      title: "golden 回归",
      reason: "analysis 输出风格或结构变化时，需要基线回归保护。",
    },
    {
      route: "/lab/content",
      title: "内容预览台",
      reason: "题库模块变化会牵动 report schema 与 prompt 侧的解释重心。",
    },
  ];
}

function buildAnalysisDraftId(surfaceKey: string) {
  return `draft.analysis.${surfaceKey}`;
}

function resolveSurfaceRisk(surfaceKey: AnalysisAdminDraftSurface["key"], linkedContentDraftCount: number): AnalysisAdminImpactMatrixItem["riskLevel"] {
  if (surfaceKey === "runtime_preview_presets") return "warning";
  if (linkedContentDraftCount > 0) return "blocking";
  return "warning";
}

export function buildAnalysisAdminImpactMatrix(contentDrafts: AssessmentContentDraftBlueprint[] = []): AnalysisAdminImpactMatrixItem[] {
  const previewMatrix = buildAnalysisRuntimePreviewMatrix();
  const defaults = {
    lite: getAnalysisRuntimeStatus("lite"),
    deep: getAnalysisRuntimeStatus("deep"),
  };

  return buildAnalysisAdminDraftSurfaces().map((surface) => {
    const affectedPresetKeys = previewMatrix
      .filter((scenario) => {
        if (surface.key === "prompt_templates") {
          return scenario.runtime.selectedPromptTemplateKey !== "core" || scenario.mode === "deep";
        }

        if (surface.key === "report_schemas") {
          return scenario.runtime.selectedReportSchemaKey !== "standard" || scenario.mode === "deep";
        }

        return true;
      })
      .map((scenario) => scenario.key);

    const defaultModes = (Object.entries(defaults) as Array<[Mode, typeof defaults.lite]>).flatMap(([mode, runtime]) => {
      if (surface.key === "prompt_templates") {
        return runtime.selectedPromptTemplateKey ? [mode] : [];
      }
      if (surface.key === "report_schemas") {
        return runtime.selectedReportSchemaKey ? [mode] : [];
      }
      return [mode];
    });

    const linkedContentDraftKeys = contentDrafts
      .filter((draft) => {
        if (surface.key === "prompt_templates") {
          return draft.patchLines.some((line) => line.targetFile.includes("analysis-mapping")) || draft.validations.some((item) => item.ownerType === "analysis");
        }
        if (surface.key === "report_schemas") {
          return draft.questionDelta !== 0 || draft.validations.some((item) => item.ownerType === "analysis");
        }
        return draft.patchLines.some((line) => line.targetFile.includes("assessment-schema")) || draft.validations.some((item) => item.ownerType === "native");
      })
      .map((draft) => draft.key);

    const verificationRoutes = [...new Set([...surface.linkedRoutes, ...contentDrafts.flatMap((draft) => draft.linkedRoutes)])];

    return {
      surfaceKey: surface.key,
      draftId: buildAnalysisDraftId(surface.key),
      title: surface.title,
      affectedPresetKeys,
      defaultModes,
      linkedContentDraftKeys,
      verificationRoutes,
      riskLevel: resolveSurfaceRisk(surface.key, linkedContentDraftKeys.length),
      why:
        surface.key === "prompt_templates"
          ? "语气与 guidance 变化会先影响 narrative 风格，再影响 golden 基线与深度报告的一致性。"
          : surface.key === "report_schemas"
            ? "报告结构变化会直接影响 report builder、导出布局，以及内容模块的解释优先级。"
            : "preset 变化决定 workbench 里怎样复现不同运行路径，是评审和回归的入口层。",
    };
  });
}

export function buildAnalysisWorkbenchCatalog(contentDrafts: AssessmentContentDraftBlueprint[] = []) {
  return {
    promptTemplates: listAnalysisPromptTemplates(),
    reportSchemas: listAnalysisReportSchemas(),
    previewMatrix: buildAnalysisRuntimePreviewMatrix(),
    promptTemplateDiffs: [diffAnalysisPromptTemplates("core", "depth", "deep")],
    reportSchemaDiffs: [diffAnalysisReportSchemas("standard", "deep_focus", "deep")],
    adminDraftSurfaces: buildAnalysisAdminDraftSurfaces(),
    impactRoutes: buildAnalysisAdminImpactRoutes(),
    impactMatrix: buildAnalysisAdminImpactMatrix(contentDrafts),
  };
}
