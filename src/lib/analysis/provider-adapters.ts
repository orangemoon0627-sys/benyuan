import type { ReportPayload } from "@/lib/types";
import type { AnalysisEngineResult, AnalysisPromptShapingResult, AnalysisProviderEnhancement } from "@/lib/analysis/types";

export type ProviderEnhancementScope = "archetype_core" | "narrative_copy" | "guidance_pack";

type ProviderRuntimeParams = {
  model: string;
  apiKey: string;
  timeoutMs: number;
  baseUrl?: string;
  forceStream?: boolean;
  store?: boolean;
  maxOutputTokens?: number;
  reasoningEffort?: "low" | "medium" | "high";
};

type ProviderRequestContext = {
  providerId: string;
  prompt: AnalysisPromptShapingResult;
  baseline: AnalysisEngineResult;
};

const PROVIDER_RESPONSE_PREVIEW_LIMIT = 260;

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonString(raw: string) {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
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

function summarizePromptUserInput(raw: string) {
  const parsed = parseJsonString(raw);
  if (!isRecord(parsed)) return parsed;

  const answers = Array.isArray(parsed.answers) ? parsed.answers.filter(isRecord) : [];
  const reflectionSnippets = answers
    .filter((answer) => answer.answerType === "text" && typeof answer.prompt === "string" && typeof answer.value === "string" && answer.value.trim().length > 0)
    .slice(0, 2)
    .map((answer) => ({
      questionId: typeof answer.questionId === "string" ? answer.questionId : undefined,
      prompt: answer.prompt,
      value: typeof answer.value === "string" ? answer.value.trim().slice(0, 120) : answer.value,
    }));
  const answerDigest = answers.slice(0, 6).map((answer) => ({
    questionId: typeof answer.questionId === "string" ? answer.questionId : undefined,
    moduleId: typeof answer.moduleId === "string" ? answer.moduleId : undefined,
    prompt: typeof answer.prompt === "string" ? answer.prompt : undefined,
    value: Array.isArray(answer.value) ? answer.value.slice(0, 3) : answer.value,
  }));
  const moduleSequence = [...new Set(answers.map((answer) => (typeof answer.moduleId === "string" ? answer.moduleId : null)).filter(Boolean))];

  return {
    mode: typeof parsed.mode === "string" ? parsed.mode : undefined,
    sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : undefined,
    basicInfo: isRecord(parsed.basicInfo) ? parsed.basicInfo : undefined,
    answerDigest,
    reflectionSnippets,
    moduleSequence,
  };
}

function summarizeBaselineForScope(baseline: AnalysisEngineResult, scope: ProviderEnhancementScope) {
  if (scope === "archetype_core") {
    return {
      overview: baseline.report.overview,
      archetype: {
        name: baseline.report.archetype.name,
        englishName: baseline.report.archetype.englishName,
        subtitle: baseline.report.archetype.subtitle,
        coreEssence: baseline.report.archetype.coreEssence,
        description: baseline.report.archetype.description,
        sourceSignals: baseline.report.archetype.sourceSignals,
      },
      sevenDimensions: baseline.report.sevenDimensions?.map((dimension) => ({
        key: dimension.key,
        label: dimension.label,
        score: dimension.score,
      })),
      safetyFlags: baseline.report.safetyFlags,
      confidenceBand: baseline.report.confidenceBand,
    };
  }

  if (scope === "narrative_copy") {
    return {
      overview: baseline.report.overview,
      narrativeOverview: baseline.report.narrativeOverview,
      archetype: {
        name: baseline.report.archetype.name,
        coreEssence: baseline.report.archetype.coreEssence,
      },
      tensions: baseline.report.tensions.map((tension) => ({
        name: tension.name,
        poles: tension.poles,
        description: tension.description,
      })),
      safetyFlags: baseline.report.safetyFlags,
    };
  }

  return {
    overview: baseline.report.overview,
    narrativeOverview: baseline.report.narrativeOverview,
    tensions: baseline.report.tensions.map((tension) => ({
      name: tension.name,
      description: tension.description,
      suggestion: tension.suggestion,
    })),
    growthSuggestions: baseline.report.growthSuggestions,
    curatedRecommendations: baseline.report.curatedRecommendations,
    safetyFlags: baseline.report.safetyFlags,
  };
}

function createTargetShape(scope: ProviderEnhancementScope) {
  if (scope === "archetype_core") {
    return {
      report: {
        archetype: {
          name: "string",
          englishName: "string",
          coreEssence: "string",
          subtitle: "string",
          visualPrompt: "string",
          description: "string",
        },
      },
    };
  }

  if (scope === "narrative_copy") {
    return {
      report: {
        narrativeOverview: "string",
        tensions: [{ name: "string", description: "string", suggestion: "string" }],
      },
    };
  }

  return {
    report: {
      growthSuggestions: [{ title: "string", description: "string", actionableSteps: ["string"] }],
      curatedRecommendations: {
        books: [{ title: "string", creator: "string", reason: "string" }],
        films: [{ title: "string", creator: "string", reason: "string" }],
        music: [{ title: "string", creator: "string", reason: "string" }],
      },
    },
  };
}

function buildEnhancementFromText(
  rawText: string,
  metadata: AnalysisProviderEnhancement["metadata"],
  scope: ProviderEnhancementScope,
) {
  const trimmedText = rawText.trim();
  const parsed = extractJsonObject(trimmedText);
  const report = normalizeProviderReportPayload(parsed);

  return {
    report,
    metadata: {
      providerId: metadata?.providerId ?? "provider.unknown",
      ...metadata,
      completedScopes: report ? [scope] : undefined,
      textReceived: trimmedText.length > 0,
      responsePreview: trimmedText ? trimmedText.slice(0, PROVIDER_RESPONSE_PREVIEW_LIMIT) : undefined,
    },
  } satisfies AnalysisProviderEnhancement;
}

function buildProviderUserPayload(
  prompt: AnalysisPromptShapingResult,
  baseline: AnalysisEngineResult,
  scope: ProviderEnhancementScope,
) {
  return JSON.stringify({
    mode: prompt.payload.metadata.mode,
    sessionId: prompt.payload.metadata.sessionId,
    promptTemplateId: prompt.template.id,
    promptTemplateVersion: prompt.template.version,
    promptSummary: prompt.summary,
    enhancementScope: scope,
    userInput: summarizePromptUserInput(prompt.payload.user),
    deterministicBaseline: summarizeBaselineForScope(baseline, scope),
    targetShape: createTargetShape(scope),
  });
}

function buildStructuredInstructions(scope: ProviderEnhancementScope) {
  const shared = [
    "Return strict JSON only.",
    'Use the shape { "report": { ...partialReportFields } }.',
    "Prefer concise partial improvements rather than rewriting the entire report.",
    "If the deterministic baseline is already sufficient for a field, omit that field.",
    "Do not invent clinical claims.",
    "Never remove or weaken safety-related language.",
    "Preserve evidence-grounded reasoning and keep the report non-pathologizing.",
    "Avoid duplicate section items, repeated suggestion titles, repeated action steps, and repeated recommendation entries.",
  ];

  const scopeSpecific =
    scope === "archetype_core"
      ? [
          "Only improve archetype.",
          "Return just one concise archetype object grounded in the provided signals.",
          "Do not return narrativeOverview, tensions, growthSuggestions, or curatedRecommendations in this pass.",
        ]
      : scope === "narrative_copy"
        ? [
            "Only improve narrativeOverview and tensions.",
            "Keep narrativeOverview between roughly 420 and 760 Chinese characters.",
            "Do not return archetype, growthSuggestions, or curatedRecommendations in this pass.",
          ]
        : [
            "Only improve growthSuggestions and curatedRecommendations.",
            "Keep growth suggestions actionable and concrete.",
            "Keep recommendations culturally literate and concise.",
            "Do not return narrativeOverview, archetype, tensions, or sevenDimensions in this pass.",
          ];

  return [...shared, ...scopeSpecific].join(" ");
}

function createEnhancementSystemText(scope: ProviderEnhancementScope, prompt: AnalysisPromptShapingResult) {
  return [
    "You are refining an already-generated psychological exploration report for the Chinese product 本源 (Source).",
    `Mode: ${prompt.payload.metadata.mode}.`,
    `Prompt template: ${prompt.template.label} (${prompt.template.id}).`,
    buildStructuredInstructions(scope),
  ].join(" ");
}

function joinBaseUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const rawText = await response.text();
    let parsed: unknown = null;

    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = rawText;
    }

    if (!response.ok) {
      throw new Error(`provider_request_failed:${response.status}:${typeof parsed === "string" ? parsed : JSON.stringify(parsed)}`);
    }

    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchSseEvents(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  options?: { stopWhen?: (events: Array<{ event?: string; data?: unknown }>) => boolean },
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok || !response.body) {
      const raw = await response.text();
      throw new Error(`provider_request_failed:${response.status}:${raw}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const events: Array<{ event?: string; data?: unknown }> = [];

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const lines = part.split("\n").filter(Boolean);
        const event = lines.find((line) => line.startsWith("event: "))?.slice(7);
        const dataRaw = lines
          .filter((line) => line.startsWith("data: "))
          .map((line) => line.slice(6))
          .join("\n");
        if (!dataRaw || dataRaw === "[DONE]") continue;

        let data: unknown = dataRaw;
        try {
          data = JSON.parse(dataRaw);
        } catch {
          // Leave plain text as-is.
        }

        events.push({ event, data });
        if (options?.stopWhen?.(events)) {
          await reader.cancel();
          return events;
        }
      }
    }

    return events;
  } finally {
    clearTimeout(timeout);
  }
}

function readOpenAIText(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.output)) return "";

  return value.output
    .flatMap((item) => (isRecord(item) && Array.isArray(item.content) ? item.content : []))
    .map((contentPart) => {
      if (!isRecord(contentPart)) return "";
      const textValue = contentPart.text;
      return typeof textValue === "string" ? textValue : "";
    })
    .join("")
    .trim();
}

function readOpenAIStreamResult(events: Array<{ event?: string; data?: unknown }>) {
  let requestId: string | undefined;
  let completedResponse: unknown;
  let text = "";

  for (const event of events) {
    const payload = event.data;
    if (!isRecord(payload)) continue;

    const type = typeof payload.type === "string" ? payload.type : event.event;
    if (isRecord(payload.response) && typeof payload.response.id === "string") {
      requestId = payload.response.id;
    }

    if (type === "response.output_text.delta" && typeof payload.delta === "string") {
      text += payload.delta;
    }

    if (type === "response.output_text.done" && typeof payload.text === "string") {
      text = payload.text;
    }

    if (type === "response.completed") {
      completedResponse = isRecord(payload.response) ? payload.response : payload;
    }
  }

  const completedText = completedResponse ? readOpenAIText(completedResponse) : "";
  return {
    requestId,
    text: (completedText || text).trim(),
  };
}

export async function requestOpenAIAnalysisEnhancement(
  params: ProviderRuntimeParams,
  context: ProviderRequestContext,
  scope: ProviderEnhancementScope = "narrative_copy",
): Promise<AnalysisProviderEnhancement> {
  const baseUrl = params.baseUrl ?? DEFAULT_OPENAI_BASE_URL;
  const url = joinBaseUrl(baseUrl, "responses");
  const systemText = `${context.prompt.payload.system}\n\n${buildStructuredInstructions(scope)}`;
  const requestBody = {
    model: params.model,
    store: params.store ?? false,
    text: { format: { type: "text" } },
    ...(typeof params.maxOutputTokens === "number" ? { max_output_tokens: params.maxOutputTokens } : {}),
    ...(params.reasoningEffort ? { reasoning: { effort: params.reasoningEffort } } : {}),
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemText }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: buildProviderUserPayload(context.prompt, context.baseline, scope) }],
      },
    ],
  };

  let rawText = "";
  let requestId: string | undefined;

  if (params.forceStream) {
    const events = await fetchSseEvents(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...requestBody, stream: true }),
      },
      params.timeoutMs,
      {
        stopWhen(events) {
          const streamResult = readOpenAIStreamResult(events);
          return Boolean(streamResult.text && extractJsonObject(streamResult.text));
        },
      },
    );
    const streamResult = readOpenAIStreamResult(events);
    rawText = streamResult.text;
    requestId = streamResult.requestId;
  } else {
    const response = await fetchJson(
      url,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
      params.timeoutMs,
    );
    rawText = readOpenAIText(response);
    requestId = isRecord(response) && typeof response.id === "string" ? response.id : undefined;
  }

  const metadata = {
    providerId: context.providerId,
    promptTemplateId: context.prompt.template.id,
    promptTemplateVersion: context.prompt.template.version,
    requestMode: "live" as const,
    model: params.model,
    requestId,
  };

  return buildEnhancementFromText(rawText, metadata, scope);
}

function readAnthropicText(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.content)) return "";

  return value.content
    .map((item) => (isRecord(item) && typeof item.text === "string" ? item.text : ""))
    .join("")
    .trim();
}

export async function requestAnthropicAnalysisEnhancement(
  params: ProviderRuntimeParams,
  context: ProviderRequestContext,
  scope: ProviderEnhancementScope = "narrative_copy",
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
        system: `${context.prompt.payload.system}\n\n${buildStructuredInstructions(scope)}`,
        messages: [
          {
            role: "user",
            content: buildProviderUserPayload(context.prompt, context.baseline, scope),
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

  return buildEnhancementFromText(readAnthropicText(response), metadata, scope);
}
