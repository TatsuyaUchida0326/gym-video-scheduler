import type { Schedule } from '../types';
import { getDayOfWeek, toMinutesOfDay } from '../utils/timeUtils.ts';

export type UpcomingSchedule = {
  schedule: Schedule;
  startsAt: Date;
};

const DAYS_TO_SEARCH = 7; // 来週の同じ曜日まで

// now より後で最初に来る有効な予約を返す
export function findNextSchedule(schedules: Schedule[], now: Date): UpcomingSchedule | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (let offset = 0; offset <= DAYS_TO_SEARCH; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const day = getDayOfWeek(date);

    const candidates = schedules
      .filter(schedule => schedule.enabled && schedule.day === day)
      .map(schedule => ({ schedule, minutes: toMinutesOfDay(schedule.time) }))
      .filter(({ minutes }) => Number.isFinite(minutes) && (offset > 0 || minutes > nowMinutes))
      .sort((a, b) => a.minutes - b.minutes);

    const first = candidates[0];
    if (first) {
      date.setHours(Math.floor(first.minutes / 60), first.minutes % 60);
      return { schedule: first.schedule, startsAt: date };
    }
  }
  return null;
}
