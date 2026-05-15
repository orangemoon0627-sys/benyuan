import { NextResponse } from "next/server";

const ASSOCIATED_APP_ID = "CY3DD3J5CU.com.fanhao.benyuan.origin.shell";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: [
          {
            appIDs: [ASSOCIATED_APP_ID],
            components: [
              {
                "/": "/app/benyuan/*",
                comment: "Benyuan WeChat Universal Link",
              },
            ],
          },
        ],
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
