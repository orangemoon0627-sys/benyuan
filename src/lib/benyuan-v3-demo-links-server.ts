import { readFile } from "node:fs/promises";
import path from "node:path";
import { benyuanDemoLinks, type BenyuanDemoLink } from "@/lib/benyuan-v3-demo-links";

type BenchmarkPayload = {
  results?: Array<{
    pack?: "A" | "B" | "C";
    label?: string;
    ids?: {
      part1_id?: string;
      theater_script_id?: string;
      constellation_id?: string;
    };
  }>;
};

export async function getLatestBenyuanDemoLinks(): Promise<BenyuanDemoLink[]> {
  try {
    const filePath = path.join(process.cwd(), "output", "benyuan-pack-benchmark.json");
    const raw = await readFile(filePath, "utf8");
    const payload = JSON.parse(raw) as BenchmarkPayload;
    const mapped = (payload.results ?? [])
      .map((item) => {
        const fallback = benyuanDemoLinks.find((entry) => entry.pack === item.pack);
        if (!item.pack || !item.ids?.part1_id || !item.ids?.theater_script_id || !item.ids?.constellation_id || !fallback) {
          return null;
        }
        return {
          ...fallback,
          name: item.label ?? fallback.name,
          theaterHref: `/theater?part1_id=${item.ids.part1_id}&theater_script_id=${item.ids.theater_script_id}`,
          constellationHref: `/constellation?constellation_id=${item.ids.constellation_id}`,
        } satisfies BenyuanDemoLink;
      })
      .filter((item): item is BenyuanDemoLink => Boolean(item));

    return mapped.length > 0 ? mapped : benyuanDemoLinks;
  } catch {
    return benyuanDemoLinks;
  }
}
