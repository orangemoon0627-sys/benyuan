import { listRuntimeEvents } from "@/lib/codex-platform/local-store";
import { subscribeToRunEvents } from "@/lib/codex-platform/execution-bus";
import type { RuntimeEventRecord } from "@/lib/codex-platform/types";

export const dynamic = "force-dynamic";

function encodeSse(event: RuntimeEventRecord) {
  return `event: ${event.kind}\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function GET(_: Request, { params }: { params: Promise<{ runType: string; runId: string }> }) {
  const { runType, runId } = await params;
  const normalizedRunType = runType === "tool" || runType === "agent" ? runType : null;

  if (!normalizedRunType) {
    return new Response("invalid_run_type", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const initialEvents = await listRuntimeEvents({
        runId,
        runType: normalizedRunType,
      });

      for (const event of initialEvents) {
        controller.enqueue(encoder.encode(encodeSse(event)));
      }

      const unsubscribe = subscribeToRunEvents(normalizedRunType, runId, (event) => {
        if (closed) return;
        controller.enqueue(encoder.encode(encodeSse(event)));

        if (event.kind === "completed" || event.kind === "failed") {
          unsubscribe();
          closed = true;
          controller.close();
        }
      });

      setTimeout(() => {
        if (closed) return;
        unsubscribe();
        closed = true;
        controller.close();
      }, 15000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
