import { readAnalysisRuntimeConfig } from "@/lib/analysis/config";
import {
  analyzeMusicInputs,
  analyzePreciousPhotoInput,
  analyzeSocialPostInputs,
  generateDeterministicConstellation,
  generateDeterministicTheaterScript,
} from "@/lib/benyuan-v3-engine";
import {
  ANALYST_SYSTEM_PROMPT,
  buildAnalystUserPrompt,
  buildDirectorUserPrompt,
  buildMultimodalUserPrompt,
  DIRECTOR_SYSTEM_PROMPT,
  MULTIMODAL_SYSTEM_PROMPT,
} from "@/lib/benyuan-v3-prompts";
import { readUploadedAssetDataUrl } from "@/lib/benyuan-v3-assets";
import { normalizePsycheConstellation } from "@/lib/benyuan-v3-normalization";
import { dedupeMirrorQuestions } from "@/lib/benyuan-v3-theater-normalization";
import { isSuspiciousArchetypeName } from "@/lib/benyuan-v3-report-profile";
import { readBenyuanAgentRuntime } from "@/lib/benyuan-server-runtime";
import { parseProviderJsonOrSsePayload } from "@/lib/benyuan-agent-response-parser";
import type {
  AgentRuntimeOverride,
  AgentReasoningEffort,
  AgentRuntimeResult,
  MultimodalInputItem,
  MusicAnalysis,
  Part1Record,
  Part2Record,
  PreciousPhotoAnalysis,
  PsycheConstellation,
  SocialPostAnalysis,
  SocialPostOverallPattern,
  TheaterScript,
} from "@/lib/benyuan-v3-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractJsonObject(rawText: string) {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? rawText;
  const trimmed = candidate.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) return null;

  try {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as unknown;
  } catch {
    return null;
  }
}

function joinBaseUrl(baseUrl: string, pathname: string) {
  return `${baseUrl.replace(/\/$/, "")}/${pathname.replace(/^\//, "")}`;
}

function readResponsesText(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.output)) return "";
  return value.output
    .flatMap((item) => (isRecord(item) && Array.isArray(item.content) ? item.content : []))
    .map((part) => (isRecord(part) && typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

function readChatText(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.choices)) return "";
  const first = value.choices[0];
  if (!isRecord(first) || !isRecord(first.message)) return "";
  return typeof first.message.content === "string" ? first.message.content.trim() : "";
}

function appendError(existing: string | undefined, next: string | undefined) {
  if (!next) return existing;
  return existing ? `${existing} | ${next}` : next;
}

const chatUnsupportedRuntimes = new Set<string>();

function getChatCompatibilityKey(runtime: { providerName: string; model: string; baseUrl: string }) {
  return `${runtime.providerName}::${runtime.model}::${runtime.baseUrl}`;
}

function collectSseTextFragments(value: unknown): string[] {
  const fragments: string[] = [];

  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    if (!isRecord(node)) return;

    if (typeof node.text === "string" && node.text.trim()) {
      fragments.push(node.text);
    }
    if (isRecord(node.text) && typeof node.text.value === "string" && node.text.value.trim()) {
      fragments.push(node.text.value);
    }
    if (typeof node.output_text === "string" && node.output_text.trim()) {
      fragments.push(node.output_text);
    }

    if (Array.isArray(node.content)) visit(node.content);
    if (Array.isArray(node.contents)) visit(node.contents);
    if (Array.isArray(node.parts)) visit(node.parts);
    if (isRecord(node.part)) visit(node.part);
    if (isRecord(node.item)) visit(node.item);
  };

  visit(value);
  return fragments;
}

function readSseErrorDetail(value: unknown) {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return undefined;

  const responseError = isRecord(value.response) ? value.response.error : undefined;
  const errorSource = isRecord(value.error)
    ? value.error
    : isRecord(responseError)
      ? responseError
      : undefined;

  if (typeof value.error === "string") return value.error;
  if (isRecord(value.response) && typeof value.response.error === "string") {
    return value.response.error;
  }
  if (!errorSource) return undefined;

  return [errorSource.code, errorSource.type, errorSource.message]
    .find((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function formatEventError(prefix: string, detail?: string) {
  return detail ? `${prefix}_event:${detail}` : `${prefix}_event`;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const STREAM_ONLY_MULTIMODAL_SYSTEM_PROMPT = [
  "Return JSON only.",
  "Top-level keys must be music_analysis, social_posts_analysis, social_posts_overall_pattern, precious_photo_analysis.",
  "Never use null; keep every required array/object present.",
  "Infer conservatively from visible evidence and keep wording compact.",
].join(" ");

const STREAM_ONLY_MULTIMODAL_USER_PROMPT = [
  "Analyze the labeled playlist screenshot, social post screenshot, and precious photo.",
  "music_analysis => primary_genres[], emotional_tone, era_distribution{}, language_diversity[], personality_signals{}.",
  "social_posts_analysis => array of {post_id,text_content,emotional_tone,themes[],expression_style,self_presentation,time_clue,psychological_signals[]}.",
  "social_posts_overall_pattern => {dominant_emotion,core_themes[],expression_authenticity}.",
  "precious_photo_analysis => {visual_content,composition,lighting,color_mood,symbolic_elements[],psychological_interpretation:{core_themes[],emotional_tone,self_concept,existential_stance,traits[]}}.",
].join(" ");

const STREAM_ONLY_MULTIMODAL_RESCUE_PROMPT = [
  "Return the same JSON shape with shorter strings and shorter arrays if needed.",
  "Prioritize valid JSON and complete keys over stylistic detail.",
].join(" ");

async function readSsePayload(response: Response) {
  if (!response.body) {
    const rawText = await response.text();
    return { outputText: rawText.trim(), requestId: undefined, errorDetail: undefined };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let outputText = "";
  let requestId: string | undefined;
  let errorDetail: string | undefined;

  const handleLine = (line: string) => {
    if (!line.startsWith("data: ")) return false;
    const payloadText = line.slice(6).trim();
    if (!payloadText || payloadText === "[DONE]") return false;

    try {
      const payload = JSON.parse(payloadText) as Record<string, unknown>;
      const type = typeof payload.type === "string" ? payload.type : "";
      if (!requestId && isRecord(payload.response) && typeof payload.response.id === "string") {
        requestId = payload.response.id;
      }
      if (type === "response.output_text.delta" && typeof payload.delta === "string") {
        outputText += payload.delta;
      }
      if (type === "response.output_text.done" && typeof payload.text === "string") {
        outputText = payload.text;
      }
      if ((type === "response.output_item.done" || type === "response.content_part.done") && !outputText.trim()) {
        const fallbackText = collectSseTextFragments(type === "response.output_item.done" ? payload.item : payload.part).join("");
        if (fallbackText.trim()) {
          outputText = fallbackText;
        }
      }
      if (type === "error" || type === "response.failed") {
        errorDetail = readSseErrorDetail(payload) ?? errorDetail;
        return true;
      }
      if (type === "response.completed") {
        return true;
      }
    } catch {
      // Ignore malformed SSE chunks and keep parsing.
    }
    return false;
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (handleLine(line)) {
        await reader.cancel();
        return { outputText: outputText.trim(), requestId, errorDetail };
      }
    }

    if (done) break;
  }

  if (buffer) {
    handleLine(buffer);
  }

  return { outputText: outputText.trim(), requestId, errorDetail };
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

type AgentStage = "multimodal" | "theater" | "constellation";
type AgentSpeedProfile = "quality" | "fast";
type AgentTransportPreference = "stream_first" | "json_first";
type AgentStageProfile = {
  maxOutputTokens?: number;
  reasoningEffort?: AgentReasoningEffort;
  timeoutMs?: number;
  transport?: AgentTransportPreference;
  allowSecondaryAttempts?: boolean;
};

type ProviderAttemptResult = {
  parsed: unknown | null;
  requestId?: string;
  error?: string;
  status?: number;
};

const AGENT_STAGE_PROFILES: Record<AgentSpeedProfile, Record<AgentStage, AgentStageProfile>> = {
  quality: {
    multimodal: {},
    theater: {},
    constellation: {
      timeoutMs: 90000,
      transport: "json_first",
      allowSecondaryAttempts: false,
    },
  },
  fast: {
    multimodal: {
      maxOutputTokens: 1100,
      reasoningEffort: "xhigh",
      timeoutMs: 60000,
      transport: "json_first",
      allowSecondaryAttempts: false,
    },
    theater: {
      maxOutputTokens: 2600,
      reasoningEffort: "xhigh",
      timeoutMs: 120000,
      transport: "json_first",
      allowSecondaryAttempts: false,
    },
    constellation: {
      maxOutputTokens: 3800,
      reasoningEffort: "xhigh",
      timeoutMs: 90000,
      transport: "json_first",
      allowSecondaryAttempts: true,
    },
  },
};

export function readBenyuanAgentSpeedProfile(): AgentSpeedProfile {
  return process.env.BENYUAN_AGENT_SPEED_PROFILE === "fast" ? "fast" : "quality";
}

function getAgentStageProfile(stage: AgentStage) {
  return AGENT_STAGE_PROFILES[readBenyuanAgentSpeedProfile()][stage];
}

function resolveRuntime(override?: AgentRuntimeOverride) {
  return readBenyuanAgentRuntime(override);
}

type LiveAgentRuntime = ReturnType<typeof resolveRuntime> & { baseUrl: string };

function withRequestTimeout(runtime: LiveAgentRuntime, timeoutMs?: number): LiveAgentRuntime {
  if (!timeoutMs) return runtime;
  return {
    ...runtime,
    timeoutMs: Math.min(runtime.timeoutMs, timeoutMs),
  };
}

function isKnownStreamOnlyResponsesRuntime(runtime: { providerName: string; baseUrl: string }) {
  return runtime.providerName === "crs" || /soxio\.me\/openai/i.test(runtime.baseUrl);
}

function isKnownChatUnsupportedRuntime(runtime: { providerName: string; baseUrl: string }) {
  return isKnownStreamOnlyResponsesRuntime(runtime);
}

async function readErrorDetail(response: Response) {
  const raw = (await response.text()).trim();
  if (!raw) return undefined;

  try {
    const payload = JSON.parse(raw) as unknown;
    if (isRecord(payload)) {
      if (typeof payload.detail === "string") return payload.detail;
      if (isRecord(payload.detail) && typeof payload.detail.code === "string") return payload.detail.code;
      if (typeof payload.error === "string") return payload.error;
      if (isRecord(payload.error) && typeof payload.error.code === "string") return payload.error.code;
      if (isRecord(payload.error) && typeof payload.error.message === "string") return payload.error.message;
    }
  } catch {
    // fall through to raw body snippet
  }

  return raw.slice(0, 160);
}

function formatStatusError(prefix: string, status: number, detail?: string) {
  return detail ? `${prefix}_${status}:${detail}` : `${prefix}_${status}`;
}

function snippet(value: string, maxLength = 160) {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > maxLength ? compact.slice(0, maxLength) : compact;
}

function looksLikeHtmlResponse(value: string | undefined) {
  if (!value) return false;
  return /<(!doctype|html|head|body|center|title)\b/i.test(value);
}

function formatParseError(prefix: string, outputText: string, errorDetail?: string) {
  if (errorDetail) return formatEventError(prefix, errorDetail);
  if (looksLikeHtmlResponse(outputText)) {
    return `${prefix}_parse_failed_html:${snippet(outputText)}`;
  }
  return `${prefix}_parse_failed`;
}

function isTransientProviderAttemptFailure(result: ProviderAttemptResult) {
  if (result.parsed) return false;
  if (typeof result.status === "number" && [408, 429, 500, 502, 503, 504, 520, 521, 522, 524].includes(result.status)) {
    return true;
  }

  const error = result.error?.toLocaleLowerCase("en-US") ?? "";
  return [
    "bad gateway",
    "gateway timeout",
    "service unavailable",
    "temporarily unavailable",
    "too many requests",
    "nginx",
    "upstream",
    "fetch failed",
    "econnreset",
    "socket hang up",
    "parse_failed_html",
    "unexpected token '<'",
    "<!doctype",
    "<html",
  ].some((marker) => error.includes(marker));
}

async function retryProviderAttempt<T extends ProviderAttemptResult>(
  runAttempt: () => Promise<T>,
  options: { maxAttempts?: number; backoffMs?: number[]; marker?: string } = {},
) {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 2);
  const backoffMs = options.backoffMs ?? [1200];
  const marker = options.marker ?? "provider_transient_retry";
  const retryErrors: string[] = [];

  for (let attemptIndex = 1; attemptIndex <= maxAttempts; attemptIndex += 1) {
    const result = await runAttempt().catch((error) => ({
      parsed: null,
      requestId: undefined,
      error: error instanceof Error ? error.message : "provider_request_failed",
      status: undefined,
    }) as T);
    const canRetry = attemptIndex < maxAttempts && isTransientProviderAttemptFailure(result);
    if (!canRetry) {
      if (!result.parsed && retryErrors.length > 0) {
        return {
          ...result,
          error: appendError(retryErrors.join(" | "), result.error),
        };
      }
      return result;
    }

    retryErrors.push(`${marker}_${attemptIndex}:${result.error ?? `status_${result.status ?? "unknown"}`}`);
    await wait(backoffMs[Math.min(attemptIndex - 1, backoffMs.length - 1)] ?? 1200);
  }

  return runAttempt();
}

async function attemptResponsesStreamJson(params: {
  runtime: LiveAgentRuntime;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  errorPrefix: string;
}) {
  return retryProviderAttempt(async () => {
    const response = await fetchWithTimeout(joinBaseUrl(params.runtime.baseUrl, "responses"), {
      method: "POST",
      headers: { ...params.headers, Accept: "text/event-stream" },
      body: JSON.stringify(params.body),
    }, params.runtime.timeoutMs);

    if (!response.ok) {
      const detail = await readErrorDetail(response);
      return {
        parsed: null,
        requestId: undefined,
        error: formatStatusError(params.errorPrefix, response.status, detail),
        status: response.status,
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (/text\/html/i.test(contentType)) {
      const rawText = await response.text();
      return {
        parsed: null,
        requestId: undefined,
        error: formatParseError(params.errorPrefix, rawText),
        status: response.status,
      };
    }

    const { outputText, requestId, errorDetail } = await readSsePayload(response);
    const parsed = extractJsonObject(outputText);
    return {
      parsed,
      requestId,
      error: parsed ? undefined : formatParseError(params.errorPrefix, outputText, errorDetail),
      status: response.status,
    };
  }).catch((error) => {
    return {
      parsed: null,
      requestId: undefined,
      error: error instanceof Error ? error.message : `${params.errorPrefix}_request_failed`,
      status: undefined,
    };
  });
}

async function attemptResponsesJson(params: {
  runtime: LiveAgentRuntime;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  errorPrefix: string;
}) {
  return retryProviderAttempt(async () => {
    const response = await fetchWithTimeout(joinBaseUrl(params.runtime.baseUrl, "responses"), {
      method: "POST",
      headers: params.headers,
      body: JSON.stringify(params.body),
    }, params.runtime.timeoutMs);

    if (!response.ok) {
      const detail = await readErrorDetail(response);
      return {
        parsed: null,
        requestId: undefined,
        error: formatStatusError(params.errorPrefix, response.status, detail),
        status: response.status,
      };
    }

    const rawText = await response.text();
    const payload = parseProviderJsonOrSsePayload(rawText);
    const parsed = payload.parsed;

    return {
      parsed,
      requestId: payload.requestId,
      error: parsed ? undefined : formatParseError(params.errorPrefix, payload.outputText, payload.errorDetail),
      status: response.status,
    };
  }).catch((error) => {
    return {
      parsed: null,
      requestId: undefined,
      error: error instanceof Error ? error.message : `${params.errorPrefix}_request_failed`,
      status: undefined,
    };
  });
}

async function requestAgentJson(params: {
  system: string;
  user: string;
  runtimeOverride?: AgentRuntimeOverride;
  maxOutputTokens?: number;
  reasoningEffort?: AgentReasoningEffort;
  timeoutMs?: number;
  transport?: AgentTransportPreference;
  allowSecondaryAttempts?: boolean;
}) {
  const runtime = resolveRuntime(params.runtimeOverride);
  if (!runtime.available || !runtime.apiKey || !runtime.baseUrl) {
    return { data: null, runtime: { provider: runtime.providerName, model: runtime.model, mode: "fallback" as const } };
  }

  const liveRuntime = withRequestTimeout({ ...runtime, baseUrl: runtime.baseUrl } as LiveAgentRuntime, params.timeoutMs);
  const headers = {
    Authorization: `Bearer ${runtime.apiKey}`,
    "Content-Type": "application/json",
  };
  const streamOnlyResponses = isKnownStreamOnlyResponsesRuntime(liveRuntime);
  const transport = streamOnlyResponses ? "stream_first" : params.transport ?? "stream_first";
  const allowSecondaryAttempts = params.allowSecondaryAttempts ?? true;
  const chatCompatibilityKey = getChatCompatibilityKey({ providerName: runtime.providerName, model: runtime.model, baseUrl: liveRuntime.baseUrl });
  const chatUnsupported = chatUnsupportedRuntimes.has(chatCompatibilityKey) || isKnownChatUnsupportedRuntime(liveRuntime);

  const buildResponsesBody = (stream: boolean, overrides?: { maxOutputTokens?: number; reasoningEffort?: AgentReasoningEffort }) => ({
    model: runtime.model,
    stream,
    store: !runtime.disableStorage,
    text: { format: { type: "text" } },
    reasoning: { effort: overrides?.reasoningEffort ?? params.reasoningEffort ?? runtime.reasoningEffort },
    max_output_tokens: overrides?.maxOutputTokens ?? params.maxOutputTokens ?? 4000,
    input: [
      { role: "system", content: [{ type: "input_text", text: params.system }] },
      { role: "user", content: [{ type: "input_text", text: params.user }] },
    ],
  });

  const liveResult = (requestId?: string) => ({
    provider: runtime.providerName,
    model: runtime.model,
    mode: "live" as const,
    request_id: requestId,
  });
  const fallbackResult = (error?: string) => ({
    data: null,
    runtime: {
      provider: runtime.providerName,
      model: runtime.model,
      mode: "fallback" as const,
      error,
    },
  });

  let responsesError: string | undefined;

  const tryResponsesJson = async () => {
    const jsonAttempt = await attemptResponsesJson({
      runtime: liveRuntime,
      headers,
      body: buildResponsesBody(false),
      errorPrefix: "responses_json_failed",
    });
    if (jsonAttempt.parsed) {
      return {
        data: jsonAttempt.parsed,
        runtime: liveResult(jsonAttempt.requestId),
      };
    }
    responsesError = appendError(responsesError, jsonAttempt.error);
    return null;
  };

  const tryResponsesStream = async () => {
    const streamAttempt = await attemptResponsesStreamJson({
      runtime: liveRuntime,
      headers,
      body: buildResponsesBody(true),
      errorPrefix: "responses_stream_failed",
    });
    if (streamAttempt.parsed) {
      return {
        data: streamAttempt.parsed,
        runtime: liveResult(streamAttempt.requestId),
      };
    }
    responsesError = appendError(responsesError, streamAttempt.error);
    return null;
  };

  if (transport === "json_first" && !streamOnlyResponses) {
    const jsonResult = await tryResponsesJson();
    if (jsonResult) return jsonResult;
    if (!allowSecondaryAttempts) return fallbackResult(responsesError);
  }

  const streamResult = await tryResponsesStream();
  if (streamResult) return streamResult;
  if (!allowSecondaryAttempts) return fallbackResult(responsesError);

  if (streamOnlyResponses) {
    const compactAttempt = await attemptResponsesStreamJson({
      runtime: liveRuntime,
      headers,
      body: buildResponsesBody(true, {
        maxOutputTokens: Math.min(params.maxOutputTokens ?? 4000, 3200),
        reasoningEffort: "low",
      }),
      errorPrefix: "responses_stream_compact_failed",
    });
    if (compactAttempt.parsed) {
      return {
        data: compactAttempt.parsed,
        runtime: liveResult(compactAttempt.requestId),
      };
    }
    responsesError = appendError(responsesError, compactAttempt.error);

    await wait(1800);
    const rescueAttempt = await attemptResponsesStreamJson({
      runtime: liveRuntime,
      headers,
      body: buildResponsesBody(true, {
        maxOutputTokens: Math.min(params.maxOutputTokens ?? 4000, 2600),
        reasoningEffort: "low",
      }),
      errorPrefix: "responses_stream_rescue_failed",
    });
    if (rescueAttempt.parsed) {
      return {
        data: rescueAttempt.parsed,
        runtime: liveResult(rescueAttempt.requestId),
      };
    }
    responsesError = appendError(responsesError, rescueAttempt.error);
    responsesError = appendError(responsesError, "responses_json_skipped_stream_only");
  } else if (transport === "stream_first") {
    const jsonResult = await tryResponsesJson();
    if (jsonResult) return jsonResult;
  }

  if (chatUnsupported) {
    chatUnsupportedRuntimes.add(chatCompatibilityKey);
    return fallbackResult(appendError(responsesError, "chat_completions_skipped_unsupported"));
  }

  try {
    const response = await fetchWithTimeout(joinBaseUrl(liveRuntime.baseUrl, "chat/completions"), {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: runtime.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
      }),
    }, liveRuntime.timeoutMs);

    if (!response.ok) {
      const detail = await readErrorDetail(response);
      if (response.status === 404) {
        chatUnsupportedRuntimes.add(chatCompatibilityKey);
      }

      return {
        data: null,
        runtime: {
          provider: runtime.providerName,
          model: runtime.model,
          mode: "fallback" as const,
          error: appendError(responsesError, formatStatusError("chat_completions_failed", response.status, detail)),
        },
      };
    }

    const payload = await response.json();
    const rawText = readChatText(payload);
    const parsed = extractJsonObject(rawText) ?? (isRecord(payload) ? payload : null);

    return {
      data: parsed,
      runtime: {
        provider: runtime.providerName,
        model: runtime.model,
        mode: parsed ? ("live" as const) : ("fallback" as const),
        request_id: isRecord(payload) && typeof payload.id === "string" ? payload.id : undefined,
        error: parsed ? responsesError : appendError(responsesError, "chat_completions_parse_failed"),
      },
    };
  } catch (error) {
    return {
      data: null,
      runtime: {
        provider: runtime.providerName,
        model: runtime.model,
        mode: "fallback" as const,
        error: appendError(responsesError, error instanceof Error ? error.message : "chat_completions_request_failed"),
      },
    };
  }
}


async function resolveMultimodalImages(items: MultimodalInputItem[] = [], limit = 1) {
  const resolved = await Promise.all(
    items
      .filter((item) => typeof item.asset_id === "string" && item.asset_id.length > 0)
      .slice(0, limit)
      .map(async (item) => {
        const loaded = await readUploadedAssetDataUrl(item.asset_id as string);
        if (!loaded) return null;
        return {
          label: item.file_name ?? item.source ?? loaded.stored.name,
          dataUrl: loaded.dataUrl,
        };
      }),
  );

  return resolved.filter((item): item is { label: string; dataUrl: string } => Boolean(item));
}

async function requestMultimodalJson(params: {
  system: string;
  user: string;
  musicInputs?: MultimodalInputItem[];
  socialInputs?: MultimodalInputItem[];
  photoInput?: MultimodalInputItem;
  runtimeOverride?: AgentRuntimeOverride;
  maxOutputTokens?: number;
  reasoningEffort?: AgentReasoningEffort;
  timeoutMs?: number;
  transport?: AgentTransportPreference;
  allowSecondaryAttempts?: boolean;
}) {
  const runtime = resolveRuntime(params.runtimeOverride);
  if (!runtime.available || !runtime.apiKey || !runtime.baseUrl) {
    return { data: null, runtime: { provider: runtime.providerName, model: runtime.model, mode: "fallback" as const } };
  }

  const musicImages = await resolveMultimodalImages(params.musicInputs, 1);
  const socialImages = await resolveMultimodalImages(params.socialInputs, 1);
  const photoImages = params.photoInput ? await resolveMultimodalImages([params.photoInput], 1) : [];
  const imageBlocks = [
    ...musicImages.map((item) => ({ category: "music", ...item })),
    ...socialImages.map((item) => ({ category: "social", ...item })),
    ...photoImages.map((item) => ({ category: "photo", ...item })),
  ];

  if (imageBlocks.length === 0) {
    return requestAgentJson({
      system: params.system,
      user: params.user,
      runtimeOverride: params.runtimeOverride,
      maxOutputTokens: params.maxOutputTokens,
      reasoningEffort: params.reasoningEffort,
      timeoutMs: params.timeoutMs,
      transport: params.transport,
      allowSecondaryAttempts: params.allowSecondaryAttempts,
    });
  }

  const liveRuntime = withRequestTimeout({ ...runtime, baseUrl: runtime.baseUrl } as LiveAgentRuntime, params.timeoutMs);
  const headers = {
    Authorization: `Bearer ${runtime.apiKey}`,
    "Content-Type": "application/json",
  };
  const streamOnlyResponses = isKnownStreamOnlyResponsesRuntime(liveRuntime);
  const transport = streamOnlyResponses ? "stream_first" : params.transport ?? "stream_first";
  const allowSecondaryAttempts = params.allowSecondaryAttempts ?? true;
  const multimodalChatCompatibilityKey = getChatCompatibilityKey({ providerName: runtime.providerName, model: runtime.model, baseUrl: liveRuntime.baseUrl });
  const chatUnsupported = chatUnsupportedRuntimes.has(multimodalChatCompatibilityKey) || isKnownChatUnsupportedRuntime(liveRuntime);

  const defaultMultimodalMaxOutputTokens = streamOnlyResponses
    ? Math.min(params.maxOutputTokens ?? 2400, 900)
    : params.maxOutputTokens ?? 2400;
  const buildResponsesBody = (
    stream: boolean,
    overrides?: {
      maxOutputTokens?: number;
      reasoningEffort?: AgentReasoningEffort;
      systemText?: string;
      userText?: string;
    },
  ) => ({
    model: runtime.model,
    stream,
    store: !runtime.disableStorage,
    text: { format: { type: "text" } },
    reasoning: { effort: overrides?.reasoningEffort ?? params.reasoningEffort ?? runtime.reasoningEffort },
    max_output_tokens: overrides?.maxOutputTokens ?? defaultMultimodalMaxOutputTokens,
    input: [
      { role: "system", content: [{ type: "input_text", text: overrides?.systemText ?? params.system }] },
      {
        role: "user",
        content: [
          { type: "input_text", text: overrides?.userText ?? params.user },
          ...imageBlocks.flatMap((item) => [
            { type: "input_text", text: `[${item.category}] ${item.label}` },
            { type: "input_image", image_url: item.dataUrl },
          ]),
        ],
      },
    ],
  });

  const liveResult = (requestId?: string) => ({
    provider: runtime.providerName,
    model: runtime.model,
    mode: "live" as const,
    request_id: requestId,
  });
  const fallbackResult = (error?: string) => ({
    data: null,
    runtime: {
      provider: runtime.providerName,
      model: runtime.model,
      mode: "fallback" as const,
      error,
    },
  });

  let responsesError: string | undefined;
  const tryResponsesJson = async () => {
    const jsonAttempt = await attemptResponsesJson({
      runtime: liveRuntime,
      headers,
      body: buildResponsesBody(false),
      errorPrefix: "multimodal_responses_json_failed",
    });
    if (jsonAttempt.parsed) {
      return {
        data: jsonAttempt.parsed,
        runtime: liveResult(jsonAttempt.requestId),
      };
    }
    responsesError = appendError(responsesError, jsonAttempt.error);
    return null;
  };

  const tryResponsesStream = async () => {
    const streamAttempt = await attemptResponsesStreamJson({
      runtime: liveRuntime,
      headers,
      body: buildResponsesBody(true),
      errorPrefix: "multimodal_responses_stream_failed",
    });
    if (streamAttempt.parsed) {
      return {
        data: streamAttempt.parsed,
        runtime: liveResult(streamAttempt.requestId),
      };
    }
    responsesError = appendError(responsesError, streamAttempt.error);
    return null;
  };

  if (streamOnlyResponses) {
    const streamAttempts = [
      {
        errorPrefix: "multimodal_responses_stream_failed",
        delayMs: 0,
        body: buildResponsesBody(true, {
          maxOutputTokens: defaultMultimodalMaxOutputTokens,
          reasoningEffort: "low",
          systemText: STREAM_ONLY_MULTIMODAL_SYSTEM_PROMPT,
          userText: STREAM_ONLY_MULTIMODAL_USER_PROMPT,
        }),
      },
      {
        errorPrefix: "multimodal_responses_stream_retry_failed",
        delayMs: 1200,
        body: buildResponsesBody(true, {
          maxOutputTokens: Math.min(defaultMultimodalMaxOutputTokens, 720),
          reasoningEffort: "low",
          systemText: STREAM_ONLY_MULTIMODAL_SYSTEM_PROMPT,
          userText: `${STREAM_ONLY_MULTIMODAL_USER_PROMPT} ${STREAM_ONLY_MULTIMODAL_RESCUE_PROMPT}`,
        }),
      },
      {
        errorPrefix: "multimodal_responses_stream_rescue_failed",
        delayMs: 2200,
        body: buildResponsesBody(true, {
          maxOutputTokens: 620,
          reasoningEffort: "low",
          systemText: STREAM_ONLY_MULTIMODAL_SYSTEM_PROMPT,
          userText: STREAM_ONLY_MULTIMODAL_RESCUE_PROMPT,
        }),
      },
    ] as const;

    const attemptsToRun = allowSecondaryAttempts ? streamAttempts : streamAttempts.slice(0, 1);
    for (const attempt of attemptsToRun) {
      if (attempt.delayMs > 0) {
        await wait(attempt.delayMs);
      }
      const streamAttempt = await attemptResponsesStreamJson({
        runtime: liveRuntime,
        headers,
        body: attempt.body,
        errorPrefix: attempt.errorPrefix,
      });
      if (streamAttempt.parsed) {
        return {
          data: streamAttempt.parsed,
          runtime: {
            provider: runtime.providerName,
            model: runtime.model,
            mode: "live" as const,
            request_id: streamAttempt.requestId,
          },
        };
      }
      responsesError = appendError(responsesError, streamAttempt.error);
    }

    responsesError = appendError(responsesError, "multimodal_responses_json_skipped_stream_only");
  } else {
    if (transport === "json_first") {
      const jsonResult = await tryResponsesJson();
      if (jsonResult) return jsonResult;
      if (!allowSecondaryAttempts) return fallbackResult(responsesError);
    }

    const streamResult = await tryResponsesStream();
    if (streamResult) return streamResult;
    if (!allowSecondaryAttempts) return fallbackResult(responsesError);

    if (transport === "stream_first") {
      const jsonResult = await tryResponsesJson();
      if (jsonResult) return jsonResult;
    }
  }

  if (chatUnsupported) {
    chatUnsupportedRuntimes.add(multimodalChatCompatibilityKey);
    return fallbackResult(appendError(responsesError, "multimodal_chat_skipped_unsupported"));
  }

  try {
    const response = await fetchWithTimeout(joinBaseUrl(liveRuntime.baseUrl, "chat/completions"), {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: runtime.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: params.system },
          {
            role: "user",
            content: [
              { type: "text", text: params.user },
              ...imageBlocks.flatMap((item) => [
                { type: "text", text: `[${item.category}] ${item.label}` },
                { type: "image_url", image_url: { url: item.dataUrl } },
              ]),
            ],
          },
        ],
      }),
    }, liveRuntime.timeoutMs);

    if (!response.ok) {
      const detail = await readErrorDetail(response);
      if (response.status === 404) {
        chatUnsupportedRuntimes.add(multimodalChatCompatibilityKey);
      }

      return {
        data: null,
        runtime: {
          provider: runtime.providerName,
          model: runtime.model,
          mode: "fallback" as const,
          error: appendError(responsesError, formatStatusError("multimodal_chat_failed", response.status, detail)),
        },
      };
    }

    const payload = await response.json();
    const rawText = readChatText(payload);
    const parsed = extractJsonObject(rawText) ?? (isRecord(payload) ? payload : null);

    return {
      data: parsed,
      runtime: {
        provider: runtime.providerName,
        model: runtime.model,
        mode: parsed ? ("live" as const) : ("fallback" as const),
        request_id: isRecord(payload) && typeof payload.id === "string" ? payload.id : undefined,
        error: parsed ? responsesError : appendError(responsesError, "multimodal_chat_parse_failed"),
      },
    };
  } catch (error) {
    return {
      data: null,
      runtime: {
        provider: runtime.providerName,
        model: runtime.model,
        mode: "fallback" as const,
        error: appendError(responsesError, error instanceof Error ? error.message : "multimodal_chat_request_failed"),
      },
    };
  }
}


export function normalizeTheaterScript(candidate: unknown, fallback: TheaterScript): TheaterScript | null {
  const source = isRecord(candidate) && isRecord(candidate.theater_script) ? candidate.theater_script : candidate;
  if (!isRecord(source)) return null;

  const act2 = isRecord(source.act2) ? source.act2 : {};
  const act3 = isRecord(source.act3) ? source.act3 : {};
  const liveChoices = Array.isArray(act2.choices) ? act2.choices : [];
  const liveQuestions = Array.isArray(act3.mirror_questions) ? act3.mirror_questions : [];
  const personalizationSummary = isRecord(source.personalization_summary) ? source.personalization_summary : {};
  const sourceCoreArchetype =
    typeof personalizationSummary.core_archetype === "string"
      ? personalizationSummary.core_archetype
      : fallback.personalization_summary.core_archetype;

  return {
    user_id: typeof source.user_id === "string" ? source.user_id : fallback.user_id,
    generated_at: typeof source.generated_at === "string" ? source.generated_at : fallback.generated_at,
    personalization_summary: {
      core_archetype: isSuspiciousArchetypeName(sourceCoreArchetype) ? fallback.personalization_summary.core_archetype : sourceCoreArchetype,
      aesthetic_style:
        typeof personalizationSummary.aesthetic_style === "string"
          ? personalizationSummary.aesthetic_style
          : fallback.personalization_summary.aesthetic_style,
      emotional_tone:
        typeof personalizationSummary.emotional_tone === "string"
          ? personalizationSummary.emotional_tone
          : fallback.personalization_summary.emotional_tone,
      key_themes:
        Array.isArray(personalizationSummary.key_themes)
          ? personalizationSummary.key_themes.filter((item): item is string => typeof item === "string")
          : fallback.personalization_summary.key_themes,
    },
    act1: {
      scene_description:
        isRecord(source.act1) && typeof source.act1.scene_description === "string"
          ? source.act1.scene_description
          : fallback.act1.scene_description,
      visual_prompt:
        isRecord(source.act1) && typeof source.act1.visual_prompt === "string" ? source.act1.visual_prompt : fallback.act1.visual_prompt,
      ambient_sound:
        isRecord(source.act1) && typeof source.act1.ambient_sound === "string" ? source.act1.ambient_sound : fallback.act1.ambient_sound,
      duration:
        isRecord(source.act1) && typeof source.act1.duration === "number" ? source.act1.duration : fallback.act1.duration,
    },
    act2: {
      choices: (liveChoices.length > 0 ? liveChoices : fallback.act2.choices).map((choice, index) => {
        const fallbackChoice = fallback.act2.choices[index] ?? fallback.act2.choices[fallback.act2.choices.length - 1];
        const choiceRecord = isRecord(choice) ? choice : {};
        const options = Array.isArray(choiceRecord.options) ? choiceRecord.options : fallbackChoice.options;
        return {
          choice_id: index + 1,
          scene: typeof choiceRecord.scene === "string" ? choiceRecord.scene : typeof choiceRecord.prompt === "string" ? choiceRecord.prompt : fallbackChoice.scene,
          options: options.map((option, optionIndex) => {
            const fallbackOption = fallbackChoice.options[optionIndex] ?? fallbackChoice.options[fallbackChoice.options.length - 1];
            if (!isRecord(option)) {
              return { ...fallbackOption, id: `${index + 1}${String.fromCharCode(65 + optionIndex)}`, text: typeof option === "string" ? option : fallbackOption.text };
            }
            return {
              id:
                typeof option.id === "string"
                  ? option.id
                  : typeof option.option_id === "string"
                    ? `${index + 1}${option.option_id}`
                    : fallbackOption.id,
              text: typeof option.text === "string" ? option.text : fallbackOption.text,
              trait_signal: typeof option.trait_signal === "string" ? option.trait_signal : fallbackOption.trait_signal,
              response: typeof option.response === "string" ? option.response : fallbackOption.response,
            };
          }),
        };
      }),
    },
    act3: {
      scene_description:
        isRecord(source.act3) && typeof source.act3.scene_description === "string"
          ? source.act3.scene_description
          : fallback.act3.scene_description,
      mirror_questions: dedupeMirrorQuestions((liveQuestions.length > 0 ? liveQuestions : fallback.act3.mirror_questions).map((question, index) => {
        const fallbackQuestion = fallback.act3.mirror_questions[index] ?? fallback.act3.mirror_questions[fallback.act3.mirror_questions.length - 1];
        const questionRecord = isRecord(question) ? question : {};
        const options = Array.isArray(questionRecord.options) ? questionRecord.options : fallbackQuestion.options;
        return {
          question_id: index + 1,
          dialogue: typeof questionRecord.dialogue === "string" ? questionRecord.dialogue : fallbackQuestion.dialogue,
          question: typeof questionRecord.question === "string" ? questionRecord.question : fallbackQuestion.question,
          options: options.map((option, optionIndex) => {
            const fallbackOption = fallbackQuestion.options[optionIndex] ?? fallbackQuestion.options[fallbackQuestion.options.length - 1];
            if (!isRecord(option)) {
              return { ...fallbackOption, id: `3${String.fromCharCode(65 + index)}-${optionIndex + 1}`, text: typeof option === "string" ? option : fallbackOption.text };
            }
            return {
              id:
                typeof option.id === "string"
                  ? option.id
                  : typeof option.option_id === "string"
                    ? `3${String.fromCharCode(65 + index)}-${option.option_id}`
                    : fallbackOption.id,
              text: typeof option.text === "string" ? option.text : fallbackOption.text,
              trait_signal: typeof option.trait_signal === "string" ? option.trait_signal : fallbackOption.trait_signal,
            };
          }),
        };
      }), fallback.act3.mirror_questions),
      mirror_final_words:
        isRecord(source.act3) && typeof source.act3.mirror_final_words === "string"
          ? source.act3.mirror_final_words
          : fallback.act3.mirror_final_words,
    },
    epilogue: {
      scene_description:
        isRecord(source.epilogue) && typeof source.epilogue.scene_description === "string"
          ? source.epilogue.scene_description
          : isRecord(source.epilogue) && typeof source.epilogue.text === "string"
            ? source.epilogue.text
            : fallback.epilogue.scene_description,
      closing_text:
        isRecord(source.epilogue) && typeof source.epilogue.closing_text === "string"
          ? source.epilogue.closing_text
          : isRecord(source.epilogue) && typeof source.epilogue.closing_image === "string"
            ? source.epilogue.closing_image
            : fallback.epilogue.closing_text,
      transition_prompt:
        isRecord(source.epilogue) && typeof source.epilogue.transition_prompt === "string"
          ? source.epilogue.transition_prompt
          : fallback.epilogue.transition_prompt,
      transition_animation:
        isRecord(source.epilogue) && typeof source.epilogue.transition_animation === "string"
          ? source.epilogue.transition_animation
          : fallback.epilogue.transition_animation,
    },
  };
}

function normalizeBookRecommendations(source: unknown, fallback: PsycheConstellation["recommendations"]["books"]) {
  if (!Array.isArray(source)) return fallback;
  const normalized = source
    .map((item, index) => {
      const fallbackItem = fallback[index] ?? fallback[fallback.length - 1];
      if (!fallbackItem || !isRecord(item)) return null;
      const title = typeof item.title === "string" ? item.title : fallbackItem.title;
      const author =
        typeof item.author === "string"
          ? item.author
          : typeof item.creator === "string"
            ? item.creator
            : fallbackItem.author;
      const reason = typeof item.reason === "string" ? item.reason : fallbackItem.reason;
      return title && author && reason ? { title, author, reason } : null;
    })
    .filter((item): item is PsycheConstellation["recommendations"]["books"][number] => Boolean(item));
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeFilmRecommendations(source: unknown, fallback: PsycheConstellation["recommendations"]["films"]) {
  if (!Array.isArray(source)) return fallback;
  const normalized = source
    .map((item, index) => {
      const fallbackItem = fallback[index] ?? fallback[fallback.length - 1];
      if (!fallbackItem || !isRecord(item)) return null;
      const title = typeof item.title === "string" ? item.title : fallbackItem.title;
      const director =
        typeof item.director === "string"
          ? item.director
          : typeof item.creator === "string"
            ? item.creator
            : fallbackItem.director;
      const reason = typeof item.reason === "string" ? item.reason : fallbackItem.reason;
      return title && director && reason ? { title, director, reason } : null;
    })
    .filter((item): item is PsycheConstellation["recommendations"]["films"][number] => Boolean(item));
  return normalized.length > 0 ? normalized : fallback;
}

function splitArtistAlbumCandidate(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  const match = cleaned.match(/^(.+?)\s[-–—]\s(.+)$/u);
  if (!match) return null;

  const artist = match[1]?.trim();
  const album = match[2]?.trim();
  return artist && album ? { artist, album } : null;
}

function normalizeMusicRecommendations(source: unknown, fallback: PsycheConstellation["recommendations"]["music"]) {
  if (!Array.isArray(source)) return fallback;
  const normalized = source
    .map((item, index) => {
      const fallbackItem = fallback[index] ?? fallback[fallback.length - 1];
      if (!fallbackItem || !isRecord(item)) return null;

      const explicitArtist =
        typeof item.artist === "string"
          ? item.artist.trim()
          : typeof item.creator === "string"
            ? item.creator.trim()
            : "";
      const albumCandidate =
        typeof item.album === "string"
          ? item.album.trim()
          : typeof item.title === "string"
            ? item.title.trim()
            : "";
      const parsedCandidate = splitArtistAlbumCandidate(albumCandidate);
      const shouldUseParsedCandidate = Boolean(parsedCandidate && !explicitArtist);
      const artist = shouldUseParsedCandidate && parsedCandidate
        ? parsedCandidate.artist
        : explicitArtist || fallbackItem.artist;
      const album = shouldUseParsedCandidate && parsedCandidate
        ? parsedCandidate.album
        : albumCandidate || fallbackItem.album;
      const reason = typeof item.reason === "string" ? item.reason : fallbackItem.reason;
      return artist && album && reason ? { artist, album, reason } : null;
    })
    .filter((item): item is PsycheConstellation["recommendations"]["music"][number] => Boolean(item));
  return normalized.length > 0 ? normalized : fallback;
}

function normalizeConstellation(candidate: unknown, fallback: PsycheConstellation): PsycheConstellation | null {
  const source = isRecord(candidate) && isRecord(candidate.psyche_constellation) ? candidate.psyche_constellation : candidate;
  if (!isRecord(source)) return null;

  const sevenDimensions = isRecord(source.seven_dimensions) ? source.seven_dimensions : {};
  const recommendations = isRecord(source.recommendations) ? source.recommendations : {};

  return normalizePsycheConstellation({
    user_id: typeof source.user_id === "string" ? source.user_id : fallback.user_id,
    generated_at: typeof source.generated_at === "string" ? source.generated_at : fallback.generated_at,
    archetype: isRecord(source.archetype)
      ? {
          name: typeof source.archetype.name === "string" ? source.archetype.name : fallback.archetype.name,
          english_name: typeof source.archetype.english_name === "string" ? source.archetype.english_name : fallback.archetype.english_name,
          core_essence: typeof source.archetype.core_essence === "string" ? source.archetype.core_essence : fallback.archetype.core_essence,
          visual_prompt: typeof source.archetype.visual_prompt === "string" ? source.archetype.visual_prompt : fallback.archetype.visual_prompt,
        }
      : fallback.archetype,
    seven_dimensions: {
      openness: isRecord(sevenDimensions.openness) ? (sevenDimensions.openness as PsycheConstellation["seven_dimensions"]["openness"]) : fallback.seven_dimensions.openness,
      independence: isRecord(sevenDimensions.independence) ? (sevenDimensions.independence as PsycheConstellation["seven_dimensions"]["independence"]) : fallback.seven_dimensions.independence,
      emotional_depth: isRecord(sevenDimensions.emotional_depth) ? (sevenDimensions.emotional_depth as PsycheConstellation["seven_dimensions"]["emotional_depth"]) : fallback.seven_dimensions.emotional_depth,
      meaning_seeking: isRecord(sevenDimensions.meaning_seeking) ? (sevenDimensions.meaning_seeking as PsycheConstellation["seven_dimensions"]["meaning_seeking"]) : fallback.seven_dimensions.meaning_seeking,
      aesthetic_sensitivity: isRecord(sevenDimensions.aesthetic_sensitivity) ? (sevenDimensions.aesthetic_sensitivity as PsycheConstellation["seven_dimensions"]["aesthetic_sensitivity"]) : fallback.seven_dimensions.aesthetic_sensitivity,
      action_tendency: isRecord(sevenDimensions.action_tendency) ? (sevenDimensions.action_tendency as PsycheConstellation["seven_dimensions"]["action_tendency"]) : fallback.seven_dimensions.action_tendency,
      relationship_need: isRecord(sevenDimensions.relationship_need) ? (sevenDimensions.relationship_need as PsycheConstellation["seven_dimensions"]["relationship_need"]) : fallback.seven_dimensions.relationship_need,
    },
    narrative_overview: typeof source.narrative_overview === "string" ? source.narrative_overview : fallback.narrative_overview,
    core_tensions: Array.isArray(source.core_tensions)
      ? source.core_tensions.map((item, index) => {
          const fallbackItem = fallback.core_tensions[index] ?? fallback.core_tensions[fallback.core_tensions.length - 1];
          return isRecord(item)
            ? {
                tension_id: typeof item.tension_id === "number" ? item.tension_id : index + 1,
                name: typeof item.name === "string" ? item.name : fallbackItem.name,
                description: typeof item.description === "string" ? item.description : fallbackItem.description,
                growth_direction: typeof item.growth_direction === "string" ? item.growth_direction : fallbackItem.growth_direction,
              }
            : fallbackItem;
        })
      : fallback.core_tensions,
    growth_suggestions: Array.isArray(source.growth_suggestions)
      ? source.growth_suggestions.map((item, index) => {
          const fallbackItem = fallback.growth_suggestions[index] ?? fallback.growth_suggestions[fallback.growth_suggestions.length - 1];
          return isRecord(item)
            ? {
                title: typeof item.title === "string" ? item.title : fallbackItem.title,
                description: typeof item.description === "string" ? item.description : fallbackItem.description,
                actionable_steps: Array.isArray(item.actionable_steps)
                  ? item.actionable_steps.filter((step): step is string => typeof step === "string")
                  : fallbackItem.actionable_steps,
              }
            : fallbackItem;
        })
      : fallback.growth_suggestions,
    recommendations: {
      books: normalizeBookRecommendations(recommendations.books, fallback.recommendations.books),
      films: normalizeFilmRecommendations(recommendations.films, fallback.recommendations.films),
      music: normalizeMusicRecommendations(recommendations.music, fallback.recommendations.music),
    },
  });
}

function recommendationKey(item: { title?: string; author?: string; director?: string; artist?: string; album?: string }) {
  return [item.title, item.author, item.director, item.artist, item.album].filter(Boolean).join("::").toLocaleLowerCase("zh-CN");
}

function supplementRecommendations(preferred: PsycheConstellation["recommendations"], fallback: PsycheConstellation["recommendations"]) {
  const mergeItems = <T extends { title?: string; author?: string; director?: string; artist?: string; album?: string }>(items: T[], backup: T[], minCount: number) => {
    const next = [...items];
    const seen = new Set(next.map((item) => recommendationKey(item)));

    for (const item of backup) {
      const key = recommendationKey(item);
      if (seen.has(key)) continue;
      next.push(item);
      seen.add(key);
      if (next.length >= minCount) break;
    }

    return next;
  };

  return {
    books: mergeItems(preferred.books, fallback.books, Math.min(3, fallback.books.length || 2)),
    films: mergeItems(preferred.films, fallback.films, Math.min(3, fallback.films.length || 2)),
    music: mergeItems(preferred.music, fallback.music, Math.min(3, fallback.music.length || 2)),
  };
}

function supplementGrowthSuggestions(preferred: PsycheConstellation["growth_suggestions"], fallback: PsycheConstellation["growth_suggestions"]) {
  const next = [...preferred];
  const seen = new Set(next.map((item) => item.title.trim().toLocaleLowerCase("zh-CN")));

  for (const item of fallback) {
    const key = item.title.trim().toLocaleLowerCase("zh-CN");
    if (seen.has(key)) continue;
    next.push(item);
    seen.add(key);
    if (next.length >= 3) break;
  }

  return next;
}

function refineConstellationWithFallback(constellation: PsycheConstellation, fallback: PsycheConstellation) {
  const narrativeParagraphs = constellation.narrative_overview.split(/\n\n+/).filter((item) => item.trim().length > 0);
  const needsFallbackNarrative = constellation.narrative_overview.trim().length < 420 || narrativeParagraphs.length < 4;
  const needsFallbackArchetype = isSuspiciousArchetypeName(constellation.archetype.name) || constellation.archetype.core_essence.trim().length < 16;
  const needsFallbackTensions = constellation.core_tensions.length < 2;
  const needsFallbackGrowth = constellation.growth_suggestions.length < 3;
  const recommendations = supplementRecommendations(constellation.recommendations, fallback.recommendations);
  const recommendationTotal = recommendations.books.length + recommendations.films.length + recommendations.music.length;

  return normalizePsycheConstellation({
    ...constellation,
    archetype: needsFallbackArchetype ? fallback.archetype : constellation.archetype,
    narrative_overview: needsFallbackNarrative ? fallback.narrative_overview : constellation.narrative_overview,
    core_tensions: needsFallbackTensions ? fallback.core_tensions : constellation.core_tensions,
    growth_suggestions: needsFallbackGrowth ? supplementGrowthSuggestions(constellation.growth_suggestions, fallback.growth_suggestions) : constellation.growth_suggestions,
    recommendations: recommendationTotal < 6 ? fallback.recommendations : recommendations,
  });
}

function stringArray(value: unknown, fallback: string[]) {
  const next = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  return next.length > 0 ? next : fallback;
}

function numberRecord(value: unknown, fallback: Record<string, number>) {
  if (!isRecord(value)) return fallback;
  const next = Object.entries(value).reduce<Record<string, number>>((acc, [key, entry]) => {
    if (typeof entry === "number" && Number.isFinite(entry)) {
      acc[key] = entry;
    }
    return acc;
  }, {});
  return Object.keys(next).length > 0 ? next : fallback;
}

function stringRecord(value: unknown, fallback: Record<string, string>) {
  if (!isRecord(value)) return fallback;
  const next = Object.entries(value).reduce<Record<string, string>>((acc, [key, entry]) => {
    if (typeof entry === "string" && entry.trim().length > 0) {
      acc[key] = entry;
    }
    return acc;
  }, {});
  return Object.keys(next).length > 0 ? next : fallback;
}

function normalizeMusicAnalysis(candidate: unknown, fallback: MusicAnalysis): MusicAnalysis {
  if (!isRecord(candidate)) return fallback;

  return {
    primary_genres: stringArray(candidate.primary_genres, fallback.primary_genres),
    emotional_tone:
      typeof candidate.emotional_tone === "string"
        ? candidate.emotional_tone
        : typeof candidate.mood === "string"
          ? candidate.mood
          : fallback.emotional_tone,
    era_distribution: numberRecord(candidate.era_distribution, fallback.era_distribution),
    language_diversity: stringArray(candidate.language_diversity, fallback.language_diversity),
    personality_signals: stringRecord(candidate.personality_signals, fallback.personality_signals),
  };
}

function normalizeSocialPostItem(candidate: unknown, fallback: SocialPostAnalysis, index: number): SocialPostAnalysis {
  if (!isRecord(candidate)) return { ...fallback, post_id: fallback.post_id ?? index + 1 };

  return {
    post_id: typeof candidate.post_id === "number" ? candidate.post_id : fallback.post_id ?? index + 1,
    text_content:
      typeof candidate.text_content === "string"
        ? candidate.text_content
        : typeof candidate.text === "string"
          ? candidate.text
          : typeof candidate.caption === "string"
            ? candidate.caption
            : typeof candidate.visible_text === "string"
              ? candidate.visible_text
              : fallback.text_content,
    emotional_tone:
      typeof candidate.emotional_tone === "string"
        ? candidate.emotional_tone
        : typeof candidate.sentiment === "string"
          ? candidate.sentiment
          : fallback.emotional_tone,
    themes: stringArray(candidate.themes, fallback.themes),
    expression_style:
      typeof candidate.expression_style === "string"
        ? candidate.expression_style
        : typeof candidate.writing_style === "string"
          ? candidate.writing_style
          : fallback.expression_style,
    self_presentation:
      typeof candidate.self_presentation === "string"
        ? candidate.self_presentation
        : typeof candidate.self_representation === "string"
          ? candidate.self_representation
          : fallback.self_presentation,
    time_clue:
      typeof candidate.time_clue === "string"
        ? candidate.time_clue
        : typeof candidate.time_context === "string"
          ? candidate.time_context
          : fallback.time_clue,
    psychological_signals: stringArray(candidate.psychological_signals, fallback.psychological_signals),
  };
}

function normalizeSocialPosts(candidate: unknown, fallback: SocialPostAnalysis[]): SocialPostAnalysis[] {
  if (!Array.isArray(candidate) || candidate.length === 0) return fallback;
  return candidate.map((item, index) => normalizeSocialPostItem(item, fallback[index] ?? fallback[fallback.length - 1], index));
}

function normalizeSocialOverallPattern(candidate: unknown, fallback: SocialPostOverallPattern): SocialPostOverallPattern {
  if (!isRecord(candidate)) return fallback;

  return {
    dominant_emotion:
      typeof candidate.dominant_emotion === "string"
        ? candidate.dominant_emotion
        : typeof candidate.emotional_tone === "string"
          ? candidate.emotional_tone
          : fallback.dominant_emotion,
    core_themes: stringArray(candidate.core_themes, fallback.core_themes),
    expression_authenticity:
      typeof candidate.expression_authenticity === "string"
        ? candidate.expression_authenticity
        : typeof candidate.authenticity === "string"
          ? candidate.authenticity
          : fallback.expression_authenticity,
  };
}

function normalizePreciousPhotoAnalysis(candidate: unknown, fallback: PreciousPhotoAnalysis): PreciousPhotoAnalysis {
  if (!isRecord(candidate)) return fallback;

  const psychologicalInterpretation = isRecord(candidate.psychological_interpretation)
    ? candidate.psychological_interpretation
    : isRecord(candidate.psychological_analysis)
      ? candidate.psychological_analysis
      : isRecord(candidate.interpretation)
        ? candidate.interpretation
        : candidate;

  return {
    visual_content:
      typeof candidate.visual_content === "string"
        ? candidate.visual_content
        : typeof candidate.subject === "string"
          ? candidate.subject
          : fallback.visual_content,
    composition: typeof candidate.composition === "string" ? candidate.composition : fallback.composition,
    lighting: typeof candidate.lighting === "string" ? candidate.lighting : fallback.lighting,
    color_mood:
      typeof candidate.color_mood === "string"
        ? candidate.color_mood
        : typeof candidate.color_palette === "string"
          ? candidate.color_palette
          : fallback.color_mood,
    symbolic_elements: stringArray(candidate.symbolic_elements, fallback.symbolic_elements),
    psychological_interpretation: {
      core_themes: stringArray(psychologicalInterpretation.core_themes, fallback.psychological_interpretation.core_themes),
      emotional_tone:
        typeof psychologicalInterpretation.emotional_tone === "string"
          ? psychologicalInterpretation.emotional_tone
          : typeof psychologicalInterpretation.mood === "string"
            ? psychologicalInterpretation.mood
            : fallback.psychological_interpretation.emotional_tone,
      self_concept:
        typeof psychologicalInterpretation.self_concept === "string"
          ? psychologicalInterpretation.self_concept
          : typeof psychologicalInterpretation.identity === "string"
            ? psychologicalInterpretation.identity
            : fallback.psychological_interpretation.self_concept,
      existential_stance:
        typeof psychologicalInterpretation.existential_stance === "string"
          ? psychologicalInterpretation.existential_stance
          : typeof psychologicalInterpretation.existential_position === "string"
            ? psychologicalInterpretation.existential_position
            : fallback.psychological_interpretation.existential_stance,
      traits: stringArray(psychologicalInterpretation.traits, fallback.psychological_interpretation.traits),
    },
  };
}

function normalizeMultimodalResult(
  candidate: unknown,
  fallback: {
    music_analysis: MusicAnalysis;
    social_posts_analysis: SocialPostAnalysis[];
    social_posts_overall_pattern: SocialPostOverallPattern;
    precious_photo_analysis: PreciousPhotoAnalysis;
  },
) {
  const source = isRecord(candidate) && isRecord(candidate.multimodal_analysis)
    ? candidate.multimodal_analysis
    : isRecord(candidate) && isRecord(candidate.analysis)
      ? candidate.analysis
      : isRecord(candidate) && isRecord(candidate.result)
        ? candidate.result
        : candidate;

  if (!isRecord(source)) return null;

  return {
    music_analysis: normalizeMusicAnalysis(
      isRecord(source.music_analysis)
        ? source.music_analysis
        : isRecord(source.music)
          ? source.music
          : source,
      fallback.music_analysis,
    ),
    social_posts_analysis: normalizeSocialPosts(
      Array.isArray(source.social_posts_analysis)
        ? source.social_posts_analysis
        : Array.isArray(source.social_posts)
          ? source.social_posts
          : Array.isArray(source.social_analysis)
            ? source.social_analysis
            : [],
      fallback.social_posts_analysis,
    ),
    social_posts_overall_pattern: normalizeSocialOverallPattern(
      isRecord(source.social_posts_overall_pattern)
        ? source.social_posts_overall_pattern
        : isRecord(source.social_overall_pattern)
          ? source.social_overall_pattern
          : isRecord(source.social_summary)
            ? source.social_summary
            : {},
      fallback.social_posts_overall_pattern,
    ),
    precious_photo_analysis: normalizePreciousPhotoAnalysis(
      isRecord(source.precious_photo_analysis)
        ? source.precious_photo_analysis
        : isRecord(source.photo_analysis)
          ? source.photo_analysis
          : isRecord(source.precious_photo)
            ? source.precious_photo
            : {},
      fallback.precious_photo_analysis,
    ),
  };
}

export async function runMultimodalAnalysis(
  input: {
    music_inputs?: MultimodalInputItem[];
    social_post_inputs?: MultimodalInputItem[];
    precious_photo_input?: MultimodalInputItem;
  },
  runtimeOverride?: AgentRuntimeOverride,
): Promise<{
  result: {
    music_analysis: MusicAnalysis;
    social_posts_analysis: SocialPostAnalysis[];
    social_posts_overall_pattern: SocialPostOverallPattern;
    precious_photo_analysis: PreciousPhotoAnalysis;
  };
  runtime: AgentRuntimeResult;
}> {
  const fallback = {
    music_analysis: analyzeMusicInputs(input.music_inputs),
    ...(() => {
      const social = analyzeSocialPostInputs(input.social_post_inputs);
      return {
        social_posts_analysis: social.posts,
        social_posts_overall_pattern: social.overallPattern,
      };
    })(),
    precious_photo_analysis: analyzePreciousPhotoInput(input.precious_photo_input),
  };
  const profile = getAgentStageProfile("multimodal");

  const request = await requestMultimodalJson({
    system: MULTIMODAL_SYSTEM_PROMPT,
    user: buildMultimodalUserPrompt(input),
    musicInputs: input.music_inputs,
    socialInputs: input.social_post_inputs,
    photoInput: input.precious_photo_input,
    runtimeOverride,
    maxOutputTokens: profile.maxOutputTokens ?? 1600,
    reasoningEffort: runtimeOverride?.reasoning_effort ?? profile.reasoningEffort ?? "xhigh",
    timeoutMs: profile.timeoutMs,
    transport: profile.transport,
    allowSecondaryAttempts: profile.allowSecondaryAttempts,
  });

  const normalized = normalizeMultimodalResult(request.data, fallback);
  if (!normalized) {
    return { result: fallback, runtime: request.runtime };
  }

  return {
    result: normalized,
    runtime: request.runtime,
  };
}

export async function generateTheaterScriptWithAgent(record: Part1Record, runtimeOverride?: AgentRuntimeOverride): Promise<{ theaterScript: TheaterScript; runtime: AgentRuntimeResult }> {
  const fallback = generateDeterministicTheaterScript(record);
  const profile = getAgentStageProfile("theater");
  const request = await requestAgentJson({
    system: DIRECTOR_SYSTEM_PROMPT,
    user: buildDirectorUserPrompt(record),
    runtimeOverride,
    maxOutputTokens: profile.maxOutputTokens ?? 4200,
    reasoningEffort: runtimeOverride?.reasoning_effort ?? profile.reasoningEffort ?? "xhigh",
    timeoutMs: profile.timeoutMs,
    transport: profile.transport,
    allowSecondaryAttempts: profile.allowSecondaryAttempts,
  });

  const normalized = normalizeTheaterScript(request.data, fallback);
  if (!normalized) {
    return { theaterScript: fallback, runtime: request.runtime };
  }

  return { theaterScript: normalized, runtime: request.runtime };
}

export async function generateConstellationWithAgent(part1: Part1Record, part2: Part2Record, runtimeOverride?: AgentRuntimeOverride): Promise<{ constellation: PsycheConstellation; runtime: AgentRuntimeResult }> {
  const fallback = generateDeterministicConstellation(part1, part2);
  const profile = getAgentStageProfile("constellation");
  const request = await requestAgentJson({
    system: ANALYST_SYSTEM_PROMPT,
    user: buildAnalystUserPrompt(part1, part2, fallback),
    runtimeOverride,
    maxOutputTokens: profile.maxOutputTokens ?? 5600,
    reasoningEffort: runtimeOverride?.reasoning_effort ?? profile.reasoningEffort ?? "xhigh",
    timeoutMs: profile.timeoutMs,
    transport: profile.transport,
    allowSecondaryAttempts: profile.allowSecondaryAttempts,
  });

  const normalized = normalizeConstellation(request.data, fallback);
  if (!normalized) {
    return { constellation: fallback, runtime: request.runtime };
  }

  return { constellation: refineConstellationWithFallback(normalized, fallback), runtime: request.runtime };
}
