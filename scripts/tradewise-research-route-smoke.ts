import { createServer } from "node:http";
import process from "node:process";

import { GET } from "../src/app/api/tradewise/research/feed/route";
import { validateResearchFeedResponse } from "../src/lib/tradewise/research-contract";

type RemoteRequestLog = {
  path: string;
  search: string;
  marketCode: string;
  pageSize: string;
  auth: string;
  trace: string;
};

function createRemoteFixtureServer() {
  const requests: RemoteRequestLog[] = [];
  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    requests.push({
      path: url.pathname,
      search: url.search,
      marketCode: url.searchParams.get("marketCode") ?? "",
      pageSize: url.searchParams.get("pageSize") ?? "",
      auth: request.headers.authorization ?? "",
      trace: String(request.headers["x-tradewise-trace"] ?? ""),
    });

    const limit = Number.parseInt(url.searchParams.get("pageSize") ?? "0", 10) || 10;
    const market = url.searchParams.get("marketCode") === "us" ? "us" : "cn";
    const pool = [
      {
        uuid: "route-feed-1",
        market: "cn",
        industry: "电网设备",
        headline: "Route 级验证：主网投资继续抬升",
        abstract: "Route 摘要 1",
        publisher: "Route Desk",
        publishedAt: "2026-03-10T08:00:00.000Z",
        score: "9.1",
        body: "Route 正文 1",
        tags: "电网,特高压",
        isMock: false,
      },
      {
        uuid: "route-feed-2",
        market: "cn",
        industry: "算力基础设施",
        headline: "Route 级验证：算力链景气延续",
        abstract: "Route 摘要 2",
        publisher: "Route Desk",
        publishedAt: "2026-03-10T07:30:00.000Z",
        score: 8.5,
        body: "Route 正文 2",
        tags: ["算力", "机柜"],
        isMock: false,
      },
      {
        uuid: "route-feed-3",
        market: "us",
        industry: "AI Infra",
        headline: "Route level US validation",
        abstract: "Route summary 3",
        publisher: "Route Desk",
        publishedAt: "2026-03-09T23:00:00.000Z",
        score: 7.9,
        body: "Route content 3",
        tags: ["GPU", "Datacenter"],
        isMock: false,
      },
    ];
    const items = pool.filter((item) => item.market === market).slice(0, limit);

    response.setHeader("content-type", "application/json");
    response.end(
      JSON.stringify({
        version: "route.research.fixture.v1",
        data: {
          list: items,
        },
      }),
    );
  });

  return {
    requests,
    start() {
      return new Promise<{ port: number }>((resolve) => {
        server.listen(0, "127.0.0.1", () => {
          const address = server.address();
          resolve({
            port: typeof address === "object" && address ? address.port : 0,
          });
        });
      });
    },
    stop() {
      return new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    },
  };
}

function setDefaultEnv(name: string, value: string) {
  if (!process.env[name]?.trim()) {
    process.env[name] = value;
  }
}

async function main() {
  const externalRemoteUrl = process.env.TRADEWISE_RESEARCH_REMOTE_URL?.trim();
  const remote = externalRemoteUrl ? null : createRemoteFixtureServer();
  const remotePort = remote ? (await remote.start()).port : null;
  const remoteUrl = externalRemoteUrl ?? `http://127.0.0.1:${remotePort}/feed`;

  process.env.TRADEWISE_RESEARCH_PROVIDER = "remote";
  process.env.TRADEWISE_RESEARCH_REMOTE_URL = remoteUrl;
  setDefaultEnv("TRADEWISE_RESEARCH_REMOTE_HEADERS", JSON.stringify({ "x-tradewise-trace": "route-smoke" }));
  setDefaultEnv("TRADEWISE_RESEARCH_REMOTE_AUTH_TOKEN", "research-token");
  setDefaultEnv("TRADEWISE_RESEARCH_REMOTE_MARKET_PARAM", "marketCode");
  setDefaultEnv("TRADEWISE_RESEARCH_REMOTE_LIMIT_PARAM", "pageSize");
  setDefaultEnv("TRADEWISE_RESEARCH_REMOTE_MARKET_VALUE_A_STOCK", "cn");
  setDefaultEnv("TRADEWISE_RESEARCH_REMOTE_MARKET_VALUE_US_STOCK", "us");

  try {
    const response = await GET(
      new Request("http://localhost/api/tradewise/research/feed?market=a_stock&limit=2"),
    );
    const body = (await response.json()) as unknown;
    if (response.status !== 200) {
      throw new Error(
        `research_route_status_${response.status}:${JSON.stringify(body).slice(0, 240)}`,
      );
    }
    if (!validateResearchFeedResponse(body)) {
      throw new Error("research_route_invalid_shape");
    }
    if (body.items.length !== 2) {
      throw new Error("research_route_limit_not_applied");
    }
    if (body.items.some((item) => item.market !== "a_stock")) {
      throw new Error("research_route_market_not_normalized");
    }
    if (body.items.some((item) => item.isMock !== false)) {
      throw new Error("research_route_expected_live_items");
    }

    const latestRequest = remote?.requests[remote.requests.length - 1];
    if (
      latestRequest &&
      (latestRequest.marketCode !== "cn" ||
        latestRequest.pageSize !== "2" ||
        latestRequest.auth !== "Bearer research-token" ||
        latestRequest.trace !== "route-smoke")
    ) {
      throw new Error("research_route_remote_forwarding_failed");
    }

    console.log(
      `tradewise:research:route:ok version=${body.version} count=${body.items.length} first=${body.items[0]?.title ?? "n/a"}`,
    );
    console.log("tradewise:research:route:pass");
  } finally {
    await remote?.stop();
  }
}

main().catch((error) => {
  console.error(
    "tradewise:research:route:fail",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
