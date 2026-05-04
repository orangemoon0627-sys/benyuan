import type { AgentRuntimeOverride, Part1AnswerMap, Part2ChoiceRecord, Part2MirrorRecord } from "@/lib/benyuan-v3-types";

export const BENYUAN_PART1_STORAGE_KEY = "benyuan-v3-part1-answers";
export const BENYUAN_RUNTIME_STORAGE_KEY = "benyuan-v3-runtime-override";
export const BENYUAN_SESSION_STORAGE_KEY = "benyuan-v3-last-session";
export const BENYUAN_PART1_STARTED_KEY = "benyuan-v3-part1-started-at";
export const BENYUAN_PENDING_PART1_KEY = "benyuan-v3-pending-part1";
export const BENYUAN_PENDING_PART2_KEY = "benyuan-v3-pending-part2";

export type BenyuanRuntimeSnapshot = {
  provider?: string;
  model?: string;
  mode?: string;
  request_id?: string;
  error?: string;
};

export type BenyuanSessionState = {
  part1_id?: string;
  theater_script_id?: string;
  constellation_id?: string;
  part1_started_at?: number;
  part1_completed_at?: number;
  part1_time?: number;
  part2_started_at?: number;
  runtime_override?: AgentRuntimeOverride;
  multimodal_runtime?: BenyuanRuntimeSnapshot;
  theater_runtime?: BenyuanRuntimeSnapshot;
  constellation_runtime?: BenyuanRuntimeSnapshot;
};

export type BenyuanPart1Checkpoint = {
  part1_id?: string;
  multimodal_runtime?: BenyuanRuntimeSnapshot;
  theater_script_id?: string;
  theater_runtime?: BenyuanRuntimeSnapshot;
  active_stage_key?: string;
  active_stage_started_at?: number;
};

export type BenyuanPendingPart1 = {
  user_id: string;
  answers: Part1AnswerMap;
  runtime_override?: AgentRuntimeOverride;
  part1_started_at: number;
  submitted_at: number;
  checkpoint?: BenyuanPart1Checkpoint;
};

export type BenyuanPendingPart2Checkpoint = {
  part2_id?: string;
  constellation_id?: string;
  constellation_runtime?: BenyuanRuntimeSnapshot;
  active_stage_key?: string;
  active_stage_started_at?: number;
};

export type BenyuanPendingPart2 = {
  part1_id: string;
  theater_script_id: string;
  runtime_override?: AgentRuntimeOverride;
  choice_logs: Part2ChoiceRecord[];
  mirror_logs: Part2MirrorRecord[];
  metadata: {
    total_time?: number;
    part1_time?: number;
    part2_time?: number;
    device?: string;
    hesitation_patterns?: Array<Record<string, unknown>>;
    phase_durations?: Record<string, number>;
    hover_totals?: Record<string, number>;
  };
  checkpoint?: BenyuanPendingPart2Checkpoint;
};
