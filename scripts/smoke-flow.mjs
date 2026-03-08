#!/usr/bin/env node
import process from 'node:process';

const baseUrl = (process.env.BENYUAN_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const pollDelayMs = Number(process.env.BENYUAN_POLL_MS ?? 250);
const pollLimit = Number(process.env.BENYUAN_POLL_LIMIT ?? 30);

async function loadQuestionSet() {
  const schema = await requestJson('/api/test/schema?mode=lite');
  return schema.questions;
}

function getOptionLabel(option) {
  if (typeof option === 'string') return option;
  if (option && typeof option === 'object' && typeof option.label === 'string') return option.label;
  return '';
}

function getDefaultAnswerValue(question) {
  if (question.answerType === 'multi' || question.answerType === 'image_multi' || question.answerType === 'rank') {
    return [];
  }

  if (question.answerType === 'scale') {
    return question.scaleMin ?? 1;
  }

  return '';
}

function buildAnswers(questions) {
  return questions.map((question, index) => {
    const optionLabels = (question.options ?? []).map(getOptionLabel).filter(Boolean);
    let value = getDefaultAnswerValue(question);

    if (question.answerType === 'multi') {
      value = optionLabels.slice(0, question.minSelections ?? 1);
    } else if (question.answerType === 'scale') {
      value = Math.min(question.scaleMax ?? 5, Math.max(question.scaleMin ?? 1, 4));
    } else if (question.answerType === 'text') {
      value = question.questionId === 'Q023'
        ? '《悉达多》让我觉得，很多弯路其实也是河流的一部分。'
        : '请继续把尚未成形的自己，慢一点带出来。';
    } else if (optionLabels.length > 0) {
      value = optionLabels[(index + 1) % optionLabels.length];
    }

    return {
      questionId: question.questionId,
      moduleId: question.moduleId,
      answerType: question.answerType,
      value,
    };
  });
}

async function requestJson(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed (${response.status}): ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function requestText(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const payload = await response.text();

  if (!response.ok) {
    throw new Error(`GET ${path} failed (${response.status}): ${payload.slice(0, 280)}`);
  }

  return payload;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function wait(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`smoke:start base=${baseUrl}`);
  const questions = await loadQuestionSet();
  const answers = buildAnswers(questions);

  const submitPayload = {
    mode: 'lite',
    basicInfo: {
      lifeStage: 'turning_point',
      moodKeywords: ['迷茫', '希望'],
    },
    answers,
  };

  const submit = await requestJson('/api/test/submit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(submitPayload),
  });

  assert(submit.sessionId && submit.next, 'submit response missing sessionId/next');
  console.log(`smoke:submit ok session=${submit.sessionId}`);

  const analysis = await requestJson('/api/analysis', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId: submit.sessionId }),
  });

  assert(analysis.jobId, 'analysis response missing jobId');
  console.log(`smoke:analysis started job=${analysis.jobId} status=${analysis.status}`);

  let job = null;
  for (let attempt = 1; attempt <= pollLimit; attempt += 1) {
    job = await requestJson(`/api/analysis/${analysis.jobId}`);
    console.log(`smoke:poll attempt=${attempt} status=${job.status}`);

    if (job.status === 'done') break;
    if (job.status === 'failed') {
      throw new Error(`analysis job failed: ${JSON.stringify(job)}`);
    }

    await wait(pollDelayMs);
  }

  assert(job?.status === 'done', `analysis job did not complete within ${pollLimit} polls`);

  const reportPayload = await requestJson(`/api/report/${submit.sessionId}`);
  assert(reportPayload.status === 'done', 'report response status mismatch');
  assert(reportPayload.report?.archetype?.name, 'report missing archetype name');
  assert(Array.isArray(reportPayload.report?.dimensionReadings) && reportPayload.report.dimensionReadings.length > 0, 'report missing dimension readings');
  assert(Array.isArray(reportPayload.report?.recommendations) && reportPayload.report.recommendations.length > 0, 'report missing recommendations');
  console.log(`smoke:report ok archetype=${reportPayload.report.archetype.name}`);

  for (const variant of ['portrait', 'square', 'story']) {
    const svg = await requestText(`/api/report/${submit.sessionId}/card?variant=${variant}`);
    assert(svg.includes('<svg'), `share card ${variant} missing svg tag`);
    assert(svg.includes(reportPayload.report.archetype.name), `share card ${variant} missing archetype name`);
    console.log(`smoke:card ok variant=${variant}`);
  }

  console.log('smoke:pass');
}

main().catch((error) => {
  console.error('smoke:fail', error instanceof Error ? error.message : error);
  process.exit(1);
});
