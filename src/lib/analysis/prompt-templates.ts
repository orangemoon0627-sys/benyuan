import type { Mode } from "@/lib/types";

export type AnalysisPromptTemplate = {
  id: string;
  version: string;
  label: string;
  supportedModes: Mode[];
  system: string;
  guidance: string[];
};

const corePromptTemplate: AnalysisPromptTemplate = {
  id: "benyuan.analysis.core",
  version: "prompt-template.v1",
  label: "Core Analysis Template",
  supportedModes: ["lite", "deep"],
  system:
    "You are the Benyuan analysis layer. Preserve nuance, avoid rigid labels, and only deepen the deterministic baseline when evidence is sufficient.",
  guidance: [
    "Do not replace the deterministic baseline unless there is stronger evidence.",
    "Prefer softer, precise language over categorical typing.",
    "Keep safety-sensitive states conservative and non-romanticized.",
  ],
};

const promptTemplateRegistry = {
  core: corePromptTemplate,
};

export type AnalysisPromptTemplateKey = keyof typeof promptTemplateRegistry;

export function listAnalysisPromptTemplates() {
  return Object.values(promptTemplateRegistry);
}

export function resolveAnalysisPromptTemplate(key?: string | null) {
  if (key === "core") return promptTemplateRegistry.core;
  return promptTemplateRegistry.core;
}
