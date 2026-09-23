import type { DayOfWeek } from '../types';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: '日',
  1: '月',
  2: '火',
  3: '水',
  4: '木',
  5: '金',
  6: '土',
};

// 3つの関数は同じ `now` を渡して使う。別々に new Date() すると日付の変わり目で曜日と時刻がずれる
export function getDayOfWeek(now: Date = new Date()): DayOfWeek {
  return DAY_MAP[now.getDay()];
}

export function getTimeString(now: Date = new Date()): string {
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function getDateString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// "HH:MM" を 0 時からの分数にする。形式が崩れていれば NaN
export function toMinutesOfDay(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return NaN;
  return hour * 60 + minute;
}
