function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    return null;
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
    const requestId = isRecord(payload) && typeof payload.id === "string"
      ? payload.id
      : isRecord(payload) && isRecord(payload.response) && typeof payload.response.id === "string"
        ? payload.response.id
        : undefined;
    return {
      parsed: extractJsonObject(outputText) ?? (isRecord(payload) ? payload : null),
      outputText,
      requestId,
      errorDetail: undefined,
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
