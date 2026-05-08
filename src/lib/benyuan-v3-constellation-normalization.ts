type CoreTension = {
  tension_id: number;
  name: string;
  description: string;
  growth_direction: string;
};

function cleanText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function fingerprint(value: string) {
  return cleanText(value).toLocaleLowerCase("zh-CN").replace(/[\s\p{P}\p{S}]+/gu, "");
}

export function dedupeCoreTensions(items: CoreTension[]) {
  const seenNames = new Set<string>();
  const seenDescriptions = new Set<string>();
  const next: CoreTension[] = [];

  for (const item of items) {
    const name = cleanText(item.name);
    const description = cleanText(item.description);
    const growthDirection = cleanText(item.growth_direction);
    const nameKey = fingerprint(name);
    const descriptionKey = fingerprint(description);

    if (!name || !description) continue;
    if (seenNames.has(nameKey) || seenDescriptions.has(descriptionKey)) continue;

    seenNames.add(nameKey);
    seenDescriptions.add(descriptionKey);
    next.push({
      tension_id: next.length + 1,
      name,
      description,
      growth_direction: growthDirection,
    });
  }

  return next;
}
