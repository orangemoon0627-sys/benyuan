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
import { readCodexProviderDefaults } from "@/lib/codex-runtime";
import type {
  AgentRuntimeOverride,
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

async function readSsePayload(response: Response) {
  if (!response.body) {
    const rawText = await response.text();
    return { outputText: rawText.trim(), requestId: undefined };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let outputText = "";
  let requestId: string | undefined;

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
        return true;
      }
      if (type === "response.completed" && outputText.trim().length > 0) {
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
        return { outputText: outputText.trim(), requestId };
      }
    }

    if (done) break;
  }

  if (buffer) {
    handleLine(buffer);
  }

  return { outputText: outputText.trim(), requestId };
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

function resolveRuntime(override?: AgentRuntimeOverride) {
  const runtime = readAnalysisRuntimeConfig("deep", { provider: "custom" });
  const codexDefaults = readCodexProviderDefaults();
  const apiKey = override?.api_key ?? process.env.OPENAI_API_KEY ?? codexDefaults.apiKey;
  const baseUrl = override?.base_url ?? runtime.customBaseUrl ?? codexDefaults.baseUrl;
  const model = override?.model ?? runtime.customModel ?? codexDefaults.model ?? "gpt-5.4";
  const providerName = override?.provider_name ?? runtime.customProviderName ?? codexDefaults.providerName ?? "custom";
  const reasoningEffort =
    override?.reasoning_effort ??
    (process.env.BENYUAN_CUSTOM_REASONING_EFFORT as "low" | "medium" | "high" | undefined) ??
    codexDefaults.reasoningEffort ??
    "high";
  const disableStorage = override?.disable_response_storage ?? codexDefaults.disableResponseStorage ?? true;
  const live = override?.live ?? (runtime.liveProviderEnabled || Boolean(codexDefaults.apiKey && codexDefaults.baseUrl));
  const available = Boolean(live && apiKey && baseUrl);
  const timeoutMs = Math.max(runtime.providerSoftTimeoutMs, Math.min(runtime.providerTimeoutMs, 120000));

  return {
    apiKey,
    baseUrl,
    model,
    providerName,
    reasoningEffort,
    disableStorage,
    live,
    available,
    timeoutMs,
  };
}

async function requestAgentJson(params: { system: string; user: string; runtimeOverride?: AgentRuntimeOverride; maxOutputTokens?: number; reasoningEffort?: "low" | "medium" | "high" }) {
  const runtime = resolveRuntime(params.runtimeOverride);
  if (!runtime.available || !runtime.apiKey || !runtime.baseUrl) {
    return { data: null, runtime: { provider: runtime.providerName, model: runtime.model, mode: "fallback" as const } };
  }

  const headers = {
    Authorization: `Bearer ${runtime.apiKey}`,
    "Content-Type": "application/json",
  };
  const buildResponsesBody = (stream: boolean) => ({
    model: runtime.model,
    stream,
    store: !runtime.disableStorage,
    text: { format: { type: "text" } },
    reasoning: { effort: params.reasoningEffort ?? runtime.reasoningEffort },
    max_output_tokens: params.maxOutputTokens ?? 4000,
    input: [
      { role: "system", content: [{ type: "input_text", text: params.system }] },
      { role: "user", content: [{ type: "input_text", text: params.user }] },
    ],
  });

  let responsesError: string | undefined;
  const chatCompatibilityKey = getChatCompatibilityKey({ providerName: runtime.providerName, model: runtime.model, baseUrl: runtime.baseUrl });

  try {
    const response = await fetchWithTimeout(joinBaseUrl(runtime.baseUrl, "responses"), {
      method: "POST",
      headers: { ...headers, Accept: "text/event-stream" },
      body: JSON.stringify(buildResponsesBody(true)),
    }, runtime.timeoutMs);

    if (response.ok) {
      const { outputText, requestId } = await readSsePayload(response);
      const parsed = extractJsonObject(outputText);
      if (parsed) {
        return {
          data: parsed,
          runtime: {
            provider: runtime.providerName,
            model: runtime.model,
            mode: "live" as const,
            request_id: requestId,
          },
        };
      }
      responsesError = appendError(responsesError, "responses_stream_parse_failed");
    } else {
      responsesError = appendError(responsesError, `responses_stream_failed_${response.status}`);
    }
  } catch (error) {
    responsesError = appendError(responsesError, error instanceof Error ? error.message : "responses_stream_request_failed");
  }

  try {
    const response = await fetchWithTimeout(joinBaseUrl(runtime.baseUrl, "responses"), {
      method: "POST",
      headers,
      body: JSON.stringify(buildResponsesBody(false)),
    }, runtime.timeoutMs);

    if (response.ok) {
      const payload = await response.json();
      const rawText = readResponsesText(payload);
      const parsed = extractJsonObject(rawText) ?? (isRecord(payload) ? payload : null);

      if (parsed) {
        const requestId = isRecord(payload) && typeof payload.id === "string"
          ? payload.id
          : isRecord(payload) && isRecord(payload.response) && typeof payload.response.id === "string"
            ? payload.response.id
            : undefined;
        return {
          data: parsed,
          runtime: {
            provider: runtime.providerName,
            model: runtime.model,
            mode: "live" as const,
            request_id: requestId,
          },
        };
      }

      responsesError = appendError(responsesError, "responses_json_parse_failed");
    } else {
      responsesError = appendError(responsesError, `responses_json_failed_${response.status}`);
    }
  } catch (error) {
    responsesError = appendError(responsesError, error instanceof Error ? error.message : "responses_json_request_failed");
  }

  if (chatUnsupportedRuntimes.has(chatCompatibilityKey)) {
    return {
      data: null,
      runtime: {
        provider: runtime.providerName,
        model: runtime.model,
        mode: "fallback" as const,
        error: appendError(responsesError, "chat_completions_skipped_unsupported"),
      },
    };
  }

  try {
    const response = await fetchWithTimeout(joinBaseUrl(runtime.baseUrl, "chat/completions"), {
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
    }, runtime.timeoutMs);

    if (!response.ok) {
      if (response.status === 404) {
        chatUnsupportedRuntimes.add(chatCompatibilityKey);
      }

      return {
        data: null,
        runtime: {
          provider: runtime.providerName,
          model: runtime.model,
          mode: "fallback" as const,
          error: appendError(responsesError, `chat_completions_failed_${response.status}`),
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
  reasoningEffort?: "low" | "medium" | "high";
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
    });
  }

  const headers = {
    Authorization: `Bearer ${runtime.apiKey}`,
    "Content-Type": "application/json",
  };

  const buildResponsesBody = (stream: boolean) => ({
    model: runtime.model,
    stream,
    store: !runtime.disableStorage,
    text: { format: { type: "text" } },
    reasoning: { effort: params.reasoningEffort ?? runtime.reasoningEffort },
    max_output_tokens: params.maxOutputTokens ?? 2400,
    input: [
      { role: "system", content: [{ type: "input_text", text: params.system }] },
      {
        role: "user",
        content: [
          { type: "input_text", text: params.user },
          ...imageBlocks.flatMap((item) => [
            { type: "input_text", text: `[${item.category}] ${item.label}` },
            { type: "input_image", image_url: item.dataUrl },
          ]),
        ],
      },
    ],
  });

  let responsesError: string | undefined;
  const multimodalChatCompatibilityKey = getChatCompatibilityKey({ providerName: runtime.providerName, model: runtime.model, baseUrl: runtime.baseUrl });

  try {
    const response = await fetchWithTimeout(joinBaseUrl(runtime.baseUrl, "responses"), {
      method: "POST",
      headers: { ...headers, Accept: "text/event-stream" },
      body: JSON.stringify(buildResponsesBody(true)),
    }, runtime.timeoutMs);

    if (response.ok) {
      const { outputText, requestId } = await readSsePayload(response);
      const parsed = extractJsonObject(outputText);
      if (parsed) {
        return {
          data: parsed,
          runtime: {
            provider: runtime.providerName,
            model: runtime.model,
            mode: "live" as const,
            request_id: requestId,
          },
        };
      }
      responsesError = appendError(responsesError, "multimodal_responses_stream_parse_failed");
    } else {
      responsesError = appendError(responsesError, `multimodal_responses_stream_failed_${response.status}`);
    }
  } catch (error) {
    responsesError = appendError(responsesError, error instanceof Error ? error.message : "multimodal_responses_stream_request_failed");
  }

  try {
    const response = await fetchWithTimeout(joinBaseUrl(runtime.baseUrl, "responses"), {
      method: "POST",
      headers,
      body: JSON.stringify(buildResponsesBody(false)),
    }, runtime.timeoutMs);

    if (response.ok) {
      const payload = await response.json();
      const rawText = readResponsesText(payload);
      const parsed = extractJsonObject(rawText) ?? (isRecord(payload) ? payload : null);

      if (parsed) {
        const requestId = isRecord(payload) && typeof payload.id === "string"
          ? payload.id
          : isRecord(payload) && isRecord(payload.response) && typeof payload.response.id === "string"
            ? payload.response.id
            : undefined;
        return {
          data: parsed,
          runtime: {
            provider: runtime.providerName,
            model: runtime.model,
            mode: "live" as const,
            request_id: requestId,
          },
        };
      }

      responsesError = appendError(responsesError, "multimodal_responses_json_parse_failed");
    } else {
      responsesError = appendError(responsesError, `multimodal_responses_json_failed_${response.status}`);
    }
  } catch (error) {
    responsesError = appendError(responsesError, error instanceof Error ? error.message : "multimodal_responses_json_request_failed");
  }

  if (chatUnsupportedRuntimes.has(multimodalChatCompatibilityKey)) {
    return {
      data: null,
      runtime: {
        provider: runtime.providerName,
        model: runtime.model,
        mode: "fallback" as const,
        error: appendError(responsesError, "multimodal_chat_skipped_unsupported"),
      },
    };
  }

  try {
    const response = await fetchWithTimeout(joinBaseUrl(runtime.baseUrl, "chat/completions"), {
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
    }, runtime.timeoutMs);

    if (!response.ok) {
      if (response.status === 404) {
        chatUnsupportedRuntimes.add(multimodalChatCompatibilityKey);
      }

      return {
        data: null,
        runtime: {
          provider: runtime.providerName,
          model: runtime.model,
          mode: "fallback" as const,
          error: appendError(responsesError, `multimodal_chat_failed_${response.status}`),
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

function normalizeTheaterScript(candidate: unknown, fallback: TheaterScript): TheaterScript | null {
  const source = isRecord(candidate) && isRecord(candidate.theater_script) ? candidate.theater_script : candidate;
  if (!isRecord(source)) return null;

  const liveChoices = Array.isArray(source.act2 && isRecord(source.act2) ? source.act2.choices : [])
    ? ((source.act2 as { choices?: unknown[] }).choices as unknown[])
    : [];
  const liveQuestions = Array.isArray(source.act3 && isRecord(source.act3) ? source.act3.mirror_questions : [])
    ? ((source.act3 as { mirror_questions?: unknown[] }).mirror_questions as unknown[])
    : [];

  return {
    user_id: typeof source.user_id === "string" ? source.user_id : fallback.user_id,
    generated_at: typeof source.generated_at === "string" ? source.generated_at : fallback.generated_at,
    personalization_summary: {
      core_archetype:
        isRecord(source.personalization_summary) && typeof source.personalization_summary.core_archetype === "string"
          ? source.personalization_summary.core_archetype
          : fallback.personalization_summary.core_archetype,
      aesthetic_style:
        isRecord(source.personalization_summary) && typeof source.personalization_summary.aesthetic_style === "string"
          ? source.personalization_summary.aesthetic_style
          : fallback.personalization_summary.aesthetic_style,
      emotional_tone:
        isRecord(source.personalization_summary) && typeof source.personalization_summary.emotional_tone === "string"
          ? source.personalization_summary.emotional_tone
          : fallback.personalization_summary.emotional_tone,
      key_themes:
        isRecord(source.personalization_summary) && Array.isArray(source.personalization_summary.key_themes)
          ? source.personalization_summary.key_themes.filter((item): item is string => typeof item === "string")
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
      mirror_questions: (liveQuestions.length > 0 ? liveQuestions : fallback.act3.mirror_questions).map((question, index) => {
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
      }),
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
) {
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

  const request = await requestMultimodalJson({
    system: MULTIMODAL_SYSTEM_PROMPT,
    user: buildMultimodalUserPrompt(input),
    musicInputs: input.music_inputs,
    socialInputs: input.social_post_inputs,
    photoInput: input.precious_photo_input,
    runtimeOverride,
    maxOutputTokens: 1600,
    reasoningEffort: runtimeOverride?.reasoning_effort ?? "low",
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
  const request = await requestAgentJson({
    system: DIRECTOR_SYSTEM_PROMPT,
    user: buildDirectorUserPrompt(record),
    runtimeOverride,
    maxOutputTokens: 4200,
    reasoningEffort: runtimeOverride?.reasoning_effort ?? "medium",
  });

  const normalized = normalizeTheaterScript(request.data, fallback);
  if (!normalized) {
    return { theaterScript: fallback, runtime: request.runtime };
  }

  return { theaterScript: normalized, runtime: request.runtime };
}

export async function generateConstellationWithAgent(part1: Part1Record, part2: Part2Record, runtimeOverride?: AgentRuntimeOverride): Promise<{ constellation: PsycheConstellation; runtime: AgentRuntimeResult }> {
  const fallback = generateDeterministicConstellation(part1, part2);
  const request = await requestAgentJson({
    system: ANALYST_SYSTEM_PROMPT,
    user: buildAnalystUserPrompt(part1, part2),
    runtimeOverride,
    maxOutputTokens: 5600,
    reasoningEffort: runtimeOverride?.reasoning_effort ?? "medium",
  });

  const normalized = normalizeConstellation(request.data, fallback);
  if (!normalized) {
    return { constellation: fallback, runtime: request.runtime };
  }

  return { constellation: normalized, runtime: request.runtime };
}
