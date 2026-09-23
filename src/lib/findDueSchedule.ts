import type { Schedule } from '../types';
import { getDayOfWeek, getTimeString, toMinutesOfDay } from '../utils/timeUtils.ts';

// 予約時刻を過ぎてもこの分数以内なら再生する。
// 設定画面に居た・前の動画が長かった・起動が遅れた、で「その1分」を逃しても取り返すための猶予
export const TRIGGER_GRACE_MINUTES = 5;

export function playedKey(schedule: Schedule): string {
  return `${schedule.id}:${schedule.time}`;
}

// いま再生すべき予約を返す。複数あれば予約時刻が早いものを優先する
export function findDueSchedule(schedules: Schedule[], playedKeys: string[], now: Date): Schedule | null {
  const today = getDayOfWeek(now);
  const nowMinutes = toMinutesOfDay(getTimeString(now));

  const due = schedules.filter(schedule => {
    if (!schedule.enabled || schedule.day !== today) return false;
    if (playedKeys.includes(playedKey(schedule))) return false;
    const lateMinutes = nowMinutes - toMinutesOfDay(schedule.time);
    return lateMinutes >= 0 && lateMinutes <= TRIGGER_GRACE_MINUTES;
  });

  due.sort((a, b) => toMinutesOfDay(a.time) - toMinutesOfDay(b.time));
  return due[0] ?? null;
}
