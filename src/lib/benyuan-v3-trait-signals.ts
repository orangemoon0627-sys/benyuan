export type TraitSignalPolarity = "support" | "counter";

export const BENYUAN_PSYCHE_SIGNAL_KEYS = [
  "meaning_orientation",
  "object_distance",
  "boundary_integrity",
  "desire_structure",
  "defense_style",
  "projection_symbolic_sensitivity",
  "repression_container",
  "relationship_mirror_need",
  "shadow_material",
  "repetition_loop",
  "solitude_capacity",
  "action_entry",
  "time_gravity",
  "transitional_space",
] as const;

export type BenyuanPsycheSignalKey = (typeof BENYUAN_PSYCHE_SIGNAL_KEYS)[number];

const BENYUAN_PSYCHE_SIGNAL_KEY_SET = new Set<string>(BENYUAN_PSYCHE_SIGNAL_KEYS);

export function isBenyuanPsycheSignalKey(value: unknown): value is BenyuanPsycheSignalKey {
  return typeof value === "string" && BENYUAN_PSYCHE_SIGNAL_KEY_SET.has(value);
}

export type TraitSignalComponent = {
  raw: string;
  semantic: string;
  polarity: TraitSignalPolarity;
};

const COUNTER_PREFIX = /^(?:counter(?:[_\s-]?evidence)?|contradiction)(?:[_:\s-]+)(.+)$/iu;

export function parseTraitSignalComponents(value: string): TraitSignalComponent[] {
  return value
    .split("+")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((raw) => {
      const counterMatch = raw.match(COUNTER_PREFIX);
      const semantic = (counterMatch?.[1] ?? raw).trim();
      const polarity: TraitSignalPolarity = counterMatch ? "counter" : "support";
      return {
        raw,
        semantic,
        polarity,
      };
    })
    .filter((item) => item.semantic.length > 0);
}
