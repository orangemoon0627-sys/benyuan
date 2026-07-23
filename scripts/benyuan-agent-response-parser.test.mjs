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

test("parseProviderJsonOrSsePayload rejects an empty provider envelope", () => {
  const payload = parser.parseProviderJsonOrSsePayload(JSON.stringify({
    id: "resp_reasoning_only",
    status: "incomplete",
    incomplete_details: { reason: "max_output_tokens" },
    output: [
      { type: "reasoning", content: [] },
    ],
  }));

  assert.equal(payload.parsed, null);
  assert.equal(payload.outputText, "");
  assert.equal(payload.requestId, "resp_reasoning_only");
  assert.equal(payload.errorDetail, "response_incomplete:max_output_tokens");
});

test("parseProviderJsonOrSsePayload accepts a direct agent JSON object", () => {
  const payload = parser.parseProviderJsonOrSsePayload('{"theater_seed":{"motifs":["潮汐"]}}');
  assert.deepEqual(payload.parsed, { theater_seed: { motifs: ["潮汐"] } });
});

test("parseProviderJsonOrSsePayload reports safe metadata for an empty completed envelope", () => {
  const payload = parser.parseProviderJsonOrSsePayload(JSON.stringify({
    id: "resp_empty",
    status: "completed",
    output: [{ type: "reasoning", content: [] }],
    usage: { output_tokens: 3200, output_tokens_details: { reasoning_tokens: 3200 } },
  }));

  assert.equal(payload.parsed, null);
  assert.equal(payload.errorDetail, "response_empty:status=completed;output=reasoning;content=none;output_tokens=3200;reasoning_tokens=3200");
});

test("parseProviderJsonOrSsePayload recovers text carried only by response.completed", () => {
  const payload = parser.parseProviderJsonOrSsePayload([
    'event: response.completed',
    'data: {"type":"response.completed","response":{"id":"resp_completed_only","output":[{"type":"message","content":[{"type":"output_text","text":"{\\"constellation_seed\\":{\\"mirror_paragraphs\\":[\\"看见潮线\\"]}}"}]}]}}',
    '',
  ].join("\n"));

  assert.equal(payload.requestId, "resp_completed_only");
  assert.deepEqual(payload.parsed, { constellation_seed: { mirror_paragraphs: ["看见潮线"] } });
});

test("extractJsonObject repairs only missing terminal JSON closers", () => {
  assert.deepEqual(
    parser.extractJsonObject('{"constellation_seed":{"mirror_paragraphs":["看见潮线"]}'),
    { constellation_seed: { mirror_paragraphs: ["看见潮线"] } },
  );
  assert.equal(parser.extractJsonObject('{"constellation_seed":,}'), null);
  assert.equal(parser.extractJsonObject('{"text":"unfinished}'), null);
});
