export type DayOfWeek = "月" | "火" | "水" | "木" | "金" | "土" | "日";

export type Schedule = {
  id: string;
  name: string;
  day: DayOfWeek;    // 1スケジュール＝1曜日（旧データの `days` は読み込み時に移す）
  time: string;      // "HH:MM"
  videoKey: string;
  videoName: string;
  enabled: boolean;  // 旧データで項目が無いものは読み込み時に true へそろえる
};

export type Poster = {
  id: string;
  imageKey: string;
  name: string;
  addedAt: string;
};

export type AppConfig = {
  slideIntervalSec: number;
  fadeSec: number;
};

export type PlayedToday = {
  date: string; // "YYYY-MM-DD"
  playedScheduleIds: string[];
};

export type PlaybackOutcome =
  | { status: "completed" }
  | { status: "stopped" }
  | { status: "failed"; reason: string };

export type PlaybackLogEntry = {
  id: string;
  finishedAt: string; // ISO 8601
  scheduleName: string;
  day: DayOfWeek;
  time: string;
  status: PlaybackOutcome["status"];
  reason?: string;
};

export type AppScreen = "launch" | "slideshow" | "player" | "settings";

export const SCHEDULE_KEY     = "gym_schedules";
export const POSTER_KEY       = "gym_posters";
export const CONFIG_KEY       = "gym_config";
export const PLAYED_KEY       = "gym_played_today";
export const PLAYBACK_LOG_KEY = "gym_playback_log";

export const DEFAULT_CONFIG: AppConfig = {
  slideIntervalSec: 30,
  fadeSec: 1,
};

// 設定値の許容範囲。範囲外や数値でない値（空欄など）は保存前にここへ丸める
export const CONFIG_LIMITS: Record<keyof AppConfig, { min: number; max: number }> = {
  slideIntervalSec: { min: 5, max: 300 },
  fadeSec: { min: 0, max: 10 },
};

export const DAY_LABELS: DayOfWeek[] = ["月", "火", "水", "木", "金", "土", "日"];

// 休館日。予約一覧の曜日タブに出さない
export const CLOSED_DAYS: DayOfWeek[] = ["月"];
