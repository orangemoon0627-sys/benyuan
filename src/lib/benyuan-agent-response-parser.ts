function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function appendMissingJsonClosers(value: string) {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (const character of value) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }
    if (character === '"') {
      inString = true;
    } else if (character === "{" || character === "[") {
      stack.push(character);
    } else if (character === "}" || character === "]") {
      const expected = character === "}" ? "{" : "[";
      if (stack.pop() !== expected) return null;
    }
  }
  if (inString || stack.length === 0 || stack.length > 3) return null;
  return value + stack.reverse().map((character) => (character === "{" ? "}" : "]")).join("");
}

export function extractJsonObject(rawText: string) {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1] ?? rawText;
  const trimmed = candidate.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) return null;

  try {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as unknown;
  } catch {
    const repaired = appendMissingJsonClosers(trimmed.slice(firstBrace, lastBrace + 1));
    if (!repaired) return null;
    try {
      return JSON.parse(repaired) as unknown;
    } catch {
      return null;
    }
  }
}

export function readResponsesText(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.output)) return "";
  return value.output
    .flatMap((item) => (isRecord(item) && Array.isArray(item.content) ? item.content : []))
    .map((part) => (isRecord(part) && typeof part.text === "string" ? part.text : ""))
    .join("")
    .trim();
}

export function readChatText(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.choices)) return "";
  const first = value.choices[0];
  if (!isRecord(first) || !isRecord(first.message)) return "";
  return typeof first.message.content === "string" ? first.message.content.trim() : "";
}

function readResponsesEnvelopeError(value: unknown) {
  if (!isRecord(value)) return undefined;
  if (isRecord(value.error)) {
    return [value.error.code, value.error.type, value.error.message]
      .find((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  if (value.status === "incomplete" && isRecord(value.incomplete_details)) {
    const reason = value.incomplete_details.reason;
    return typeof reason === "string" && reason.trim() ? `response_incomplete:${reason.trim()}` : "response_incomplete";
  }
  if (Array.isArray(value.output)) {
    const outputTypes = value.output
      .map((item) => (isRecord(item) && typeof item.type === "string" ? item.type : "unknown"))
      .join(",") || "none";
    const contentTypes = value.output
      .flatMap((item) => (isRecord(item) && Array.isArray(item.content) ? item.content : []))
      .map((item) => (isRecord(item) && typeof item.type === "string" ? item.type : "unknown"))
      .join(",") || "none";
    const usage = isRecord(value.usage) ? value.usage : {};
    const outputTokens = typeof usage.output_tokens === "number" ? usage.output_tokens : "unknown";
    const reasoningTokens = isRecord(usage.output_tokens_details) && typeof usage.output_tokens_details.reasoning_tokens === "number"
      ? usage.output_tokens_details.reasoning_tokens
      : "unknown";
    return `response_empty:status=${typeof value.status === "string" ? value.status : "unknown"};output=${outputTypes};content=${contentTypes};output_tokens=${outputTokens};reasoning_tokens=${reasoningTokens}`;
  }
  return undefined;
}

export function collectSseTextFragments(value: unknown): string[] {
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
    if (Array.isArray(node.output)) visit(node.output);
    if (Array.isArray(node.contents)) visit(node.contents);
    if (Array.isArray(node.parts)) visit(node.parts);
    if (isRecord(node.part)) visit(node.part);
    if (isRecord(node.item)) visit(node.item);
  };

  visit(value);
  return fragments;
}

export function readSseErrorDetail(value: unknown) {
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

export function parseSsePayloadText(rawText: string) {
  let outputText = "";
  let requestId: string | undefined;
  let errorDetail: string | undefined;

  for (const line of rawText.split(/\r?\n/)) {
    if (!line.startsWith("data: ")) continue;
    const payloadText = line.slice(6).trim();
    if (!payloadText || payloadText === "[DONE]") continue;

    try {
      const payload = JSON.parse(payloadText) as Record<string, unknown>;
      const type = typeof payload.type === "string" ? payload.type : "";
      if (!requestId && isRecord(payload.response) && typeof payload.response.id === "string") {
        requestId = payload.response.id;
      }
      if (!requestId && typeof payload.id === "string") {
        requestId = payload.id;
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
      }
      if (type === "response.completed" && !outputText.trim() && isRecord(payload.response)) {
        const completedText = collectSseTextFragments(payload.response).join("");
        if (completedText.trim()) outputText = completedText;
      }
    } catch {
      // Ignore malformed SSE chunks and keep scanning later data lines.
    }
  }

  return { outputText: outputText.trim(), requestId, errorDetail };
}

export function parseProviderJsonOrSsePayload(rawText: string) {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { parsed: null, outputText: "", requestId: undefined, errorDetail: undefined };
  }

  if (/^(event|data):\s/m.test(trimmed)) {
    const { outputText, requestId, errorDetail } = parseSsePayloadText(trimmed);
    return {
      parsed: extractJsonObject(outputText),
      outputText,
      requestId,
      errorDetail,
    };
  }

  try {
    const payload = JSON.parse(trimmed) as unknown;
    const outputText = readResponsesText(payload) || readChatText(payload);
    const providerEnvelope = isRecord(payload) && (Array.isArray(payload.output) || Array.isArray(payload.choices));
    const requestId = isRecord(payload) && typeof payload.id === "string"
      ? payload.id
      : isRecord(payload) && isRecord(payload.response) && typeof payload.response.id === "string"
        ? payload.response.id
        : undefined;
    return {
      parsed: extractJsonObject(outputText) ?? (isRecord(payload) && !providerEnvelope ? payload : null),
      outputText,
      requestId,
      errorDetail: outputText ? undefined : readResponsesEnvelopeError(payload),
    };
  } catch {
    return {
      parsed: extractJsonObject(trimmed),
      outputText: trimmed,
      requestId: undefined,
      errorDetail: undefined,
    };
  }
}
