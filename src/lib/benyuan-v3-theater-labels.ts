export const BENYUAN_THEATER_ACT2_CHOICE_TEXT: Record<string, string> = {
  "1A": "先回电话，确认是谁留下了寄存物",
  "1B": "推门进去，查看柜台上的登记簿",
  "1C": "把地址发给朋友，请他在门外等你",
  "1D": "绕到侧门，确认屋里是否还有人",
  "2A": "请对方进来，当面把事情说清",
  "2B": "走到街对面，只先问一个问题",
  "2C": "发一张现场照片，等对方先开口",
  "2D": "暂时不回复，先看完纸袋里的东西",
  "3A": "带走两只盒子，明天再逐一归还",
  "3B": "只拿属于你的，把另一只留在柜台",
  "3C": "请对方进来，你们一起决定归属",
  "3D": "拍下现状后全部放回，今晚先离开",
  "4A": "把那份决定交给对方，当面说出实情",
  "4B": "带走自己的部分，约定明晚再谈",
  "4C": "请店主继续保管，并写下回复日期",
  "4D": "先把所有物品转到安全处，停止争论",
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

export function getPart2ChoiceText(choice: Part2ChoiceRecord) {
  const snapshot = choice.option_text?.trim();
  return snapshot || "";
}

export function getPart2ChoiceTraitSignal(choice: Part2ChoiceRecord) {
  return choice.trait_signal?.trim() || "";
}

export function describePart2ChoiceSelection(choice: Part2ChoiceRecord) {
  const text = getPart2ChoiceText(choice);
  const signal = getPart2ChoiceTraitSignal(choice);
  if (!text && !signal) {
    return `${choice.selected}（历史语义不可恢复，不作为精神证据）`;
  }
  if (!text) {
    return `${choice.selected}（精神信号 ${signal}）`;
  }
  return `${choice.selected}（${text}${signal ? `；精神信号 ${signal}` : ""}）`;
}

export function describeTheaterMirrorSelection(selected: string | undefined) {
  const text = getTheaterMirrorChoiceText(selected);
  return selected ? (text ? `${selected}（${text}）` : selected) : "未选择";
}
import type { Part2ChoiceRecord } from "@/lib/benyuan-v3-types";
