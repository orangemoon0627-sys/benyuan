export type BenyuanDemoLink = {
  pack: "A" | "B" | "C";
  name: string;
  archetype: string;
  theaterHref: string;
  constellationHref: string;
};

export const benyuanDemoLinks: BenyuanDemoLink[] = [
  {
    pack: "A",
    name: "孤独求索者",
    archetype: "The Solitary Seeker",
    theaterHref: "/theater?part1_id=part1_ebc4el2y&theater_script_id=theater_fcm6q0k8",
    constellationHref: "/constellation?constellation_id=const_qaub8gcl",
  },
  {
    pack: "B",
    name: "理性建构者",
    archetype: "The Rational Builder",
    theaterHref: "/theater?part1_id=part1_s575l1t7&theater_script_id=theater_003qj9px",
    constellationHref: "/constellation?constellation_id=const_h572ny90",
  },
  {
    pack: "C",
    name: "温柔守护者",
    archetype: "The Gentle Keeper",
    theaterHref: "/theater?part1_id=part1_pydb5on7&theater_script_id=theater_di7oz5x2",
    constellationHref: "/constellation?constellation_id=const_lufzlqfx",
  },
];
