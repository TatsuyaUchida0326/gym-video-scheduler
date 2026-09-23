import type { PlaybackLogEntry, PlaybackOutcome, Schedule } from '../types';

export const PLAYBACK_LOG_LIMIT = 100;

export function createLogEntry(schedule: Schedule, outcome: PlaybackOutcome, finishedAt: Date, id: string): PlaybackLogEntry {
  return {
    id,
    finishedAt: finishedAt.toISOString(),
    scheduleName: schedule.name,
    day: schedule.day,
    time: schedule.time,
    status: outcome.status,
    ...(outcome.status === 'failed' ? { reason: outcome.reason } : {}),
  };
}

// 新しい順に並べ、上限を超えた古いものは捨てる
export function prependLogEntry(entries: PlaybackLogEntry[], entry: PlaybackLogEntry): PlaybackLogEntry[] {
  return [entry, ...entries].slice(0, PLAYBACK_LOG_LIMIT);
}

export function countRecentFailures(entries: PlaybackLogEntry[], now: Date, days: number): number {
  const since = now.getTime() - days * 24 * 60 * 60 * 1000;
  return entries.filter(entry => entry.status === 'failed' && Date.parse(entry.finishedAt) >= since).length;
}
