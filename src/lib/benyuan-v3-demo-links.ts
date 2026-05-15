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
    name: "远潮观月者",
    archetype: "The Far-Tide Moon Watcher",
    theaterHref: "/theater?part1_id=part1_ebc4el2y&theater_script_id=theater_fcm6q0k8",
    constellationHref: "/constellation?constellation_id=const_qaub8gcl",
  },
  {
    pack: "B",
    name: "星图筑序者",
    archetype: "The Star-Map Architect",
    theaterHref: "/theater?part1_id=part1_s575l1t7&theater_script_id=theater_003qj9px",
    constellationHref: "/constellation?constellation_id=const_h572ny90",
  },
  {
    pack: "C",
    name: "月港栖岸者",
    archetype: "The Moon-Harbor Keeper",
    theaterHref: "/theater?part1_id=part1_pydb5on7&theater_script_id=theater_di7oz5x2",
    constellationHref: "/constellation?constellation_id=const_lufzlqfx",
  },
];
