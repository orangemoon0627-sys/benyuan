import assert from "node:assert/strict";
import test from "node:test";

const parser = await import("../src/lib/benyuan-agent-response-parser.ts");

test("parseProviderJsonOrSsePayload parses JSON embedded in a raw SSE response", () => {
  const payload = parser.parseProviderJsonOrSsePayload([
    'event: response.output_text.done',
    'data: {"type":"response.output_text.done","text":"{\\"ok\\":true,\\"value\\":7}"}',
    '',
    'event: response.completed',
    'data: {"type":"response.completed","response":{"id":"resp_sse_text"}}',
    '',
  ].join("\n"));

  assert.deepEqual(payload, {
    parsed: { ok: true, value: 7 },
    outputText: '{"ok":true,"value":7}',
    requestId: "resp_sse_text",
    errorDetail: undefined,
  });
});

test("parseProviderJsonOrSsePayload still parses normal Responses JSON payloads", () => {
  const payload = parser.parseProviderJsonOrSsePayload(JSON.stringify({
    id: "resp_json",
    output: [
      {
        content: [
          { text: '{"name":"deep moon"}' },
        ],
      },
    ],
  }));

  assert.deepEqual(payload, {
    parsed: { name: "deep moon" },
    outputText: '{"name":"deep moon"}',
    requestId: "resp_json",
    errorDetail: undefined,
  });
});
