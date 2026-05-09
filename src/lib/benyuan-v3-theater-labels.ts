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
};

export const BENYUAN_THEATER_MIRROR_CHOICE_TEXT: Record<string, string> = {
  "3A-1": "交给一个真正听得懂沉默的人",
  "3A-2": "先交还给自己，还不急着解释",
  "3A-3": "放进一盏稳定的灯下，等它安静",
  "3A-4": "让它随潮水漂远，换一片空气",
  "3A-5": "留在星体中心，继续追问它的意义",
  "3A-6": "贴近胸口，先让呼吸慢下来",
  "3A-7": "暂时不处理，只承认它曾经存在",
  "3B-1": "把过去那一半轻轻转向现在",
  "3B-2": "把现在这一半推近一点现实",
  "3B-3": "把未来那一半留给尚未发生的路",
  "3B-4": "把别人眼中的光调暗一些",
  "3B-5": "把看向自己的光调得柔和一点",
  "3B-6": "不移动它，只看裂纹如何继续发亮",
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
