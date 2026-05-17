export type BenyuanModuleKey = "A" | "B" | "C";
export type BenyuanQuestionKind = "single" | "multi" | "upload" | "distribution";
export type BenyuanDataCohort = "beta" | "public" | "local";
export type BenyuanDataEnvironment = "development" | "staging" | "production" | "test";
export type BigFiveKey = "openness" | "conscientiousness" | "extraversion" | "agreeableness" | "neuroticism";
export type SevenDimensionKey =
  | "openness"
  | "independence"
  | "emotional_depth"
  | "meaning_seeking"
  | "aesthetic_sensitivity"
  | "action_tendency"
  | "relationship_need";

export type BenyuanQuestionOption = {
  id: string;
  text: string;
  psychologicalSignal?: string;
  tags?: string[];
};

export type BenyuanQuestion = {
  id: string;
  module: BenyuanModuleKey;
  title: string;
  prompt: string;
  kind: BenyuanQuestionKind;
  minSelections?: number;
  maxSelections?: number;
  options?: BenyuanQuestionOption[];
  outputKey: string;
  helperText?: string;
  distributionKeys?: Array<{ key: "past" | "present" | "future"; label: string }>;
  analysisDimensions?: string[];
  acceptedFiles?: string;
  uploadRange?: { min: number; max: number };
};

export type MusicAnalysis = {
  primary_genres: string[];
  emotional_tone: string;
  era_distribution: Record<string, number>;
  language_diversity: string[];
  personality_signals: Record<string, string>;
  recognized_tracks?: Array<{
    title: string;
    artist?: string;
    confidence?: "high" | "medium" | "low";
  }>;
  public_metadata?: {
    lookup_status: "not_requested" | "matched" | "partial" | "failed";
    sources: string[];
    genres: string[];
    artists: string[];
    eras: string[];
    mood_keywords: string[];
    notes: string;
  };
};

export type SocialPostAnalysis = {
  post_id: number;
  text_content: string;
  emotional_tone: string;
  themes: string[];
  expression_style: string;
  self_presentation: string;
  time_clue: string;
  psychological_signals: string[];
};

export type SocialPostOverallPattern = {
  dominant_emotion: string;
  core_themes: string[];
  expression_authenticity: string;
};

export type PreciousPhotoAnalysis = {
  visual_content: string;
  composition: string;
  lighting: string;
  color_mood: string;
  symbolic_elements: string[];
  psychological_interpretation: {
    core_themes: string[];
    emotional_tone: string;
    self_concept: string;
    existential_stance: string;
    traits: string[];
  };
};

export type Part1Data = {
  aesthetics: {
    core_desire_image?: string;
    music_analysis?: MusicAnalysis | null;
    literature?: string[];
    cinema?: string;
    inspiration_scene?: string;
  };
  philosophy: {
    night_thoughts?: string;
    decision_style?: string;
    emotion_pattern?: string;
    time_orientation?: { past: number; present: number; future: number };
    relationship_philosophy?: string;
  };
  narrative: {
    social_posts_analysis?: SocialPostAnalysis[] | null;
    social_posts_overall_pattern?: SocialPostOverallPattern | null;
    precious_photo_analysis?: PreciousPhotoAnalysis | null;
    resonance_moments?: string[];
  };
};

export type AggregatedTraits = {
  big_five: Record<BigFiveKey, number>;
  core_themes: string[];
  archetype_hints: string[];
};

export type Part1AnswerMap = Record<string, unknown>;

export type Part1SubmissionInput = {
  user_id?: string;
  answers: Part1AnswerMap;
};

export type Part1Record = {
  part1_id: string;
  user_id: string;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  created_at: string;
  updated_at: string;
  answers: Part1AnswerMap;
  part1_data: Part1Data;
  aggregated_traits: AggregatedTraits;
};

export type BenyuanPart1HistoryRecordResponse = Pick<Part1Record, "part1_id" | "user_id" | "created_at" | "updated_at" | "answers">;

export type BenyuanUploadedAssetRef = {
  asset_id: string;
  question_id: string;
  owner_user_id: string;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  name: string;
  size: number;
  mime_type: string;
  uploaded_at: string;
  sha256?: string;
  upload_origin?: string;
};

export type BenyuanStoredAsset = BenyuanUploadedAssetRef & {
  stored_path: string;
};

export type MultimodalInputItem = {
  visible_text?: string;
  source?: string;
  description?: string;
  asset_id?: string;
  file_name?: string;
  mime_type?: string;
};

export type MultimodalAnalysisInput = {
  part1_id: string;
  music_inputs?: MultimodalInputItem[];
  social_post_inputs?: MultimodalInputItem[];
  precious_photo_input?: MultimodalInputItem;
  runtime_override?: AgentRuntimeOverride;
};

export type TheaterChoiceOption = {
  id: string;
  text: string;
  trait_signal: string;
  response: string;
};

export type TheaterChoice = {
  choice_id: number;
  scene: string;
  options: TheaterChoiceOption[];
};

export type TheaterMirrorQuestionOption = {
  id: string;
  text: string;
  trait_signal: string;
};

export type TheaterMirrorQuestion = {
  question_id: number;
  dialogue: string;
  question: string;
  options: TheaterMirrorQuestionOption[];
};

export type TheaterScript = {
  user_id: string;
  generated_at: string;
  personalization_summary: {
    core_archetype: string;
    aesthetic_style: string;
    emotional_tone: string;
    key_themes: string[];
  };
  act1: {
    scene_description: string;
    visual_prompt: string;
    ambient_sound: string;
    duration: number;
  };
  act2: {
    choices: TheaterChoice[];
  };
  act3: {
    scene_description: string;
    mirror_questions: TheaterMirrorQuestion[];
    mirror_final_words: string;
  };
  epilogue: {
    scene_description: string;
    closing_text: string;
    transition_prompt: string;
    transition_animation: string;
  };
};

export type TheaterScriptRecord = {
  theater_script_id: string;
  part1_id: string;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  created_at: string;
  runtime: AgentRuntimeResult;
  theater_script: TheaterScript;
};

export type Part2ChoiceRecord = {
  choice_id: number;
  selected: string;
  hesitation_time?: number;
  hover_sequence?: string[];
  timestamp: string;
};

export type Part2MirrorRecord = {
  question_id: number;
  selected: string;
  hesitation_time?: number;
  timestamp: string;
};

export type Part2Metadata = {
  total_time?: number;
  part1_time?: number;
  part2_time?: number;
  device?: string;
  hesitation_patterns?: Array<Record<string, unknown>>;
  phase_durations?: Record<string, number>;
  hover_totals?: Record<string, number>;
};

export type Part2Record = {
  part2_id: string;
  part1_id: string;
  theater_script_id: string;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  created_at: string;
  act2_choices: Part2ChoiceRecord[];
  act3_responses: Part2MirrorRecord[];
  metadata: Part2Metadata;
};

export type BenyuanPart2HistoryRecordResponse = Part2Record;

export type PsycheArchetype = {
  name: string;
  english_name: string;
  personalized_name?: string;
  personalized_subtitle?: string;
  core_essence: string;
  visual_prompt: string;
};

export type PsycheDimension = {
  score: number;
  interpretation: string;
};

export type PsycheConstellation = {
  user_id: string;
  generated_at: string;
  archetype: PsycheArchetype;
  seven_dimensions: Record<SevenDimensionKey, PsycheDimension>;
  narrative_overview: string;
  core_tensions: Array<{
    tension_id: number;
    name: string;
    description: string;
    growth_direction: string;
  }>;
  growth_suggestions: Array<{
    title: string;
    description: string;
    actionable_steps: string[];
  }>;
  recommendations: {
    books: Array<{ title: string; author: string; reason: string }>;
    films: Array<{ title: string; director: string; reason: string }>;
    music: Array<{ artist: string; album: string; reason: string }>;
  };
};

export type ConstellationRecord = {
  constellation_id: string;
  part1_id: string;
  part2_id: string;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  created_at: string;
  runtime: AgentRuntimeResult;
  psyche_constellation: PsycheConstellation;
  archetype_image_url?: string;
};

export type BenyuanNativeGenerationJobKind = "theater" | "constellation";
export type BenyuanNativeGenerationJobStatus = "queued" | "running" | "done" | "failed";
export type BenyuanNativeGenerationJobStage = "queued" | "multimodal" | "theater" | "constellation" | "done" | "failed";
export type BenyuanNativeGenerationJobProgressBasis = "server_stage_elapsed" | "completed" | "failed";

export type BenyuanNativeGenerationJobStageDetail = {
  label: string;
  step_index: number;
  step_count: number;
  progress_min: number;
  progress_max: number;
  elapsed_ms: number;
  expected_ms: number;
  cache_status?: "cold" | "partial_cache_hit" | "cache_hit" | "no_assets";
  asset_count?: number;
};

export type BenyuanNativeGenerationJobStageTiming = {
  status: "running" | "done" | "failed";
  started_at: string;
  updated_at: string;
  duration_ms?: number;
  cache_status?: "cold" | "partial_cache_hit" | "cache_hit" | "no_assets";
  asset_count?: number;
};

export type BenyuanNativeGenerationJob = {
  job_id: string;
  user_id: string;
  part1_id: string;
  part2_id?: string;
  theater_script_id?: string;
  constellation_id?: string;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  kind: BenyuanNativeGenerationJobKind;
  status: BenyuanNativeGenerationJobStatus;
  current_stage: BenyuanNativeGenerationJobStage;
  progress: number;
  stage_progress?: number;
  progress_basis?: BenyuanNativeGenerationJobProgressBasis;
  stage_started_at?: string;
  stage_updated_at?: string;
  stage_detail?: BenyuanNativeGenerationJobStageDetail;
  stage_timings?: Partial<Record<BenyuanNativeGenerationJobStage, BenyuanNativeGenerationJobStageTiming>>;
  message: string;
  can_resume_in_background: true;
  error?: string;
  created_at: string;
  updated_at: string;
  finished_at?: string;
};

export type AgentReasoningEffort = "low" | "medium" | "high" | "xhigh";

export type AgentRuntimeOverride = {
  api_key?: string;
  base_url?: string;
  model?: string;
  provider_name?: string;
  reasoning_effort?: AgentReasoningEffort;
  disable_response_storage?: boolean;
  live?: boolean;
};

export type AgentRuntimeResult = {
  provider: string;
  model: string;
  mode: "live" | "fallback";
  request_id?: string;
  error?: string;
};

export type BenyuanAuthProvider = "anonymous" | "apple" | "wechat" | "phone";

export type BenyuanUser = {
  user_id: string;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  created_at: string;
  updated_at: string;
  display_name?: string;
  primary_provider: BenyuanAuthProvider;
  providers: Partial<Record<BenyuanAuthProvider, string>>;
  phone_bound?: boolean;
  wechat_bound?: boolean;
};

export type BenyuanAuthSession = {
  session_id: string;
  user_id: string;
  token: string;
  provider: BenyuanAuthProvider;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  created_at: string;
  updated_at: string;
  revoked_at?: string;
};

export type BenyuanPhoneOtp = {
  phone: string;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  code_hash: string;
  created_at: string;
  expires_at: string;
  consumed_at?: string;
  attempts: number;
};

export type BenyuanAuthProviderIndex = {
  provider: BenyuanAuthProvider;
  provider_subject: string;
  user_id: string;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  created_at: string;
  updated_at: string;
};

export type BenyuanAuthRateLimit = {
  key: string;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  count: number;
  reset_at: string;
  updated_at: string;
};

export type BenyuanAccountHistoryStage = "part1" | "theater" | "part2" | "constellation";

export type BenyuanAccountHistoryItem = {
  part1_id: string;
  theater_script_id?: string;
  part2_id?: string;
  constellation_id?: string;
  stage: BenyuanAccountHistoryStage;
  title: string;
  subtitle: string;
  archetype_name?: string;
  created_at: string;
  updated_at: string;
  asset_count: number;
};

export type BenyuanAccountHistoryResponse = {
  items: BenyuanAccountHistoryItem[];
};

export type BenyuanFeedbackKind = "issue" | "ui" | "content" | "speed" | "other";

export type BenyuanFeedbackStage = "auth" | "account" | "collect" | "processing" | "theater" | "constellation" | "unknown";

export type BenyuanFeedbackStatus = "new" | "processing" | "completed" | "declined";

export type BenyuanFeedbackRecord = {
  feedback_id: string;
  user_id: string;
  auth_session_id: string;
  data_cohort: BenyuanDataCohort;
  data_environment: BenyuanDataEnvironment;
  kind: BenyuanFeedbackKind;
  status?: BenyuanFeedbackStatus;
  status_updated_at?: string;
  message: string;
  stage: BenyuanFeedbackStage;
  part1_id?: string;
  theater_script_id?: string;
  part2_id?: string;
  constellation_id?: string;
  device_context?: Record<string, unknown>;
  created_at: string;
};

export type BenyuanFeedbackSubmitResponse = {
  ok: true;
  feedback_id: string;
  created_at: string;
};

export type BenyuanTestPlanStatus = "pending" | "testing" | "needs_fix" | "passed";

export type BenyuanTestPlanSource = "system_regression" | "feedback_derived";

export type BenyuanTestPlanExecutionState =
  | "implemented_needs_verification"
  | "needs_hardening"
  | "blocked_external_resources";

export type BenyuanTestPlanItem = {
  test_plan_item_id: string;
  title: string;
  area: string;
  source: BenyuanTestPlanSource;
  execution_state: BenyuanTestPlanExecutionState;
  status: BenyuanTestPlanStatus;
  verification: string;
  feedback_keywords: string[];
  created_at: string;
  updated_at: string;
};

export type BenyuanV3Store = {
  users: Record<string, BenyuanUser>;
  auth_sessions: Record<string, BenyuanAuthSession>;
  phone_otps: Record<string, BenyuanPhoneOtp>;
  auth_provider_index: Record<string, BenyuanAuthProviderIndex>;
  auth_rate_limits: Record<string, BenyuanAuthRateLimit>;
  uploaded_assets: Record<string, BenyuanStoredAsset>;
  part1_records: Record<string, Part1Record>;
  theater_scripts: Record<string, TheaterScriptRecord>;
  part2_records: Record<string, Part2Record>;
  constellations: Record<string, ConstellationRecord>;
  native_generation_jobs: Record<string, BenyuanNativeGenerationJob>;
  feedback_records: Record<string, BenyuanFeedbackRecord>;
  test_plan_items: Record<string, BenyuanTestPlanItem>;
};
