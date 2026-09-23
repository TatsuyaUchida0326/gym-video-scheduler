import { useEffect } from 'react';
import { PLAYED_KEY } from '../types';
import type { Schedule, PlayedToday } from '../types';
import { getDateString } from '../utils/timeUtils';
import { findDueSchedule, playedKey } from '../lib/findDueSchedule';
import { readJson, writeJson } from '../lib/storage';

const CHECK_INTERVAL_MS = 10_000;

function loadPlayedToday(now: Date): PlayedToday {
  const today = getDateString(now);
  const saved = readJson(PLAYED_KEY) as Partial<PlayedToday> | undefined;
  if (saved?.date === today && Array.isArray(saved.playedScheduleIds)) {
    return { date: today, playedScheduleIds: saved.playedScheduleIds };
  }
  return { date: today, playedScheduleIds: [] };
}

function markAsPlayed(played: PlayedToday, schedule: Schedule) {
  writeJson(PLAYED_KEY, { ...played, playedScheduleIds: [...played.playedScheduleIds, playedKey(schedule)] });
}

interface UseSchedulerOptions {
  schedules: Schedule[];
  enabled: boolean;
  onTrigger: (schedule: Schedule) => void;
}

// enabled の間だけ 10 秒ごとに予約を確認する。
// enabled が true に戻った瞬間にも 1 回確認するので、設定画面から戻った直後の予約も拾える
export function useScheduler({ schedules, enabled, onTrigger }: UseSchedulerOptions) {
  useEffect(() => {
    if (!enabled) return;

    const check = () => {
      const now = new Date();
      const played = loadPlayedToday(now);
      const due = findDueSchedule(schedules, played.playedScheduleIds, now);
      if (!due) return;
      markAsPlayed(played, due);
      onTrigger(due);
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [schedules, enabled, onTrigger]);
}
