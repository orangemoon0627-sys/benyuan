import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createLocalPlanRun } from "@/lib/codex-platform/runtime";
import { buildCodexPlatformBootstrap } from "@/lib/codex-platform/bootstrap";
import { subscribeToRunEvents } from "@/lib/codex-platform/execution-bus";
import {
  createPlatformSession,
  getPermissionDecisionById,
  listAgentRuns,
  listPlanRuns,
  listPlatformSessions,
  listPermissionDecisions,
  listRuntimeEvents,
  listToolCalls,
  persistPlanRun,
} from "@/lib/codex-platform/local-store";
import { getProjectSpaceManifest } from "@/lib/codex-platform/project-manifests";
import { getProjectSpaceById } from "@/lib/codex-platform/project-spaces";
import { executeAgentRun, executeToolCall, resolvePendingPermissionDecision } from "@/lib/codex-platform/runtime-service";
import type {
  CreateAgentRunInput,
  CreatePlanRunInput,
  CreateSessionInput,
  ToolCallInput,
} from "@/lib/codex-platform/types";

const port = Number(process.env.CODEX_COMPANION_PORT ?? "4319");
const host = process.env.CODEX_COMPANION_HOST ?? "127.0.0.1";
const baseUrl = `http://${host}:${port}`;

function sendJson(response: ServerResponse<IncomingMessage>, status: number, payload: unknown) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendSse(response: ServerResponse<IncomingMessage>) {
  response.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
  });
}

function writeSseEvent(response: ServerResponse<IncomingMessage>, eventName: string, payload: unknown) {
  response.write(`event: ${eventName}\n`);
  response.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function readJsonBody<T>(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (!chunks.length) return null;
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

const server = createServer(async (request, response) => {
  const method = request.method ?? "GET";
  const pathname = new URL(request.url ?? "/", baseUrl).pathname;

  try {
    if (method === "GET" && pathname === "/healthz") {
      sendJson(response, 200, {
        connected: true,
        mode: "remote",
        summary: "Codex companion is online.",
        bridgeHealth: "online",
        baseUrl,
        capabilities: ["sessions", "agents", "tools", "plans", "permissions"],
        lastHeartbeatAt: new Date().toISOString(),
      });
      return;
    }

    if (method === "GET" && pathname === "/bootstrap") {
      sendJson(
        response,
        200,
        await buildCodexPlatformBootstrap({
          companionStatus: {
            connected: true,
            mode: "remote",
            summary: "Codex companion is online.",
            bridgeHealth: "online",
            baseUrl,
            capabilities: ["sessions", "agents", "tools", "plans", "permissions"],
            lastHeartbeatAt: new Date().toISOString(),
          },
        }),
      );
      return;
    }

    if (method === "GET" && pathname === "/sessions") {
      sendJson(response, 200, { sessions: await listPlatformSessions() });
      return;
    }

    if (method === "POST" && pathname === "/sessions") {
      const payload = await readJsonBody<CreateSessionInput>(request);
      if (!payload?.projectSpaceId) {
        sendJson(response, 400, { error: "projectSpaceId is required" });
        return;
      }

      sendJson(response, 201, { session: await createPlatformSession(payload) });
      return;
    }

    if (method === "GET" && pathname === "/tool-calls") {
      sendJson(response, 200, { toolCalls: await listToolCalls() });
      return;
    }

    if (method === "POST" && pathname === "/tool-calls") {
      const payload = await readJsonBody<ToolCallInput>(request);
      if (!payload?.toolName) {
        sendJson(response, 400, { error: "toolName is required" });
        return;
      }

      sendJson(response, 201, { toolCall: await executeToolCall(payload) });
      return;
    }

    if (method === "GET" && pathname === "/agent-runs") {
      sendJson(response, 200, { agentRuns: await listAgentRuns() });
      return;
    }

    if (method === "POST" && pathname === "/agent-runs") {
      const payload = await readJsonBody<CreateAgentRunInput>(request);
      if (!payload?.agentType || !payload.projectSpaceId) {
        sendJson(response, 400, { error: "agentType and projectSpaceId are required" });
        return;
      }

      sendJson(response, 201, { agentRun: await executeAgentRun(payload) });
      return;
    }

    if (method === "GET" && pathname === "/plan-runs") {
      sendJson(response, 200, { planRuns: await listPlanRuns() });
      return;
    }

    if (method === "POST" && pathname === "/plan-runs") {
      const payload = await readJsonBody<CreatePlanRunInput>(request);
      if (!payload?.objective || !payload.projectSpaceId) {
        sendJson(response, 400, { error: "objective and projectSpaceId are required" });
        return;
      }

      sendJson(response, 201, { planRun: await persistPlanRun(await createLocalPlanRun(payload)) });
      return;
    }

    if (method === "GET" && pathname === "/permissions") {
      const permissions = await listPermissionDecisions();
      sendJson(response, 200, {
        permissions,
        pending: permissions.filter((permission) => permission.status === "pending"),
      });
      return;
    }

    const permissionMatch = pathname.match(/^\/permissions\/([^/]+)$/);
    if (permissionMatch && method === "GET") {
      const permission = await getPermissionDecisionById(permissionMatch[1] ?? "");
      if (!permission) {
        sendJson(response, 404, { error: "permission_not_found" });
        return;
      }

      sendJson(response, 200, { permission });
      return;
    }

    if (permissionMatch && method === "POST") {
      const payload = await readJsonBody<{ decision?: "approved" | "rejected"; reason?: string }>(request);
      if (!payload?.decision) {
        sendJson(response, 400, { error: "decision is required" });
        return;
      }

      const toolCall = await resolvePendingPermissionDecision({
        permissionId: permissionMatch[1] ?? "",
        decision: payload.decision,
        reason: payload.reason,
      });
      if (!toolCall) {
        sendJson(response, 404, { error: "permission_not_found" });
        return;
      }

      sendJson(response, 200, { toolCall });
      return;
    }

    const projectSpaceMatch = pathname.match(/^\/project-spaces\/([^/]+)$/);
    if (projectSpaceMatch && method === "GET") {
      const projectSpace = getProjectSpaceById(projectSpaceMatch[1] ?? "");
      const manifest = getProjectSpaceManifest(projectSpaceMatch[1] ?? "");
      if (!projectSpace || !manifest) {
        sendJson(response, 404, { error: "project_space_not_found" });
        return;
      }

      sendJson(response, 200, { projectSpace, manifest });
      return;
    }

    const streamMatch = pathname.match(/^\/stream\/(tool|agent)\/([^/]+)$/);
    if (streamMatch && method === "GET") {
      const runType = (streamMatch[1] ?? "tool") as "tool" | "agent";
      const runId = streamMatch[2] ?? "";
      sendSse(response);
      const initialEvents = await listRuntimeEvents({ runType, runId });
      for (const event of initialEvents) {
        writeSseEvent(response, event.kind, event);
      }

      let closed = false;
      const unsubscribe = subscribeToRunEvents(runType, runId, (event) => {
        if (closed) return;
        writeSseEvent(response, event.kind, event);
        if (event.kind === "completed" || event.kind === "failed") {
          closed = true;
          unsubscribe();
          response.end();
        }
      });

      setTimeout(() => {
        if (closed) return;
        closed = true;
        unsubscribe();
        response.end();
      }, 15000);
      return;
    }

    sendJson(response, 404, { error: "not found" });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "unknown error",
    });
  }
});

server.listen(port, host, () => {
  console.log(`[codex-companion] listening on ${baseUrl}`);
});
