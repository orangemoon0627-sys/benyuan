export const BENYUAN_THEATER_ACT2_CHOICE_TEXT: Record<string, string> = {
  "1A": "靠近那封信，让潮水先读出第一行",
  "1B": "停下脚步，先看清信封背面的光",
  "1C": "沿着回声回应一句话，再等它回来",
  "1D": "绕开信封，先把自己的影子带到前面",
  "2A": "停下脚步，看那个人如何对待照片",
  "2B": "走向桥中央，把照片推回一点点",
  "2C": "留在并肩的位置，让同一段声音流过你们",
  "2D": "回望来路，把桥暂时留给月光",
  "3A": "把信收进口袋，先让轨道稳定下来",
  "3B": "伸手触碰星体边缘，允许未知靠近",
  "3C": "留在两股引力之间，听它们同时说话",
  "3D": "沿着暗金轨道，寻找没有标出的出口",
  "4A": "把那些总会回来的旧画面交给星图",
  "4B": "把迟迟没有说出口的靠近放进月光里",
  "4C": "把保护自己的边界放到暗金轨道上",
  "4D": "把犹豫之后仍会前行的那一步交给桥",
};

export const BENYUAN_THEATER_MIRROR_CHOICE_TEXT: Record<string, string> = {
  "3A-1": "我想被真正听懂，但不想被急着解释",
  "3A-2": "我需要先确认自己的感受，再决定怎么说",
  "3A-3": "我想先确认这件事不会打乱我的边界",
  "3A-4": "我更想保留一点自由，不被任何答案固定住",
  "3A-5": "我在意它是否真的有意义，而不只是情绪",
  "3A-6": "我需要先把心里的波动放稳，再继续靠近",
  "3A-7": "我还不确定，只能先承认它确实影响了我",
  "3B-1": "先看我总会回头想起的那部分过去",
  "3B-2": "先看我现在真正想改变的现实处境",
  "3B-3": "先看我对未来最放不下的不确定感",
  "3B-4": "先看我为什么会在意别人怎么看我",
  "3B-5": "先看我对自己最难放松的那一面",
  "3B-6": "先看我怎样在矛盾里仍然保持平静",
};

export function getTheaterAct2ChoiceText(selected: string | undefined) {
  return selected ? BENYUAN_THEATER_ACT2_CHOICE_TEXT[selected] : undefined;
}

export function getTheaterMirrorChoiceText(selected: string | undefined) {
  return selected ? BENYUAN_THEATER_MIRROR_CHOICE_TEXT[selected] : undefined;
}

export function describeTheaterAct2Selection(selected: string | undefined) {
  const text = getTheaterAct2ChoiceText(selected);
  return selected ? (text ? `${selected}（${text}）` : selected) : "未选择";
}

export function describeTheaterMirrorSelection(selected: string | undefined) {
  const text = getTheaterMirrorChoiceText(selected);
  return selected ? (text ? `${selected}（${text}）` : selected) : "未选择";
}
