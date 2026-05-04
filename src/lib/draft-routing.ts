export function draftIdToSegments(draftId: string) {
  return draftId.split(".").filter(Boolean);
}

export function draftIdFromSegments(parts: string[] | undefined) {
  return (parts ?? []).filter(Boolean).join(".");
}

export function buildDraftDetailHref(draftId: string) {
  return `/lab/drafts/${draftIdToSegments(draftId).join("/")}`;
}

export function buildDraftDetailApiHref(draftId: string) {
  return `/api/internal/draft-sessions/${draftIdToSegments(draftId).join("/")}`;
}

export function buildDraftSimulationApiHref(draftId: string) {
  return `/api/internal/draft-sessions/simulate/${draftIdToSegments(draftId).join("/")}`;
}
