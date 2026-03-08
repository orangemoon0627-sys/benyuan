import { NextResponse } from "next/server";
import { buildGoldenBaselineFreezeCandidate } from "@/lib/golden-baseline-freeze";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const version = searchParams.get("version");
  const freezeReason = searchParams.get("reason");
  const notes = searchParams.get("notes");
  const sourceBaselineVersion = searchParams.get("sourceBaseline");
  const download = searchParams.get("download") === "1";

  const candidate = buildGoldenBaselineFreezeCandidate({
    version,
    freezeReason,
    notes,
    sourceBaselineVersion,
  });

  const body = JSON.stringify(candidate, null, 2);

  return new NextResponse(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(download
        ? {
            "content-disposition": `attachment; filename="${candidate.version}.json"`,
          }
        : {}),
    },
  });
}
