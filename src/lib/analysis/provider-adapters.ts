import type { ReportPayload } from "@/lib/types";
import type { AnalysisEngineResult, AnalysisPromptShapingResult, AnalysisProviderEnhancement } from "@/lib/analysis/types";

type ProviderRuntimeParams = {
  model: string;
  apiKey: string;
  timeoutMs: number;
};

type ProviderRequestContext = {
  providerId: string;
  prompt: AnalysisPromptShapingResult;
  baseline: AnalysisEngineResult;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractJsonObject(rawText: string) {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? rawText;
  const trimmed = candidate.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) {
    return null;
  }

  try {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as unknown;
  } catch {
    return null;
  }
}

function normalizeProviderReportPayload(value: unknown): Partial<ReportPayload> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const report = isRecord(value.report) ? value.report : value;
  return report as Partial<ReportPayload>;
}

function buildEnhancementFromText(rawText: string, metadata: AnalysisProviderEnhancement["metadata"]) {
  const parsed = extractJsonObject(rawText);
  const report = normalizeProviderReportPayload(parsed);

  return {
    report,
    metadata,
  } satisfies AnalysisProviderEnhancement;
}

function buildProviderUserPayload(prompt: AnalysisPromptShapingResult, baseline: AnalysisEngineResult) {
  return JSON.stringify(
    {
      promptPayload: prompt.payload,
      promptSummary: prompt.summary,
      deterministicBaseline: {
        overview: baseline.report.overview,
        archetype: baseline.report.archetype,
        tensions: baseline.report.tensions,
        recommendations: baseline.report.recommendations,
        safetyFlags: baseline.report.safetyFlags,
        confidenceBand: baseline.report.confidenceBand,
      },
    },
    null,
    2,
  );
}

function buildStructuredInstructions() {
  return [
    "Return strict JSON only.",
    "Use the shape { \"report\": { ...partialReportFields } }.",
    "Only include report fields you are improving.",
    "Do not invent clinical claims.",
    "Never remove or weaken safety-related language.",
  ].join(" ");
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    const data = (await response.json()) as unknown;
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}: ${JSON.stringify(data)}`);
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function readOpenAIText(payload: unknown) {
  if (!isRecord(payload)) return "";
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  const output = payload.output;
  if (!Array.isArray(output)) return "";

  return output
    .flatMap((item) => {
      if (!isRecord(item)) return [] as string[];
      const content = item.content;
      if (!Array.isArray(content)) return [] as string[];
      return content.flatMap((part) => {
        if (!isRecord(part)) return [] as string[];
        if (typeof part.text === "string") return [part.text];
        if (isRecord(part.text) && typeof part.text.value === "string") return [part.text.value];
        return [] as string[];
      });
    })
    .join("\n")
    .trim();
}

function readAnthropicText(payload: unknown) {
  if (!isRecord(payload)) return "";
  const content = payload.content;
  if (!Array.isArray(content)) return "";

  return content
    .flatMap((item) => {
      if (!isRecord(item)) return [] as string[];
      return typeof item.text === "string" ? [item.text] : [];
    })
    .join("\n")
    .trim();
}

export async function requestOpenAIAnalysisEnhancement(
  params: ProviderRuntimeParams,
  context: ProviderRequestContext,
): Promise<AnalysisProviderEnhancement> {
  const response = await fetchJson(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: `${context.prompt.payload.system}\n\n${buildStructuredInstructions()}` }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: buildProviderUserPayload(context.prompt, context.baseline) }],
          },
        ],
      }),
    },
    params.timeoutMs,
  );

  const metadata = {
    providerId: context.providerId,
    promptTemplateId: context.prompt.template.id,
    promptTemplateVersion: context.prompt.template.version,
    requestMode: "live" as const,
    model: params.model,
    requestId: isRecord(response) && typeof response.id === "string" ? response.id : undefined,
  };

  return buildEnhancementFromText(readOpenAIText(response), metadata);
}

export async function requestAnthropicAnalysisEnhancement(
  params: ProviderRuntimeParams,
  context: ProviderRequestContext,
): Promise<AnalysisProviderEnhancement> {
  const response = await fetchJson(
    "https://api.anthropic.com/v1/messages",
    {
      method: "POST",
      headers: {
        "x-api-key": params.apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: 1800,
        temperature: 0.5,
        system: `${context.prompt.payload.system}\n\n${buildStructuredInstructions()}`,
        messages: [
          {
            role: "user",
            content: buildProviderUserPayload(context.prompt, context.baseline),
          },
        ],
      }),
    },
    params.timeoutMs,
  );

  const metadata = {
    providerId: context.providerId,
    promptTemplateId: context.prompt.template.id,
    promptTemplateVersion: context.prompt.template.version,
    requestMode: "live" as const,
    model: params.model,
    requestId: isRecord(response) && typeof response.id === "string" ? response.id : undefined,
  };

  return buildEnhancementFromText(readAnthropicText(response), metadata);
}
