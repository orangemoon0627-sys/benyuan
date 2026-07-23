import { isIP } from "node:net";

function normalizeIp(value: string | null | undefined) {
  const candidate = value?.trim();
  return candidate && candidate.length <= 64 && isIP(candidate) !== 0 ? candidate : undefined;
}

export function resolveBenyuanClientIp(headers: Pick<Headers, "get">) {
  const realIp = normalizeIp(headers.get("x-real-ip"));
  if (realIp) return realIp;

  const forwarded = headers.get("x-forwarded-for")?.split(",") ?? [];
  for (let index = forwarded.length - 1; index >= 0; index -= 1) {
    const candidate = normalizeIp(forwarded[index]);
    if (candidate) return candidate;
  }

  return "unknown";
}
