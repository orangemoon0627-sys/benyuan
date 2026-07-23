import { NextResponse, type NextRequest } from "next/server";
import { evaluateBenyuanInternalAccess } from "@/lib/benyuan-internal-access";

export function proxy(request: NextRequest) {
  const decision = evaluateBenyuanInternalAccess({
    nodeEnv: process.env.NODE_ENV,
    configuredToken: process.env.BENYUAN_INTERNAL_ACCESS_TOKEN,
    authorization: request.headers.get("authorization"),
  });

  if (decision.allowed) {
    return NextResponse.next();
  }

  if (decision.status === 404) {
    return new NextResponse(null, {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
      "www-authenticate": 'Basic realm="Benyuan Internal", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: [
    "/lab/:path*",
    "/agent/:path*",
    "/api/internal/:path*",
    "/api/agent/:path*",
    "/api/analysis/runtime",
  ],
};
