export const assessmentModuleLabels: Record<string, string> = {
  entry_state: "进入状态",
  emotional_weather: "情感气候",
  aesthetic_fingerprint: "审美语法",
  temporal_philosophy: "时间哲学",
  open_reflection: "开放反思",
};

export const moodKeywordOptions = ["迷茫", "疲惫", "希望", "平静", "兴奋", "低压"];

export const lifeStageOptions = [
  { value: "student", label: "学生期" },
  { value: "early_career", label: "职场起步" },
  { value: "stable_period", label: "稳定阶段" },
  { value: "turning_point", label: "转折阶段" },
  { value: "exploration", label: "探索阶段" },
] as const;
