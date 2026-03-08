import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { sampleReport } from "@/lib/fixtures/report";
import { buildFeatureVector } from "@/lib/feature-mapper";
import { buildReport } from "@/lib/report-builder";
import type { AnalysisJob, FeatureVector, ReportPayload, TestSession } from "@/lib/types";

type PersistedStore = {
  sessions: Record<string, TestSession>;
  featureVectors: Record<string, FeatureVector>;
  jobs: Record<string, AnalysisJob>;
  reports: Record<string, ReportPayload>;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "benyuan-store.json");

const defaultStore = (): PersistedStore => ({
  sessions: {},
  featureVectors: {},
  jobs: {},
  reports: {
    [sampleReport.sessionId]: sampleReport,
  },
});

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(STORE_FILE, "utf8");
  } catch {
    await writeFile(STORE_FILE, JSON.stringify(defaultStore(), null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStoreFile();
  const raw = await readFile(STORE_FILE, "utf8");
  return JSON.parse(raw) as PersistedStore;
}

async function writeStore(store: PersistedStore) {
  await writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export async function createSession(session: Omit<TestSession, "sessionId" | "createdAt">) {
  const store = await readStore();
  const record: TestSession = {
    ...session,
    sessionId: uid("sess"),
    createdAt: new Date().toISOString(),
  };

  store.sessions[record.sessionId] = record;
  await writeStore(store);
  return record;
}

export async function getSession(sessionId: string) {
  const store = await readStore();
  return store.sessions[sessionId];
}

export async function createFeatureVector(session: TestSession) {
  const store = await readStore();
  const vector = buildFeatureVector(session);

  store.featureVectors[session.sessionId] = vector;
  await writeStore(store);
  return vector;
}

export async function getFeatureVector(sessionId: string) {
  const store = await readStore();
  return store.featureVectors[sessionId];
}

export async function createAnalysisJob(sessionId: string) {
  const store = await readStore();
  const job: AnalysisJob = {
    jobId: uid("job"),
    sessionId,
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  store.jobs[job.jobId] = job;
  await writeStore(store);
  return job;
}

export async function getJob(jobId: string) {
  const store = await readStore();
  return store.jobs[jobId];
}

export async function getReport(sessionId: string) {
  const store = await readStore();
  return store.reports[sessionId];
}

export async function runAnalysis(jobId: string) {
  const initialStore = await readStore();
  const initialJob = initialStore.jobs[jobId];

  if (!initialJob) return undefined;

  const session = initialStore.sessions[initialJob.sessionId];
  if (!session) {
    initialJob.status = "failed";
    initialJob.finishedAt = new Date().toISOString();
    initialStore.jobs[jobId] = initialJob;
    await writeStore(initialStore);
    return initialJob;
  }

  initialJob.status = "running";
  initialStore.jobs[jobId] = initialJob;
  await writeStore(initialStore);

  const vector = await createFeatureVector(session);

  setTimeout(async () => {
    const nextStore = await readStore();
    const nextJob = nextStore.jobs[jobId];
    if (!nextJob) return;

    nextJob.status = "done";
    nextJob.finishedAt = new Date().toISOString();
    nextStore.jobs[jobId] = nextJob;
    nextStore.reports[session.sessionId] = buildReport(session, vector);
    await writeStore(nextStore);
  }, 1200);

  return initialJob;
}
