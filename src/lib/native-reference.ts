import type { AssessmentNativeBlueprintDiff } from "@/features/assessment/types";
import type { AssessmentSchemaNativeBlueprintContract, AssessmentSchemaNativeMap } from "@/lib/assessment-schema";

type NativeReferenceFileCategory =
  | "app-shell"
  | "provider"
  | "contract"
  | "navigation"
  | "screen"
  | "component"
  | "hook"
  | "theme"
  | "type";

type NativeReferenceFile = {
  path: string;
  language: "tsx" | "ts";
  category: NativeReferenceFileCategory;
  title: string;
  description: string;
  content: string;
};

type NativeReferenceChecklistItem = {
  key: string;
  title: string;
  detail: string;
  ownerType: "engineering" | "design" | "qa";
  riskLevel: "low" | "medium" | "high";
  verificationStep: string;
};

type NativeReferenceKitSummary = {
  router: "expo-router";
  platform: "ios";
  blueprintCount: number;
  screenCount: number;
  categories: Array<{
    category: NativeReferenceFileCategory;
    count: number;
  }>;
  recommendedDirectories: string[];
};

type NativeReferenceKit = {
  generatedAt: string;
  summary: NativeReferenceKitSummary;
  files: NativeReferenceFile[];
  implementationChecklist: NativeReferenceChecklistItem[];
};

function getPropsTypeName(contract: AssessmentSchemaNativeBlueprintContract) {
  return `${contract.recommendedComponentName}Props`;
}


function buildPropsInterface(contract: AssessmentSchemaNativeBlueprintContract) {
  const lines = contract.propsContract
    .map((prop) => `  ${prop.name}${prop.required ? "" : "?"}: ${prop.type};`)
    .join("\n");

  return `export type ${getPropsTypeName(contract)} = {\n${lines}\n};`;
}

function buildComponentScaffold(contract: AssessmentSchemaNativeBlueprintContract) {
  const propsTypeName = getPropsTypeName(contract);
  const requiredBlocks = contract.requiredBlocks.map((block) => `        <Text style={styles.metaLine}>required · ${block}</Text>`).join("\n");
  const optionalBlocks = contract.optionalBlocks.length > 0
    ? contract.optionalBlocks.map((block) => `        <Text style={styles.metaLine}>optional · ${block}</Text>`).join("\n")
    : '        <Text style={styles.metaLine}>optional · none</Text>';

  return `import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { BenyuanPrimaryAction } from "../components/primitives/BenyuanPrimaryAction";
import { BenyuanScreenShell } from "../components/primitives/BenyuanScreenShell";
import type { ${propsTypeName} } from "../types/${contract.recommendedComponentName}";

export function ${contract.recommendedComponentName}(props: ${propsTypeName}) {
  return (
    <BenyuanScreenShell
      title={props.title}
      description={props.description}
      stepLabel={props.stepLabel}
      footer={
        <BenyuanPrimaryAction label={props.primaryActionLabel} disabled={props.primaryDisabled} onPress={props.onContinue} />
      }
    >
      <View style={styles.surface}>
        <Text style={styles.label}>${contract.blueprint}</Text>
        <Text style={styles.metaLine}>container · ${contract.recommendedContainer}</Text>
        <Text style={styles.metaLine}>input slot · ${contract.primaryInputSlot}</Text>
        <Text style={styles.metaLine}>footer slot · ${contract.footerSlot}</Text>
${requiredBlocks}
${optionalBlocks}
      </View>
      {/* Replace the surface above with actual native blocks for ${contract.blueprint}. */}
    </BenyuanScreenShell>
  );
}

const styles = StyleSheet.create({
  surface: {
    gap: 8,
    borderRadius: 24,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  label: {
    color: "#F5F1E8",
    fontSize: 13,
    letterSpacing: 2.6,
    textTransform: "uppercase",
  },
  metaLine: {
    color: "rgba(232,226,215,0.78)",
    fontSize: 14,
    lineHeight: 22,
  },
});
`;
}

function buildTypeFile(contract: AssessmentSchemaNativeBlueprintContract) {
  return `${buildPropsInterface(contract)}

export const ${contract.recommendedComponentName}Checklist = ${JSON.stringify(contract.implementationChecklist, null, 2)} as const;
`;
}

function buildRegistryFile(contracts: AssessmentSchemaNativeBlueprintContract[]) {
  const imports = contracts
    .map((contract) => `import { ${contract.recommendedComponentName} } from "./screens/${contract.recommendedComponentName}";`)
    .join("\n");

  const entries = contracts
    .map((contract) => `  ${JSON.stringify(contract.blueprint)}: ${contract.recommendedComponentName},`)
    .join("\n");

  return `${imports}

export const nativeBlueprintRegistry = {
${entries}
} as const;
`;
}

function buildRenderHelper(contracts: AssessmentSchemaNativeBlueprintContract[]) {
  const union = contracts.map((contract) => JSON.stringify(contract.blueprint)).join(" | ");

  return `import { nativeBlueprintRegistry } from "./registry";

type NativeBlueprint = ${union};

type NativeScreenRecord = {
  blueprint: NativeBlueprint;
  screenId: string;
};

export function resolveNativeScreenComponent(record: NativeScreenRecord) {
  return nativeBlueprintRegistry[record.blueprint];
}
`;
}

function buildRootLayoutFile() {
  return `import { Stack } from "expo-router";
import React from "react";
import { BenyuanProvider } from "../providers/BenyuanProvider";

export default function RootLayout() {
  return (
    <BenyuanProvider>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
    </BenyuanProvider>
  );
}
`;
}

function buildAssessmentGroupLayoutFile() {
  return `import { Stack } from "expo-router";
import React from "react";

export default function AssessmentLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: "fade_from_bottom" }} />;
}
`;
}

function buildAssessmentEntryFile() {
  return `import React from "react";
import { BenyuanNavigator } from "../../navigation/BenyuanNavigator";

export default function AssessmentEntryRoute() {
  return <BenyuanNavigator />;
}
`;
}

function buildProviderFile() {
  return `import React, { createContext, useContext, useMemo } from "react";
import type { PropsWithChildren } from "react";
import { assessmentContract } from "../contracts/assessmentContract";
import { benyuanNativeTokens } from "../theme/tokens";

type BenyuanRuntimeContextValue = {
  contract: typeof assessmentContract;
  tokens: typeof benyuanNativeTokens;
};

const BenyuanRuntimeContext = createContext<BenyuanRuntimeContextValue | null>(null);

export function BenyuanProvider({ children }: PropsWithChildren) {
  const value = useMemo(
    () => ({
      contract: assessmentContract,
      tokens: benyuanNativeTokens,
    }),
    [],
  );

  return <BenyuanRuntimeContext.Provider value={value}>{children}</BenyuanRuntimeContext.Provider>;
}

export function useBenyuanRuntime() {
  const context = useContext(BenyuanRuntimeContext);

  if (!context) {
    throw new Error("useBenyuanRuntime must be used inside BenyuanProvider");
  }

  return context;
}
`;
}

function buildContractFile(nativeMap: AssessmentSchemaNativeMap) {
  return `export const assessmentContract = ${JSON.stringify(
    {
      native: {
        platform: nativeMap.platform,
        blueprintSequence: nativeMap.blueprintSequence,
        screenMap: nativeMap.screenMap,
      },
    },
    null,
    2,
  )} as const;
`;
}

function buildNavigatorScaffold() {
  return `import React from "react";
import { resolveNativeScreenComponent } from "../render";
import { useBenyuanFormState } from "../hooks/useBenyuanFormState";
import { useBenyuanNativeFlow } from "../hooks/useBenyuanNativeFlow";
import { useBenyuanRuntime } from "../providers/BenyuanProvider";

export function BenyuanNavigator() {
  const { contract } = useBenyuanRuntime();
  const flow = useBenyuanNativeFlow({
    flow: {
      pacing: {
        entryStep: 0,
        reviewStep: contract.native.screenMap.length - 1,
        questionStepCount: Math.max(contract.native.screenMap.length - 2, 0),
      },
    },
    native: {
      screenMap: contract.native.screenMap,
    },
  });
  const form = useBenyuanFormState({
    initialState: {
      lifeStage: "",
      moodKeywords: [],
      answers: {},
    },
  });

  const ScreenComponent = resolveNativeScreenComponent(flow.currentScreen);

  return (
    <ScreenComponent
      title={flow.currentScreen.headline}
      description={flow.currentScreen.primaryPrompt}
      stepLabel={"step " + (flow.currentStep + 1)}
      primaryActionLabel={flow.currentScreen.primaryActionLabel}
      primaryDisabled={false}
      onContinue={flow.goNext}
      onBack={flow.goBack}
      state={form.state}
      setAnswer={form.setAnswer}
    />
  );
}
`;
}

function buildFlowHookScaffold() {
  return `import { useMemo, useState } from "react";

type NativeFlowContract = {
  flow: {
    pacing: {
      entryStep: number;
      reviewStep: number;
      questionStepCount: number;
    };
  };
  native: {
    screenMap: Array<{ step: number; screenId: string; blueprint: string; headline: string; primaryPrompt: string; primaryActionLabel: string }>;
  };
};

export function useBenyuanNativeFlow(contract: NativeFlowContract) {
  const [currentStep, setCurrentStep] = useState(contract.flow.pacing.entryStep);

  const currentScreen = useMemo(
    () => contract.native.screenMap.find((item) => item.step === currentStep) ?? contract.native.screenMap[0],
    [contract.native.screenMap, currentStep],
  );

  const progressRatio = useMemo(() => {
    if (contract.flow.pacing.reviewStep === contract.flow.pacing.entryStep) {
      return 1;
    }

    return currentStep / contract.flow.pacing.reviewStep;
  }, [contract.flow.pacing.entryStep, contract.flow.pacing.reviewStep, currentStep]);

  return {
    currentStep,
    currentScreen,
    progressRatio,
    goNext: () => setCurrentStep((value) => Math.min(value + 1, contract.flow.pacing.reviewStep)),
    goBack: () => setCurrentStep((value) => Math.max(value - 1, contract.flow.pacing.entryStep)),
    jumpToStep: (step: number) => setCurrentStep(step),
  };
}
`;
}

function buildFormStateHookScaffold() {
  return `import { useMemo, useState } from "react";

type NativeFormState = {
  lifeStage: string;
  moodKeywords: string[];
  answers: Record<string, string | string[] | number>;
};

type NativeSchema = {
  initialState: NativeFormState;
};

export function useBenyuanFormState(schema: NativeSchema) {
  const [state, setState] = useState(schema.initialState);

  return useMemo(
    () => ({
      state,
      setLifeStage: (lifeStage: string) => setState((value) => ({ ...value, lifeStage })),
      toggleMoodKeyword: (keyword: string) =>
        setState((value) => ({
          ...value,
          moodKeywords: value.moodKeywords.includes(keyword)
            ? value.moodKeywords.filter((item) => item !== keyword)
            : [...value.moodKeywords, keyword],
        })),
      setAnswer: (questionId: string, answer: string | string[] | number) =>
        setState((value) => ({
          ...value,
          answers: {
            ...value.answers,
            [questionId]: answer,
          },
        })),
    }),
    [state],
  );
}
`;
}

function buildThemeTokenFile() {
  return `export const benyuanNativeTokens = {
  colors: {
    background: "#08080a",
    foreground: "#f4f1eb",
    muted: "#a8a29e",
    halo: "rgba(189,218,255,0.16)",
    line: "rgba(255,255,255,0.08)",
    surface: "rgba(255,255,255,0.04)",
  },
  radius: {
    screen: 28,
    card: 24,
    pill: 999,
  },
  spacing: {
    airy: 24,
    balanced: 18,
    compact: 12,
  },
} as const;
`;
}

function buildScreenShellFile() {
  return `import React from "react";
import type { PropsWithChildren, ReactNode } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { benyuanNativeTokens } from "../../theme/tokens";

type BenyuanScreenShellProps = PropsWithChildren<{
  title: string;
  description: string;
  stepLabel: string;
  footer?: ReactNode;
}>;

export function BenyuanScreenShell({ title, description, stepLabel, footer, children }: BenyuanScreenShellProps) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.stepLabel}>{stepLabel}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={styles.body}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: benyuanNativeTokens.colors.background,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  header: {
    gap: 10,
  },
  stepLabel: {
    color: benyuanNativeTokens.colors.muted,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  title: {
    color: benyuanNativeTokens.colors.foreground,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "600",
  },
  description: {
    color: "rgba(244,241,235,0.78)",
    fontSize: 15,
    lineHeight: 24,
  },
  body: {
    flex: 1,
    paddingTop: 24,
    gap: 18,
  },
  footer: {
    paddingTop: 16,
  },
});
`;
}

function buildPrimaryActionFile() {
  return `import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { benyuanNativeTokens } from "../../theme/tokens";

type BenyuanPrimaryActionProps = {
  label: string;
  disabled?: boolean;
  onPress: () => void;
};

export function BenyuanPrimaryAction({ label, disabled = false, onPress }: BenyuanPrimaryActionProps) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, disabled ? styles.disabled : null, pressed ? styles.pressed : null]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: benyuanNativeTokens.radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.42,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  label: {
    color: benyuanNativeTokens.colors.foreground,
    fontSize: 15,
    letterSpacing: 1.2,
    fontWeight: "600",
  },
});
`;
}

function buildProgressHeaderFile() {
  return `import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { benyuanNativeTokens } from "../../theme/tokens";

type BenyuanProgressHeaderProps = {
  phaseLabel: string;
  progressRatio: number;
};

export function BenyuanProgressHeader({ phaseLabel, progressRatio }: BenyuanProgressHeaderProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.phaseLabel}>{phaseLabel}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: Math.max(0, Math.min(progressRatio, 1)) * 100 + "%" }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 10,
  },
  phaseLabel: {
    color: benyuanNativeTokens.colors.muted,
    fontSize: 12,
    letterSpacing: 1.8,
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: benyuanNativeTokens.colors.surface,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: benyuanNativeTokens.colors.halo,
  },
});
`;
}

function buildOptionPillFile() {
  return `import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { benyuanNativeTokens } from "../../theme/tokens";

type BenyuanOptionPillProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function BenyuanOptionPill({ label, active = false, onPress }: BenyuanOptionPillProps) {
  return (
    <Pressable onPress={onPress} style={[styles.root, active ? styles.active : null]}>
      <Text style={[styles.label, active ? styles.labelActive : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 48,
    borderRadius: benyuanNativeTokens.radius.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: benyuanNativeTokens.colors.surface,
    borderWidth: 1,
    borderColor: benyuanNativeTokens.colors.line,
    justifyContent: "center",
  },
  active: {
    backgroundColor: "rgba(189,218,255,0.14)",
    borderColor: "rgba(189,218,255,0.24)",
  },
  label: {
    color: "rgba(244,241,235,0.78)",
    fontSize: 14,
    lineHeight: 22,
  },
  labelActive: {
    color: benyuanNativeTokens.colors.foreground,
  },
});
`;
}

function buildSummaryPanelFile() {
  return `import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { benyuanNativeTokens } from "../../theme/tokens";

type BenyuanSummaryPanelProps = {
  title: string;
  items: string[];
};

export function BenyuanSummaryPanel({ title, items }: BenyuanSummaryPanelProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.items}>
        {items.map((item) => (
          <Text key={item} style={styles.item}>
            {item}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
    borderRadius: benyuanNativeTokens.radius.card,
    padding: 18,
    backgroundColor: benyuanNativeTokens.colors.surface,
    borderWidth: 1,
    borderColor: benyuanNativeTokens.colors.line,
  },
  title: {
    color: benyuanNativeTokens.colors.foreground,
    fontSize: 15,
    fontWeight: "600",
  },
  items: {
    gap: 8,
  },
  item: {
    color: "rgba(244,241,235,0.78)",
    fontSize: 14,
    lineHeight: 22,
  },
});
`;
}

function buildImplementationChecklist(nativeMap: AssessmentSchemaNativeMap): NativeReferenceChecklistItem[] {
  return [
    {
      key: "router-shell-mounted",
      title: "Expo Router 壳已挂载",
      detail: `app/_layout 与 assessment route 已接上 ${nativeMap.screenMap.length} 个 step 的导航循环。`,
      ownerType: "engineering",
      riskLevel: "medium",
      verificationStep: "启动原生壳后，从 entry 进入并连续前进到 review，确认 step 不丢失。",
    },
    {
      key: "provider-runtime-wired",
      title: "运行时 Provider 接线",
      detail: "contract、tokens、form state 与 flow hook 已在根 Provider 和 Navigator 间闭环。",
      ownerType: "engineering",
      riskLevel: "medium",
      verificationStep: "断点检查 currentScreen、answers、lifeStage、moodKeywords 在切屏后保持同步。",
    },
    {
      key: "token-mapping-reviewed",
      title: "视觉 token 已映射到原生 primitives",
      detail: "background / surface / halo / line / radius / spacing 已落到 ScreenShell、CTA、Option 与 Summary。",
      ownerType: "design",
      riskLevel: "low",
      verificationStep: "对照 schema.native.screenMap 中的 token 组合抽查三类 screen 是否呈现一致。",
    },
    {
      key: "review-gating-covered",
      title: "Review gating 覆盖",
      detail: "review screen 需要对 life stage、mood keyword、required questions、开放题门槛做统一校验。",
      ownerType: "qa",
      riskLevel: "high",
      verificationStep: "构造空答案、半完成、完整三种状态，确认 review CTA 的启用逻辑正确。",
    },
  ];
}

export function buildNativeMigrationChecklist(diff: AssessmentNativeBlueprintDiff): NativeReferenceChecklistItem[] {
  const items: NativeReferenceChecklistItem[] = [];

  if (diff.changedSequenceSteps.length > 0) {
    items.push({
      key: "sequence-remap-engineering",
      title: "screen sequence 重排",
      detail: `检查 ${diff.changedSequenceSteps.length} 个 step 的 blueprint 是否重排，并同步调整 navigator 的 step -> screen 映射。`,
      ownerType: "engineering",
      riskLevel: "high",
      verificationStep: "逐步点击 next/back，确认 step index、blueprint、header 文案与 schema 一致。",
    });
    items.push({
      key: "sequence-remap-qa",
      title: "顺序回归用例更新",
      detail: "补齐前进、回退、跳转 review、从 review 回看首个未完成题目的回归测试。",
      ownerType: "qa",
      riskLevel: "high",
      verificationStep: "执行 step-flow 回归脚本，确保不存在跳步、重复或死循环。",
    });
  }

  if (diff.changedBlueprintContracts.length > 0) {
    items.push({
      key: "contract-changed-engineering",
      title: "blueprint contract 更新",
      detail: `以下 blueprint 契约发生变化：${diff.changedBlueprintContracts.map((item) => item.blueprint).join(" · ")}`,
      ownerType: "engineering",
      riskLevel: "high",
      verificationStep: "逐个核对 changedKeys，对应更新 props、slot、footer 行为与 screen registry。",
    });
    items.push({
      key: "contract-changed-design",
      title: "交互与视觉回查",
      detail: "检查 blueprint contract 变化是否影响顶部栏、CTA 固定方式、option chrome 或背景气氛。",
      ownerType: "design",
      riskLevel: "medium",
      verificationStep: "比对 target 版本 native tokens 与 screen handoff，确认视觉语言仍然统一。",
    });
  }

  if (diff.addedBlueprints.length > 0 || diff.removedBlueprints.length > 0) {
    items.push({
      key: "blueprint-added-removed",
      title: "blueprint 增删校验",
      detail: `新增：${diff.addedBlueprints.join(" · ") || "无"}；移除：${diff.removedBlueprints.join(" · ") || "无"}`,
      ownerType: "engineering",
      riskLevel: "medium",
      verificationStep: "确认 registry、route、screen stub、analytics 埋点与 snapshot 测试都已同步。",
    });
  }

  if (items.length === 0) {
    items.push({
      key: "no-native-migration",
      title: "无需额外原生迁移",
      detail: "当前版本之间没有检测到 blueprint 契约或序列层面的变化。",
      ownerType: "engineering",
      riskLevel: "low",
      verificationStep: "保留现有 smoke test 即可，无需额外 screen 重构。",
    });
  }

  return items;
}

function buildReferenceKitSummary(files: NativeReferenceFile[], nativeMap: AssessmentSchemaNativeMap): NativeReferenceKitSummary {
  const categoryCountMap = new Map<NativeReferenceFileCategory, number>();

  for (const file of files) {
    categoryCountMap.set(file.category, (categoryCountMap.get(file.category) ?? 0) + 1);
  }

  return {
    router: "expo-router",
    platform: nativeMap.platform,
    blueprintCount: nativeMap.blueprintCatalog.length,
    screenCount: nativeMap.screenMap.length,
    categories: Array.from(categoryCountMap.entries()).map(([category, count]) => ({
      category,
      count,
    })),
    recommendedDirectories: [
      "app/",
      "providers/",
      "contracts/",
      "navigation/",
      "screens/",
      "components/primitives/",
      "hooks/",
      "theme/",
      "types/",
    ],
  };
}

export function buildNativeReferenceKit(nativeMap: AssessmentSchemaNativeMap): NativeReferenceKit {
  const files: NativeReferenceFile[] = [];

  files.push({
    path: "native-reference/app/_layout.tsx",
    language: "tsx",
    category: "app-shell",
    title: "Root layout",
    description: "Expo Router 根布局，挂载全局 Provider 与无头 Stack。",
    content: buildRootLayoutFile(),
  });

  files.push({
    path: "native-reference/app/(assessment)/_layout.tsx",
    language: "tsx",
    category: "app-shell",
    title: "Assessment group layout",
    description: "Assessment 分组的 route layout。",
    content: buildAssessmentGroupLayoutFile(),
  });

  files.push({
    path: "native-reference/app/(assessment)/index.tsx",
    language: "tsx",
    category: "app-shell",
    title: "Assessment entry route",
    description: "Assessment 入口 route，直接挂载 Navigator。",
    content: buildAssessmentEntryFile(),
  });

  files.push({
    path: "native-reference/providers/BenyuanProvider.tsx",
    language: "tsx",
    category: "provider",
    title: "BenyuanProvider",
    description: "把 schema contract 与 tokens 提供给原生运行时。",
    content: buildProviderFile(),
  });

  files.push({
    path: "native-reference/contracts/assessmentContract.ts",
    language: "ts",
    category: "contract",
    title: "Assessment contract",
    description: "把 schema.native 的 screenMap 和 blueprintSequence 固化给原生端。",
    content: buildContractFile(nativeMap),
  });

  for (const contract of nativeMap.blueprintCatalog) {
    files.push({
      path: `native-reference/screens/${contract.recommendedComponentName}.tsx`,
      language: "tsx",
      category: "screen",
      title: contract.recommendedComponentName,
      description: `${contract.blueprint} 的 React Native 参考骨架。`,
      content: buildComponentScaffold(contract),
    });

    files.push({
      path: `native-reference/types/${contract.recommendedComponentName}.ts`,
      language: "ts",
      category: "type",
      title: `${contract.recommendedComponentName} props`,
      description: `${contract.blueprint} 的 props contract 与 checklist。`,
      content: buildTypeFile(contract),
    });
  }

  files.push({
    path: "native-reference/components/primitives/BenyuanScreenShell.tsx",
    language: "tsx",
    category: "component",
    title: "BenyuanScreenShell",
    description: "原生题目页的基础布局壳。",
    content: buildScreenShellFile(),
  });

  files.push({
    path: "native-reference/components/primitives/BenyuanPrimaryAction.tsx",
    language: "tsx",
    category: "component",
    title: "BenyuanPrimaryAction",
    description: "底部主按钮 primitive。",
    content: buildPrimaryActionFile(),
  });

  files.push({
    path: "native-reference/components/primitives/BenyuanProgressHeader.tsx",
    language: "tsx",
    category: "component",
    title: "BenyuanProgressHeader",
    description: "phase 与 step 进度头部组件。",
    content: buildProgressHeaderFile(),
  });

  files.push({
    path: "native-reference/components/primitives/BenyuanOptionPill.tsx",
    language: "tsx",
    category: "component",
    title: "BenyuanOptionPill",
    description: "单选/多选场景可复用的 option primitive。",
    content: buildOptionPillFile(),
  });

  files.push({
    path: "native-reference/components/primitives/BenyuanSummaryPanel.tsx",
    language: "tsx",
    category: "component",
    title: "BenyuanSummaryPanel",
    description: "review 页的 summary panel primitive。",
    content: buildSummaryPanelFile(),
  });

  files.push({
    path: "native-reference/registry.ts",
    language: "ts",
    category: "navigation",
    title: "Blueprint registry",
    description: "blueprint 到 screen component 的映射表。",
    content: buildRegistryFile(nativeMap.blueprintCatalog),
  });

  files.push({
    path: "native-reference/render.ts",
    language: "ts",
    category: "navigation",
    title: "Render helper",
    description: "给端上路由层使用的 screen resolve helper。",
    content: buildRenderHelper(nativeMap.blueprintCatalog),
  });

  files.push({
    path: "native-reference/navigation/BenyuanNavigator.tsx",
    language: "tsx",
    category: "navigation",
    title: "BenyuanNavigator",
    description: "step-driven 原生导航壳骨架。",
    content: buildNavigatorScaffold(),
  });

  files.push({
    path: "native-reference/hooks/useBenyuanNativeFlow.ts",
    language: "ts",
    category: "hook",
    title: "useBenyuanNativeFlow",
    description: "控制 step 跳转与当前 screen 解析的 flow hook。",
    content: buildFlowHookScaffold(),
  });

  files.push({
    path: "native-reference/hooks/useBenyuanFormState.ts",
    language: "ts",
    category: "hook",
    title: "useBenyuanFormState",
    description: "统一管理入口状态与题目答案的 form hook。",
    content: buildFormStateHookScaffold(),
  });

  files.push({
    path: "native-reference/theme/tokens.ts",
    language: "ts",
    category: "theme",
    title: "Native theme tokens",
    description: "给 React Native 参考实现使用的基础主题 token。",
    content: buildThemeTokenFile(),
  });

  return {
    generatedAt: new Date().toISOString(),
    summary: buildReferenceKitSummary(files, nativeMap),
    files,
    implementationChecklist: buildImplementationChecklist(nativeMap),
  };
}

export type { NativeReferenceChecklistItem, NativeReferenceFile, NativeReferenceFileCategory, NativeReferenceKit, NativeReferenceKitSummary };
