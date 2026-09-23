import { DAY_LABELS } from '../types/index.ts';
import type { DayOfWeek, PlaybackLogEntry, Poster, Schedule } from '../types/index.ts';

// localStorage から読んだ値を型どおりの配列に直す。形が崩れた要素は捨てる

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function isDayOfWeek(value: unknown): value is DayOfWeek {
  return typeof value === 'string' && (DAY_LABELS as string[]).includes(value);
}

function toRecords(raw: unknown): UnknownRecord[] {
  return Array.isArray(raw) ? raw.filter(isRecord) : [];
}

export function parseSchedules(raw: unknown): Schedule[] {
  return toRecords(raw).flatMap(record => {
    const day = record.day ?? record.days; // 旧形式は `days`
    if (
      typeof record.id !== 'string' ||
      typeof record.time !== 'string' ||
      typeof record.videoKey !== 'string' ||
      !isDayOfWeek(day)
    ) {
      return [];
    }
    return [{
      id: record.id,
      name: asString(record.name),
      day,
      time: record.time,
      videoKey: record.videoKey,
      videoName: asString(record.videoName),
      enabled: record.enabled !== false, // 旧形式は項目なし＝有効
    }];
  });
}

export function parsePosters(raw: unknown): Poster[] {
  return toRecords(raw).flatMap(record => {
    if (typeof record.id !== 'string' || typeof record.imageKey !== 'string') return [];
    return [{
      id: record.id,
      imageKey: record.imageKey,
      name: asString(record.name),
      addedAt: asString(record.addedAt),
    }];
  });
}

const PLAYBACK_STATUSES = ['completed', 'stopped', 'failed'];

export function parsePlaybackLog(raw: unknown): PlaybackLogEntry[] {
  return toRecords(raw).flatMap(record => {
    if (
      typeof record.id !== 'string' ||
      typeof record.finishedAt !== 'string' ||
      !isDayOfWeek(record.day) ||
      !PLAYBACK_STATUSES.includes(record.status as string)
    ) {
      return [];
    }
    return [{
      id: record.id,
      finishedAt: record.finishedAt,
      scheduleName: asString(record.scheduleName),
      day: record.day,
      time: asString(record.time),
      status: record.status as PlaybackLogEntry['status'],
      ...(typeof record.reason === 'string' ? { reason: record.reason } : {}),
    }];
  });
}
