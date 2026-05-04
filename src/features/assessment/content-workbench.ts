import { assessmentQuestionSourceMeta } from "@/config/assessment/question-sources";
import { assessmentVersionManifests } from "@/config/assessment/version-manifests";
import {
  diffAssessmentDefinitionSnapshots,
  diffAssessmentFlowSnapshots,
  diffAssessmentNativeBlueprintSnapshots,
  getAssessmentDefinition,
  listAssessmentVersions,
  resolveAssessmentVersion,
} from "@/features/assessment/registry";
import type { AssessmentDefinitionDiff, AssessmentFlowDiff, AssessmentNativeBlueprintDiff, AssessmentVersionDescriptor, QuestionDef } from "@/features/assessment/types";
import type { Mode } from "@/lib/types";
import type { AnalysisAdminImpactMatrixItem } from "@/lib/analysis/workbench";

export type AssessmentManifestCatalogItem = {
  mode: Mode;
  version: string;
  title: string;
  description: string;
  storageKey: string;
  questionSetKey: string;
  isDefault: boolean;
  questionCount: number;
  moduleCount: number;
  openReflectionCount: number;
  questionIds: string[];
  phaseQuestionCounts: Array<{
    phaseId: string;
    label: string;
    questionCount: number;
  }>;
  sourceFile: string | null;
  sourceIntent: string | null;
};

export type AssessmentQuestionSourceCatalogItem = {
  key: string;
  title: string;
  sourceFile: string;
  intent: string;
  mode: Mode;
  version: string;
  linkedManifestVersions: string[];
  questionCount: number;
  firstQuestionId: string | null;
  lastQuestionId: string | null;
  optionalQuestionCount: number;
  moduleIds: string[];
  answerTypes: string[];
  presentationKinds: string[];
  openReflectionQuestionIds: string[];
};

export type AssessmentQuestionSourceDiff = {
  mode: Mode;
  baseVersion: string;
  targetVersion: string;
  addedQuestions: string[];
  removedQuestions: string[];
  addedModules: string[];
  removedModules: string[];
  addedAnswerTypes: string[];
  removedAnswerTypes: string[];
  addedPresentationKinds: string[];
  removedPresentationKinds: string[];
  changedQuestionPositions: Array<{
    questionId: string;
    from: number;
    to: number;
  }>;
  changedAnswerTypes: Array<{
    questionId: string;
    from: string;
    to: string;
  }>;
  changedPresentationKinds: Array<{
    questionId: string;
    from: string;
    to: string;
  }>;
};

export type AssessmentModeCatalogItem = {
  mode: Mode;
  defaultVersion: string | null;
  versionCount: number;
  questionCountRange: {
    min: number;
    max: number;
  };
  sourceFiles: string[];
  phaseIds: string[];
  moduleIds: string[];
};

export type AssessmentContentMigrationChecklistItem = {
  key: string;
  title: string;
  detail: string;
  ownerType: "content" | "frontend" | "native" | "analysis";
  riskLevel: "low" | "medium" | "high";
  verificationStep: string;
};


export type AssessmentContentDraftPatchLine = {
  key: string;
  targetFile: string;
  changeType: "insert" | "update" | "review";
  label: string;
  detail: string;
};

export type AssessmentContentDraftValidation = {
  key: string;
  severity: "notice" | "warning" | "blocking";
  ownerType: "content" | "frontend" | "native" | "analysis";
  detail: string;
};

export type AssessmentContentDraftValidationSummary = {
  blocking: number;
  warning: number;
  notice: number;
};

export type AssessmentContentDraftPatchDocument = {
  kind: "assessment_content_patch";
  mode: Mode;
  baseVersion: string;
  targetVersion: string;
  sourceKey: string;
  targetFiles: string[];
  operations: Array<{
    file: string;
    action: "insert" | "update" | "review";
    label: string;
    detail: string;
  }>;
  verification: Array<{
    severity: "notice" | "warning" | "blocking";
    ownerType: "content" | "frontend" | "native" | "analysis";
    detail: string;
  }>;
};

export type AssessmentContentDraftBlueprint = {
  key: string;
  draftId: string;
  mode: Mode;
  baseVersion: string;
  targetVersion: string;
  title: string;
  summary: string;
  questionDelta: number;
  linkedQuestionSource: string;
  targetFiles: string[];
  patchLines: AssessmentContentDraftPatchLine[];
  validations: AssessmentContentDraftValidation[];
  validationSummary: AssessmentContentDraftValidationSummary;
  patchDocument: AssessmentContentDraftPatchDocument;
  linkedRoutes: string[];
};

export type AssessmentContentWorkbench = {
  manifests: AssessmentManifestCatalogItem[];
  questionSources: AssessmentQuestionSourceCatalogItem[];
  draftBlueprints: AssessmentContentDraftBlueprint[];
  manifestDiffs: Array<
    AssessmentDefinitionDiff & {
      baseQuestionSetKey: string;
      targetQuestionSetKey: string;
      questionSetChanged: boolean;
      baseSourceFile: string | null;
      targetSourceFile: string | null;
      sourceFileChanged: boolean;
    }
  >;
  questionSourceDiffs: AssessmentQuestionSourceDiff[];
  defaultVersionMap: Array<{
    mode: Mode;
    versions: AssessmentVersionDescriptor[];
    defaultVersion: string | null;
  }>;
  modeMatrix: AssessmentModeCatalogItem[];
};

export type AssessmentSchemaMigrationLedgerItem = {
  draftKey: string;
  draftId: string;
  title: string;
  mode: Mode;
  baseVersion: string;
  targetVersion: string;
  questionDelta: number;
  linkedRoutes: string[];
  targetFiles: string[];
  validationSummary: AssessmentContentDraftValidationSummary;
  manifestDiff: AssessmentDefinitionDiff;
  sourceDiff: AssessmentQuestionSourceDiff;
  flowDiff: AssessmentFlowDiff;
  nativeDiff: AssessmentNativeBlueprintDiff;
  linkedAnalysisDrafts: Array<{
    draftId: string;
    title: string;
    surfaceKey: string;
    riskLevel: "notice" | "warning" | "blocking";
    verificationRoutes: string[];
    why: string;
  }>;
  migrationCounts: {
    questionMoves: number;
    phaseMoves: number;
    answerTypeChanges: number;
    presentationChanges: number;
    nativeContractChanges: number;
  };
};

function diffStringLists(base: string[], target: string[]) {
  return {
    added: target.filter((item) => !base.includes(item)),
    removed: base.filter((item) => !target.includes(item)),
  };
}

function deriveModeFromKey(key: string): Mode {
  return key.startsWith("deep") ? "deep" : "lite";
}

function getQuestionPresentationKind(question: QuestionDef) {
  return question.presentation?.kind ?? "text_options";
}

function getQuestionIndexes(questions: QuestionDef[]) {
  return Object.fromEntries(questions.map((question, index) => [question.questionId, index + 1]));
}

function getQuestionMap(questions: QuestionDef[]) {
  return new Map(questions.map((question) => [question.questionId, question]));
}

export function listAssessmentManifestCatalog(): AssessmentManifestCatalogItem[] {
  return assessmentVersionManifests.map((manifest) => {
    const definition = getAssessmentDefinition(manifest.mode, manifest.version);
    const sourceMeta = assessmentQuestionSourceMeta.find((source) => source.key === manifest.questionSetKey);

    return {
      ...manifest,
      isDefault: Boolean(manifest.isDefault),
      questionCount: definition.questions.length,
      moduleCount: [...new Set(definition.questions.map((question) => question.moduleId))].length,
      openReflectionCount: definition.validation.openReflectionQuestionIds.length,
      questionIds: definition.questions.map((question) => question.questionId),
      phaseQuestionCounts: definition.phases.map((phase) => ({
        phaseId: phase.id,
        label: phase.label,
        questionCount: definition.questions.filter((question) => phase.moduleIds.includes(question.moduleId)).length,
      })),
      sourceFile: sourceMeta?.sourceFile ?? null,
      sourceIntent: sourceMeta?.intent ?? null,
    };
  });
}

export function listAssessmentQuestionSourceCatalog(): AssessmentQuestionSourceCatalogItem[] {
  return assessmentQuestionSourceMeta.map((source) => {
    const mode = deriveModeFromKey(source.key);
    const definition = getAssessmentDefinition(mode, source.key);

    return {
      ...source,
      mode,
      version: source.key,
      linkedManifestVersions: assessmentVersionManifests
        .filter((manifest) => manifest.questionSetKey === source.key)
        .map((manifest) => manifest.version),
      questionCount: definition.questions.length,
      firstQuestionId: definition.questions[0]?.questionId ?? null,
      lastQuestionId: definition.questions[definition.questions.length - 1]?.questionId ?? null,
      optionalQuestionCount: definition.questions.filter((question) => question.optional).length,
      moduleIds: [...new Set(definition.questions.map((question) => question.moduleId))],
      answerTypes: [...new Set(definition.questions.map((question) => question.answerType))],
      presentationKinds: [...new Set(definition.questions.map(getQuestionPresentationKind))],
      openReflectionQuestionIds: definition.validation.openReflectionQuestionIds,
    };
  });
}

export function diffAssessmentQuestionSources(mode: Mode, targetVersion: string, baseVersion?: string | null): AssessmentQuestionSourceDiff {
  const resolvedBaseVersion = resolveAssessmentVersion(mode, baseVersion);
  const resolvedTargetVersion = resolveAssessmentVersion(mode, targetVersion);
  const baseDefinition = getAssessmentDefinition(mode, resolvedBaseVersion);
  const targetDefinition = getAssessmentDefinition(mode, resolvedTargetVersion);
  const questionDiff = diffStringLists(
    baseDefinition.questions.map((question) => question.questionId),
    targetDefinition.questions.map((question) => question.questionId),
  );
  const moduleDiff = diffStringLists(
    [...new Set(baseDefinition.questions.map((question) => question.moduleId))],
    [...new Set(targetDefinition.questions.map((question) => question.moduleId))],
  );
  const answerTypeDiff = diffStringLists(
    [...new Set(baseDefinition.questions.map((question) => question.answerType))],
    [...new Set(targetDefinition.questions.map((question) => question.answerType))],
  );
  const presentationKindDiff = diffStringLists(
    [...new Set(baseDefinition.questions.map(getQuestionPresentationKind))],
    [...new Set(targetDefinition.questions.map(getQuestionPresentationKind))],
  );

  const baseIndexes = getQuestionIndexes(baseDefinition.questions);
  const targetIndexes = getQuestionIndexes(targetDefinition.questions);
  const baseMap = getQuestionMap(baseDefinition.questions);
  const targetMap = getQuestionMap(targetDefinition.questions);
  const sharedQuestionIds = targetDefinition.questions
    .map((question) => question.questionId)
    .filter((questionId) => baseMap.has(questionId));

  return {
    mode,
    baseVersion: baseDefinition.version,
    targetVersion: targetDefinition.version,
    addedQuestions: questionDiff.added,
    removedQuestions: questionDiff.removed,
    addedModules: moduleDiff.added,
    removedModules: moduleDiff.removed,
    addedAnswerTypes: answerTypeDiff.added,
    removedAnswerTypes: answerTypeDiff.removed,
    addedPresentationKinds: presentationKindDiff.added,
    removedPresentationKinds: presentationKindDiff.removed,
    changedQuestionPositions: sharedQuestionIds.flatMap((questionId) => {
      const from = baseIndexes[questionId];
      const to = targetIndexes[questionId];
      if (!from || !to || from === to) return [];
      return [{ questionId, from, to }];
    }),
    changedAnswerTypes: sharedQuestionIds.flatMap((questionId) => {
      const baseQuestion = baseMap.get(questionId);
      const targetQuestion = targetMap.get(questionId);
      if (!baseQuestion || !targetQuestion || baseQuestion.answerType === targetQuestion.answerType) return [];
      return [{ questionId, from: baseQuestion.answerType, to: targetQuestion.answerType }];
    }),
    changedPresentationKinds: sharedQuestionIds.flatMap((questionId) => {
      const baseQuestion = baseMap.get(questionId);
      const targetQuestion = targetMap.get(questionId);
      const baseKind = baseQuestion ? getQuestionPresentationKind(baseQuestion) : null;
      const targetKind = targetQuestion ? getQuestionPresentationKind(targetQuestion) : null;
      if (!baseKind || !targetKind || baseKind === targetKind) return [];
      return [{ questionId, from: baseKind, to: targetKind }];
    }),
  };
}

export function buildAssessmentManifestDiffs() {
  const manifestCatalog = listAssessmentManifestCatalog();
  const sourceCatalog = listAssessmentQuestionSourceCatalog();

  return (["lite", "deep"] as const).flatMap((mode) => {
    const versions = listAssessmentVersions(mode);
    const defaultVersion = versions.find((version) => version.isDefault)?.version ?? versions[0]?.version;
    if (!defaultVersion) return [];

    const baseManifest = manifestCatalog.find((manifest) => manifest.mode === mode && manifest.version === defaultVersion);
    const baseSource = sourceCatalog.find((source) => source.version === baseManifest?.questionSetKey);

    return versions
      .filter((version) => version.version !== defaultVersion)
      .map((version) => {
        const targetManifest = manifestCatalog.find((manifest) => manifest.mode === mode && manifest.version === version.version);
        const targetSource = sourceCatalog.find((source) => source.version === targetManifest?.questionSetKey);
        const diff = diffAssessmentDefinitionSnapshots(mode, version.version, defaultVersion);

        return {
          ...diff,
          baseQuestionSetKey: baseManifest?.questionSetKey ?? defaultVersion,
          targetQuestionSetKey: targetManifest?.questionSetKey ?? version.version,
          questionSetChanged: baseManifest?.questionSetKey !== targetManifest?.questionSetKey,
          baseSourceFile: baseSource?.sourceFile ?? null,
          targetSourceFile: targetSource?.sourceFile ?? null,
          sourceFileChanged: baseSource?.sourceFile !== targetSource?.sourceFile,
        };
      });
  });
}

export function buildAssessmentQuestionSourceDiffs() {
  return (["lite", "deep"] as const).flatMap((mode) => {
    const versions = listAssessmentVersions(mode);
    const defaultVersion = versions.find((version) => version.isDefault)?.version ?? versions[0]?.version;
    if (!defaultVersion) return [];

    return versions
      .filter((version) => version.version !== defaultVersion)
      .map((version) => diffAssessmentQuestionSources(mode, version.version, defaultVersion));
  });
}

export function buildAssessmentContentMigrationChecklist(
  manifestDiff: AssessmentDefinitionDiff | null,
  sourceDiff: AssessmentQuestionSourceDiff | null,
): AssessmentContentMigrationChecklistItem[] {
  if (!manifestDiff && !sourceDiff) return [];

  const checklist: AssessmentContentMigrationChecklistItem[] = [];

  if (manifestDiff?.storageKeyChanged) {
    checklist.push({
      key: "storage-key",
      title: "更新草稿存储键",
      detail: "版本切换涉及 storageKey 变化，前端草稿恢复与历史缓存映射需要一起校准。",
      ownerType: "frontend",
      riskLevel: "medium",
      verificationStep: "切换到新版本后，检查本地草稿是否写入新 key，旧 key 不再被误读。",
    });
  }

  if ((manifestDiff?.addedPhases.length ?? 0) > 0 || (manifestDiff?.changedPhaseQuestionCounts.length ?? 0) > 0) {
    checklist.push({
      key: "phase-flow",
      title: "复核 phase 与 step 编排",
      detail: "phase 数量或每段 question count 发生变化，单题推进的 step 文案、review 回跳和 phase 指示器都要同步。",
      ownerType: "frontend",
      riskLevel: "high",
      verificationStep: "从 entry 到 review 走完整流程，确认 phase 标签、总步数和回跳位置都正确。",
    });
  }

  if ((manifestDiff?.addedModules.length ?? 0) > 0 || (manifestDiff?.removedModules.length ?? 0) > 0) {
    checklist.push({
      key: "module-mapping",
      title: "检查模块映射",
      detail: "题库模块有增减，analysis feature mapping、module label 和后续报告维度映射要保持一致。",
      ownerType: "analysis",
      riskLevel: "high",
      verificationStep: "提交一份包含新模块问题答案的样本，确认 feature vector 与 report 中存在对应维度。",
    });
  }

  if ((sourceDiff?.changedQuestionPositions.length ?? 0) > 0) {
    checklist.push({
      key: "question-order",
      title: "复核题序迁移",
      detail: "共享题目发生位移，既有 session 的 review 定位、缺失题跳转和埋点顺序需要再次检查。",
      ownerType: "frontend",
      riskLevel: "medium",
      verificationStep: "故意留空一题进入 review，确认跳回的是新顺序中的正确题目。",
    });
  }

  if ((sourceDiff?.addedAnswerTypes.length ?? 0) > 0 || (sourceDiff?.removedAnswerTypes.length ?? 0) > 0) {
    checklist.push({
      key: "answer-type",
      title: "检查输入控件兼容性",
      detail: "answer type 变化意味着 Web / iOS / RN 控件契约可能不再一致，需要同步 native hint 与 schema 校验。",
      ownerType: "native",
      riskLevel: "high",
      verificationStep: "分别查看 /lab/schema 和 /lab/native-handoff，确认新的 answer type 已有控件承接。",
    });
  }

  if ((sourceDiff?.addedPresentationKinds.length ?? 0) > 0 || (sourceDiff?.changedPresentationKinds.length ?? 0) > 0) {
    checklist.push({
      key: "presentation-kind",
      title: "核对题目呈现层",
      detail: "presentation kind 变化会影响卡片布局、媒体资源位和无障碍朗读文案。",
      ownerType: "content",
      riskLevel: "medium",
      verificationStep: "在 /test 中走到相关题目，确认布局、helper text 与媒体位正常渲染。",
    });
  }

  if (checklist.length === 0) {
    checklist.push({
      key: "no-op",
      title: "当前差异偏轻",
      detail: "这次变动还没有触发高风险结构迁移，主要是内容层与文案层微调。",
      ownerType: "content",
      riskLevel: "low",
      verificationStep: "执行一次完整提交流程并查看报告页是否可达。",
    });
  }

  return checklist;
}

export function buildAssessmentDefaultVersionMap() {
  return (["lite", "deep"] as Mode[]).map((mode) => {
    const versions = listAssessmentVersions(mode);
    return {
      mode,
      versions,
      defaultVersion: versions.find((version) => version.isDefault)?.version ?? versions[0]?.version ?? null,
    };
  });
}

function buildContentDraftId(mode: Mode, baseVersion: string, targetVersion: string) {
  return `draft.content.${mode}.${baseVersion}.${targetVersion}`;
}

function buildValidationSummary(validations: AssessmentContentDraftValidation[]): AssessmentContentDraftValidationSummary {
  return validations.reduce(
    (summary, item) => {
      summary[item.severity] += 1;
      return summary;
    },
    { blocking: 0, warning: 0, notice: 0 } satisfies AssessmentContentDraftValidationSummary,
  );
}

function buildPatchDocument(
  mode: Mode,
  baseVersion: string,
  targetVersion: string,
  sourceKey: string,
  patchLines: AssessmentContentDraftPatchLine[],
  validations: AssessmentContentDraftValidation[],
): AssessmentContentDraftPatchDocument {
  return {
    kind: "assessment_content_patch",
    mode,
    baseVersion,
    targetVersion,
    sourceKey,
    targetFiles: [...new Set(patchLines.map((item) => item.targetFile))],
    operations: patchLines.map((item) => ({
      file: item.targetFile,
      action: item.changeType,
      label: item.label,
      detail: item.detail,
    })),
    verification: validations.map((item) => ({
      severity: item.severity,
      ownerType: item.ownerType,
      detail: item.detail,
    })),
  };
}

function toValidationSeverity(riskLevel: AssessmentContentMigrationChecklistItem["riskLevel"]): AssessmentContentDraftValidation["severity"] {
  if (riskLevel === "high") return "blocking";
  if (riskLevel === "medium") return "warning";
  return "notice";
}

export function buildAssessmentContentDraftBlueprints(): AssessmentContentDraftBlueprint[] {
  const manifests = listAssessmentManifestCatalog();
  const sourceCatalog = listAssessmentQuestionSourceCatalog();

  return (["lite", "deep"] as const).flatMap((mode) => {
    const versions = listAssessmentVersions(mode);
    const defaultVersion = versions.find((version) => version.isDefault)?.version ?? versions[0]?.version;
    if (!defaultVersion) return [];

    return versions
      .filter((version) => version.version !== defaultVersion)
      .map((version) => {
        const manifestDiff = diffAssessmentDefinitionSnapshots(mode, version.version, defaultVersion);
        const sourceDiff = diffAssessmentQuestionSources(mode, version.version, defaultVersion);
        const targetManifest = manifests.find((manifest) => manifest.mode === mode && manifest.version === version.version);
        const targetSource = sourceCatalog.find((source) => source.version === version.version || source.key === targetManifest?.questionSetKey);
        const migrationChecklist = buildAssessmentContentMigrationChecklist(manifestDiff, sourceDiff);
        const patchLines: AssessmentContentDraftPatchLine[] = [
          {
            key: `${mode}-${version.version}-manifest`,
            targetFile: "src/config/assessment/version-manifests.ts",
            changeType: "update",
            label: "同步 manifest 元数据",
            detail: `确认 ${version.version} 的 phases、storageKey 与 questionSetKey 描述已匹配目标草案。`,
          },
          {
            key: `${mode}-${version.version}-source`,
            targetFile: targetSource?.sourceFile ?? "src/config/assessment/question-sources.ts",
            changeType: manifestDiff.addedQuestions.length > 0 ? "insert" : "review",
            label: "同步题库内容文件",
            detail: `核对题目增减、模块归属和 presentation 配置，确保 ${targetManifest?.questionSetKey ?? version.version} 可独立回放。`,
          },
        ];

        if (manifestDiff.addedModules.length > 0 || manifestDiff.removedModules.length > 0) {
          patchLines.push({
            key: `${mode}-${version.version}-mapping`,
            targetFile: "src/features/assessment/analysis-mapping.ts",
            changeType: "review",
            label: "校对分析映射",
            detail: `模块变化涉及 feature mapping，需要让 analysis 层接住 ${[...manifestDiff.addedModules, ...manifestDiff.removedModules].join(" / ")}.`,
          });
        }

        if (sourceDiff.addedAnswerTypes.length > 0 || sourceDiff.changedPresentationKinds.length > 0) {
          patchLines.push({
            key: `${mode}-${version.version}-contract`,
            targetFile: "src/lib/assessment-schema.ts",
            changeType: "review",
            label: "校对客户端契约",
            detail: "新增 answerType 或 presentation kind 时，schema、native hint 与表单渲染要一起过一遍。",
          });
        }

        const validations = migrationChecklist.map((item) => ({
          key: item.key,
          severity: toValidationSeverity(item.riskLevel),
          ownerType: item.ownerType,
          detail: item.verificationStep,
        }));
        const targetFiles = [...new Set(patchLines.map((item) => item.targetFile))];

        return {
          key: `${mode}:${defaultVersion}->${version.version}`,
          draftId: buildContentDraftId(mode, defaultVersion, version.version),
          mode,
          baseVersion: defaultVersion,
          targetVersion: version.version,
          title: `${defaultVersion} → ${version.version}`,
          summary: targetManifest?.description ?? "新的题库结构草案。",
          questionDelta: manifestDiff.questionCountDelta,
          linkedQuestionSource: targetManifest?.questionSetKey ?? version.version,
          targetFiles,
          patchLines,
          validations,
          validationSummary: buildValidationSummary(validations),
          patchDocument: buildPatchDocument(
            mode,
            defaultVersion,
            version.version,
            targetManifest?.questionSetKey ?? version.version,
            patchLines,
            validations,
          ),
          linkedRoutes: ["/lab/content", "/lab/schema", "/lab/native-handoff", "/lab/kernel-admin"],
        };
      });
  });
}

export function getAssessmentContentDraftBlueprint(mode: Mode, targetVersion: string, baseVersion?: string | null) {
  const resolvedBaseVersion = resolveAssessmentVersion(mode, baseVersion);
  return buildAssessmentContentDraftBlueprints().find(
    (item) => item.mode === mode && item.baseVersion === resolvedBaseVersion && item.targetVersion === targetVersion,
  ) ?? null;
}

export function buildAssessmentSchemaMigrationLedger(
  contentDrafts: AssessmentContentDraftBlueprint[] = buildAssessmentContentDraftBlueprints(),
  analysisImpactMatrix: AnalysisAdminImpactMatrixItem[] = [],
): AssessmentSchemaMigrationLedgerItem[] {
  return contentDrafts.map((draft) => {
    const manifestDiff = diffAssessmentDefinitionSnapshots(draft.mode, draft.targetVersion, draft.baseVersion);
    const sourceDiff = diffAssessmentQuestionSources(draft.mode, draft.targetVersion, draft.baseVersion);
    const flowDiff = diffAssessmentFlowSnapshots(draft.mode, draft.targetVersion, draft.baseVersion);
    const nativeDiff = diffAssessmentNativeBlueprintSnapshots(draft.mode, draft.targetVersion, draft.baseVersion);
    const linkedAnalysisDrafts = analysisImpactMatrix
      .filter((item) => item.linkedContentDraftKeys.includes(draft.key))
      .map((item) => ({
        draftId: item.draftId,
        title: item.title,
        surfaceKey: item.surfaceKey,
        riskLevel: item.riskLevel,
        verificationRoutes: item.verificationRoutes,
        why: item.why,
      }));

    return {
      draftKey: draft.key,
      draftId: draft.draftId,
      title: draft.title,
      mode: draft.mode,
      baseVersion: draft.baseVersion,
      targetVersion: draft.targetVersion,
      questionDelta: draft.questionDelta,
      linkedRoutes: draft.linkedRoutes,
      targetFiles: draft.targetFiles,
      validationSummary: draft.validationSummary,
      manifestDiff,
      sourceDiff,
      flowDiff,
      nativeDiff,
      linkedAnalysisDrafts,
      migrationCounts: {
        questionMoves: sourceDiff.changedQuestionPositions.length + flowDiff.changedStepQuestionIds.length,
        phaseMoves: manifestDiff.changedPhaseQuestionCounts.length + flowDiff.changedStepPhaseIds.length,
        answerTypeChanges: sourceDiff.changedAnswerTypes.length,
        presentationChanges: sourceDiff.changedPresentationKinds.length,
        nativeContractChanges: nativeDiff.changedBlueprintContracts.length + nativeDiff.changedSequenceSteps.length,
      },
    } satisfies AssessmentSchemaMigrationLedgerItem;
  });
}

export function buildAssessmentModeMatrix(): AssessmentModeCatalogItem[] {
  const manifests = listAssessmentManifestCatalog();
  const questionSources = listAssessmentQuestionSourceCatalog();

  return (["lite", "deep"] as Mode[]).map((mode) => {
    const modeManifests = manifests.filter((manifest) => manifest.mode === mode);
    const questionCounts = modeManifests.map((manifest) => manifest.questionCount);

    return {
      mode,
      defaultVersion: modeManifests.find((manifest) => manifest.isDefault)?.version ?? modeManifests[0]?.version ?? null,
      versionCount: modeManifests.length,
      questionCountRange: {
        min: questionCounts.length > 0 ? Math.min(...questionCounts) : 0,
        max: questionCounts.length > 0 ? Math.max(...questionCounts) : 0,
      },
      sourceFiles: [...new Set(questionSources.filter((source) => source.mode === mode).map((source) => source.sourceFile))],
      phaseIds: [...new Set(modeManifests.flatMap((manifest) => manifest.phaseQuestionCounts.map((phase) => phase.phaseId)))],
      moduleIds: [...new Set(questionSources.filter((source) => source.mode === mode).flatMap((source) => source.moduleIds))],
    };
  });
}

export function buildAssessmentContentWorkbench(): AssessmentContentWorkbench {
  return {
    manifests: listAssessmentManifestCatalog(),
    questionSources: listAssessmentQuestionSourceCatalog(),
    draftBlueprints: buildAssessmentContentDraftBlueprints(),
    manifestDiffs: buildAssessmentManifestDiffs(),
    questionSourceDiffs: buildAssessmentQuestionSourceDiffs(),
    defaultVersionMap: buildAssessmentDefaultVersionMap(),
    modeMatrix: buildAssessmentModeMatrix(),
  };
}
